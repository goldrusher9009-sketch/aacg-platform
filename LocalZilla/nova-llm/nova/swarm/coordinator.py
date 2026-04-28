"""
Nova Swarm Coordinator — The Central Hub
==========================================

The coordinator is the brain of the distributed training network.
It manages worker connections, aggregates updates, and serves the
current model state. Any machine (even without a GPU) can run it.

Architecture:
  - WebSocket server for real-time worker communication
  - REST API for status monitoring and control
  - Trust-weighted aggregation of worker updates
  - Automatic checkpoint saving
  - Dashboard for monitoring training progress

Protocol:
  1. Worker connects via WebSocket
  2. Coordinator sends current model weights
  3. Worker trains locally for N steps
  4. Worker sends compressed gradient update
  5. Coordinator aggregates updates (trust-weighted)
  6. Coordinator broadcasts updated weights
  7. Repeat from step 3
"""

import asyncio
import json
import hashlib
import pickle
import struct
import time
import gzip
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, Optional, Set
from collections import defaultdict

import torch

from nova.swarm.aso_optimizer import ASOConfig, TrustAggregator, MomentumDecomposer


# ---------------------------------------------------------------------------
# Message Protocol
# ---------------------------------------------------------------------------

class MessageType:
    # Worker -> Coordinator
    REGISTER = "register"
    HEARTBEAT = "heartbeat"
    SUBMIT_UPDATE = "submit_update"
    REQUEST_WEIGHTS = "request_weights"

    # Coordinator -> Worker
    WELCOME = "welcome"
    WEIGHTS = "weights"
    SYNC_REQUEST = "sync_request"
    TRAINING_CONFIG = "training_config"
    KICK = "kick"
    STATUS = "status"


@dataclass
class WorkerInfo:
    worker_id: str
    gpu_name: str
    gpu_memory_gb: float
    connected_at: float
    last_heartbeat: float
    steps_completed: int
    updates_submitted: int
    avg_loss: float
    trust_score: float
    status: str  # "training", "syncing", "idle"


# ---------------------------------------------------------------------------
# Coordinator Server
# ---------------------------------------------------------------------------

class SwarmCoordinator:
    """Central coordinator for distributed Nova LLM training.

    Manages the swarm of volunteer GPU workers, aggregates their
    updates using trust-weighted averaging, and maintains the
    canonical model state.
    """

    def __init__(
        self,
        model_state_dict: Dict[str, torch.Tensor],
        config: ASOConfig,
        checkpoint_dir: str = "swarm_checkpoints",
        min_workers_for_sync: int = 1,
        sync_timeout: float = 300.0,  # 5 minutes
        heartbeat_timeout: float = 60.0,
    ):
        self.config = config
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.min_workers_for_sync = min_workers_for_sync
        self.sync_timeout = sync_timeout
        self.heartbeat_timeout = heartbeat_timeout

        # Model state (the canonical weights)
        self.model_state = {k: v.clone() for k, v in model_state_dict.items()}
        self.model_version = 0

        # Worker management
        self.workers: Dict[str, WorkerInfo] = {}
        self.worker_connections: Dict[str, object] = {}  # WebSocket connections

        # Trust system
        self.trust_aggregator = TrustAggregator(config)

        # Pending updates buffer
        self.pending_updates: Dict[str, Dict[str, torch.Tensor]] = {}

        # Training stats
        self.total_steps = 0
        self.total_updates = 0
        self.global_loss_history = []
        self.start_time = time.time()

        # Decompressor for receiving compressed updates
        self.decomposer = MomentumDecomposer(config)

        print(f"Coordinator initialized")
        print(f"  Model parameters: {sum(v.numel() for v in self.model_state.values()):,}")
        print(f"  Checkpoint dir: {self.checkpoint_dir}")

    # --- Worker Management ---

    def register_worker(self, worker_id: str, gpu_info: dict) -> dict:
        """Register a new worker."""
        self.workers[worker_id] = WorkerInfo(
            worker_id=worker_id,
            gpu_name=gpu_info.get("gpu_name", "unknown"),
            gpu_memory_gb=gpu_info.get("gpu_memory_gb", 0),
            connected_at=time.time(),
            last_heartbeat=time.time(),
            steps_completed=0,
            updates_submitted=0,
            avg_loss=float("inf"),
            trust_score=self.config.initial_trust,
            status="idle",
        )
        self.trust_aggregator.register_worker(worker_id)

        print(f"[+] Worker {worker_id[:8]}... joined ({gpu_info.get('gpu_name', '?')})")
        print(f"    Active workers: {len(self.workers)}")

        return {
            "type": MessageType.WELCOME,
            "worker_id": worker_id,
            "model_version": self.model_version,
            "config": asdict(self.config),
            "total_workers": len(self.workers),
        }

    def disconnect_worker(self, worker_id: str):
        """Handle worker disconnect."""
        if worker_id in self.workers:
            print(f"[-] Worker {worker_id[:8]}... disconnected")
            del self.workers[worker_id]
            self.trust_aggregator.remove_worker(worker_id)
            self.pending_updates.pop(worker_id, None)
            self.worker_connections.pop(worker_id, None)

    def heartbeat(self, worker_id: str, stats: dict):
        """Process worker heartbeat."""
        if worker_id in self.workers:
            self.workers[worker_id].last_heartbeat = time.time()
            self.workers[worker_id].steps_completed = stats.get("steps", 0)
            self.workers[worker_id].avg_loss = stats.get("avg_loss", float("inf"))
            self.workers[worker_id].status = stats.get("status", "training")

    # --- Update Aggregation ---

    def submit_update(
        self,
        worker_id: str,
        compressed_updates: Dict[str, Dict],
        loss_before: float,
        loss_after: float,
    ) -> dict:
        """Receive a compressed update from a worker.

        Decompresses, stores in pending buffer, and triggers aggregation
        if enough updates have accumulated.
        """
        if worker_id not in self.workers:
            return {"type": "error", "message": "Unknown worker"}

        # Decompress the updates
        decompressed = {}
        for param_name, compressed in compressed_updates.items():
            decompressed[param_name] = MomentumDecomposer.decompress(compressed)

        self.pending_updates[worker_id] = decompressed
        self.workers[worker_id].updates_submitted += 1

        # Record update quality for trust system
        loss_delta = loss_after - loss_before
        self.trust_aggregator.record_update_quality(worker_id, loss_delta)
        self.workers[worker_id].trust_score = self.trust_aggregator.trust_scores.get(
            worker_id, self.config.initial_trust
        )

        # Check if we should aggregate
        if len(self.pending_updates) >= self.min_workers_for_sync:
            self._aggregate_and_update()

        self.total_updates += 1

        return {
            "type": MessageType.STATUS,
            "model_version": self.model_version,
            "trust_score": self.workers[worker_id].trust_score,
            "pending_updates": len(self.pending_updates),
            "total_workers": len(self.workers),
        }

    def _aggregate_and_update(self):
        """Trust-weighted aggregation of all pending updates."""
        if not self.pending_updates:
            return

        print(f"\n  Aggregating {len(self.pending_updates)} updates "
              f"(version {self.model_version} -> {self.model_version + 1})")

        # Trust-weighted aggregation
        aggregated = self.trust_aggregator.aggregate(self.pending_updates)

        # Apply to canonical model state
        for param_name, update in aggregated.items():
            if param_name in self.model_state:
                # Soft update: blend current state with aggregated
                self.model_state[param_name] = (
                    0.5 * self.model_state[param_name] + 0.5 * update
                )

        self.model_version += 1
        self.pending_updates.clear()

        # Report trust scores
        suspicious = self.trust_aggregator.get_suspicious_workers()
        if suspicious:
            print(f"  Warning: suspicious workers: {[w[:8] for w in suspicious]}")

        trust_report = self.trust_aggregator.get_trust_report()
        if trust_report:
            avg_trust = sum(trust_report.values()) / len(trust_report)
            print(f"  Average trust: {avg_trust:.3f}")

        # Auto-checkpoint
        if self.model_version % 10 == 0:
            self.save_checkpoint()

    # --- Model Distribution ---

    def get_model_weights(self) -> Dict[str, torch.Tensor]:
        """Get current canonical model weights."""
        return {k: v.clone() for k, v in self.model_state.items()}

    def get_model_hash(self) -> str:
        """Get a hash of current model state for verification."""
        hasher = hashlib.sha256()
        for name in sorted(self.model_state.keys()):
            hasher.update(name.encode())
            hasher.update(self.model_state[name].cpu().numpy().tobytes()[:1000])
        return hasher.hexdigest()[:16]

    # --- Checkpointing ---

    def save_checkpoint(self):
        """Save current model state and training metadata."""
        path = self.checkpoint_dir / f"swarm_v{self.model_version}.pt"
        checkpoint = {
            "model_state_dict": self.model_state,
            "model_version": self.model_version,
            "total_updates": self.total_updates,
            "trust_scores": self.trust_aggregator.get_trust_report(),
            "config": asdict(self.config),
            "timestamp": time.time(),
        }
        torch.save(checkpoint, path)
        print(f"  Checkpoint saved: {path}")

        # Also save as "latest"
        latest_path = self.checkpoint_dir / "latest.pt"
        torch.save(checkpoint, latest_path)

    # --- Status & Monitoring ---

    def get_status(self) -> dict:
        """Get full swarm status for monitoring dashboard."""
        uptime = time.time() - self.start_time

        return {
            "model_version": self.model_version,
            "total_updates": self.total_updates,
            "active_workers": len(self.workers),
            "pending_updates": len(self.pending_updates),
            "uptime_hours": uptime / 3600,
            "model_hash": self.get_model_hash(),
            "workers": {
                wid: {
                    "gpu": w.gpu_name,
                    "gpu_mem_gb": w.gpu_memory_gb,
                    "steps": w.steps_completed,
                    "updates": w.updates_submitted,
                    "loss": w.avg_loss,
                    "trust": w.trust_score,
                    "status": w.status,
                    "uptime_min": (time.time() - w.connected_at) / 60,
                }
                for wid, w in self.workers.items()
            },
            "trust_report": self.trust_aggregator.get_trust_report(),
            "suspicious_workers": self.trust_aggregator.get_suspicious_workers(),
        }

    def cleanup_stale_workers(self):
        """Remove workers that haven't sent a heartbeat recently."""
        now = time.time()
        stale = [
            wid for wid, w in self.workers.items()
            if now - w.last_heartbeat > self.heartbeat_timeout
        ]
        for wid in stale:
            print(f"[x] Removing stale worker {wid[:8]}...")
            self.disconnect_worker(wid)


# ---------------------------------------------------------------------------
# Network Transport (WebSocket-based)
# ---------------------------------------------------------------------------

def serialize_message(msg: dict) -> bytes:
    """Serialize a message for network transmission."""
    data = pickle.dumps(msg)
    compressed = gzip.compress(data)
    # Length-prefixed framing
    header = struct.pack("!I", len(compressed))
    return header + compressed


def deserialize_message(data: bytes) -> dict:
    """Deserialize a received message."""
    decompressed = gzip.decompress(data)
    return pickle.loads(decompressed)


# ---------------------------------------------------------------------------
# Coordinator Server Runner
# ---------------------------------------------------------------------------

async def run_coordinator_server(
    coordinator: SwarmCoordinator,
    host: str = "0.0.0.0",
    port: int = 8765,
):
    """Run the coordinator as a WebSocket server.

    Requires: pip install websockets

    Each volunteer worker connects to this server, receives model weights,
    trains locally, and submits updates.
    """
    try:
        import websockets
    except ImportError:
        print("WebSocket server requires: pip install websockets")
        print("For local testing, use the LocalSwarmSimulator instead.")
        return

    async def handler(websocket, path):
        worker_id = None
        try:
            async for raw_message in websocket:
                msg = deserialize_message(raw_message)
                msg_type = msg.get("type")

                if msg_type == MessageType.REGISTER:
                    worker_id = msg["worker_id"]
                    response = coordinator.register_worker(worker_id, msg.get("gpu_info", {}))
                    coordinator.worker_connections[worker_id] = websocket
                    await websocket.send(serialize_message(response))

                elif msg_type == MessageType.REQUEST_WEIGHTS:
                    weights = coordinator.get_model_weights()
                    response = {
                        "type": MessageType.WEIGHTS,
                        "model_version": coordinator.model_version,
                        "weights": weights,
                    }
                    await websocket.send(serialize_message(response))

                elif msg_type == MessageType.SUBMIT_UPDATE:
                    response = coordinator.submit_update(
                        worker_id=msg["worker_id"],
                        compressed_updates=msg["updates"],
                        loss_before=msg["loss_before"],
                        loss_after=msg["loss_after"],
                    )
                    await websocket.send(serialize_message(response))

                elif msg_type == MessageType.HEARTBEAT:
                    coordinator.heartbeat(msg.get("worker_id", worker_id), msg.get("stats", {}))

        except Exception as e:
            print(f"Worker error: {e}")
        finally:
            if worker_id:
                coordinator.disconnect_worker(worker_id)

    # Periodic cleanup task
    async def cleanup_loop():
        while True:
            await asyncio.sleep(30)
            coordinator.cleanup_stale_workers()

    print(f"\nNova Swarm Coordinator starting on ws://{host}:{port}")
    print(f"Share this address with volunteers to join training!\n")

    server = await websockets.serve(handler, host, port, max_size=100 * 1024 * 1024)
    cleanup_task = asyncio.create_task(cleanup_loop())

    await server.wait_closed()
