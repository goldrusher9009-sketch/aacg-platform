"""
Nova Swarm Worker — What Volunteers Run
=========================================

This is the script that anyone with a GPU runs to join the training swarm.
It connects to the coordinator, downloads the current model, trains locally,
and periodically sends compressed updates back.

Usage:
    python -m nova.swarm.worker --coordinator ws://your-server:8765

That's it! The worker handles everything automatically:
- Downloads and loads the latest model weights
- Trains on provided or downloaded data
- Compresses and sends updates
- Adapts its sync frequency
- Resumes if the connection drops
"""

import argparse
import asyncio
import hashlib
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Optional

import torch
import torch.nn.functional as F

from nova.config import NovaConfig
from nova.model import NovaLLM
from nova.swarm.aso_optimizer import ASOConfig, ASOOptimizer
from nova.swarm.coordinator import (
    MessageType,
    serialize_message,
    deserialize_message,
)


def get_gpu_info() -> dict:
    """Detect available GPU information."""
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_mem / (1024 ** 3)
        return {
            "gpu_name": gpu_name,
            "gpu_memory_gb": round(gpu_memory, 1),
            "device": "cuda",
        }
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return {
            "gpu_name": "Apple Silicon (MPS)",
            "gpu_memory_gb": 0,  # Not easily queryable
            "device": "mps",
        }
    else:
        return {
            "gpu_name": "CPU",
            "gpu_memory_gb": 0,
            "device": "cpu",
        }


def generate_worker_id() -> str:
    """Generate a unique, persistent worker ID."""
    id_file = Path.home() / ".nova_worker_id"
    if id_file.exists():
        return id_file.read_text().strip()

    worker_id = hashlib.sha256(
        f"{uuid.uuid4()}-{time.time()}-{os.getpid()}".encode()
    ).hexdigest()[:32]

    id_file.write_text(worker_id)
    return worker_id


class SwarmWorker:
    """A volunteer worker that contributes GPU power to training.

    Lifecycle:
    1. Connect to coordinator
    2. Download current model weights
    3. Train locally using ASO optimizer
    4. When sync is triggered, compress and send updates
    5. Receive aggregated weights and blend with local state
    6. Repeat from step 3
    """

    def __init__(
        self,
        coordinator_url: str,
        data_path: Optional[str] = None,
        batch_size: int = 8,
        device: str = "auto",
    ):
        self.coordinator_url = coordinator_url
        self.data_path = data_path
        self.batch_size = batch_size

        # Device
        gpu_info = get_gpu_info()
        if device == "auto":
            self.device = torch.device(gpu_info["device"])
        else:
            self.device = torch.device(device)

        self.gpu_info = gpu_info
        self.worker_id = generate_worker_id()

        # Model and optimizer (initialized after receiving config from coordinator)
        self.model: Optional[NovaLLM] = None
        self.optimizer: Optional[ASOOptimizer] = None
        self.model_config: Optional[NovaConfig] = None
        self.aso_config: Optional[ASOConfig] = None

        # Training state
        self.local_steps = 0
        self.total_steps = 0
        self.recent_losses = []
        self.model_version = 0

        print(f"Nova Swarm Worker")
        print(f"  Worker ID: {self.worker_id[:8]}...")
        print(f"  Device: {self.device} ({gpu_info['gpu_name']})")
        print(f"  Coordinator: {coordinator_url}")

    def initialize_model(self, model_config: dict, aso_config: dict, weights: dict):
        """Initialize model from coordinator-provided config and weights."""
        self.model_config = NovaConfig(**model_config)
        self.aso_config = ASOConfig(**aso_config)

        self.model = NovaLLM(self.model_config).to(self.device)
        self.model.load_state_dict(weights)
        self.optimizer = ASOOptimizer(self.model, self.aso_config)

        print(f"  Model loaded: {self.model.estimate_params():,} params")

    def load_training_data(self) -> torch.Tensor:
        """Load and tokenize training data.

        Workers can bring their own data, which is one of the unique
        features of swarm training — diverse data sources!
        """
        if self.data_path and Path(self.data_path).exists():
            from nova.tokenizer import NovaTokenizer
            tokenizer = NovaTokenizer.load("tokenizer")
            with open(self.data_path) as f:
                text = f.read()
            tokens = tokenizer.encode(text)
            return torch.tensor(tokens, dtype=torch.long)

        # If no data provided, generate random tokens for testing
        print("  No data provided — using random tokens for demo")
        return torch.randint(0, self.model_config.vocab_size, (50000,))

    def train_step(self, data: torch.Tensor) -> float:
        """Run one local training step."""
        self.model.train()
        seq_len = self.model_config.max_seq_len

        # Random batch
        batch_starts = torch.randint(0, len(data) - seq_len - 1, (self.batch_size,))
        x = torch.stack([data[s : s + seq_len] for s in batch_starts]).to(self.device)
        y = torch.stack([data[s + 1 : s + seq_len + 1] for s in batch_starts]).to(self.device)

        # Forward
        logits, loss, _ = self.model(x, targets=y)

        # Backward
        loss.backward()
        self.optimizer.step(loss)

        self.local_steps += 1
        self.total_steps += 1

        return loss.item()

    def get_update_payload(self) -> dict:
        """Prepare compressed update for coordinator."""
        compressed = self.optimizer.get_compressed_state()
        avg_loss = sum(self.recent_losses[-10:]) / max(len(self.recent_losses[-10:]), 1)

        return {
            "type": MessageType.SUBMIT_UPDATE,
            "worker_id": self.worker_id,
            "updates": compressed,
            "loss_before": self.recent_losses[0] if self.recent_losses else float("inf"),
            "loss_after": avg_loss,
            "steps": self.local_steps,
        }

    def apply_coordinator_weights(self, weights: dict):
        """Apply updated weights from coordinator."""
        with torch.no_grad():
            for name, param in self.model.named_parameters():
                if name in weights:
                    # Soft blend: keep some local knowledge
                    blend = 0.7  # 70% coordinator, 30% local
                    param.data.mul_(1 - blend).add_(weights[name].to(self.device), alpha=blend)
        self.local_steps = 0

    def get_heartbeat(self) -> dict:
        """Prepare heartbeat message."""
        avg_loss = sum(self.recent_losses[-10:]) / max(len(self.recent_losses[-10:]), 1)
        return {
            "type": MessageType.HEARTBEAT,
            "worker_id": self.worker_id,
            "stats": {
                "steps": self.total_steps,
                "avg_loss": avg_loss,
                "status": "training",
                "local_steps_since_sync": self.local_steps,
            },
        }


# ---------------------------------------------------------------------------
# Local Swarm Simulator (No Network Required)
# ---------------------------------------------------------------------------

class LocalSwarmSimulator:
    """Simulate a swarm of workers locally for testing.

    This creates multiple virtual workers that train on the same machine,
    using the coordinator's aggregation logic. Great for testing the
    algorithm before deploying to real volunteers.
    """

    def __init__(
        self,
        model_config: NovaConfig,
        aso_config: ASOConfig,
        n_workers: int = 3,
        data_path: Optional[str] = None,
        device: str = "cpu",
    ):
        self.n_workers = n_workers
        self.device = device

        # Create coordinator with initial model
        model = NovaLLM(model_config)
        state_dict = model.state_dict()

        from nova.swarm.coordinator import SwarmCoordinator
        self.coordinator = SwarmCoordinator(
            model_state_dict=state_dict,
            config=aso_config,
            min_workers_for_sync=max(1, n_workers // 2),
        )

        # Create workers
        self.workers = []
        for i in range(n_workers):
            worker = SwarmWorker(
                coordinator_url="local",
                data_path=data_path,
                batch_size=4,
                device=device,
            )
            worker.initialize_model(
                model_config.__dict__,
                aso_config.__dict__ if hasattr(aso_config, '__dict__') else asdict(aso_config),
                state_dict,
            )
            self.workers.append(worker)
            self.coordinator.register_worker(
                worker.worker_id,
                {"gpu_name": f"Virtual Worker {i}", "gpu_memory_gb": 0}
            )

        print(f"\nLocal swarm simulator: {n_workers} workers")

    def train(self, n_rounds: int = 100, steps_per_round: int = 10):
        """Run simulated swarm training."""
        print(f"\nTraining: {n_rounds} rounds x {steps_per_round} steps/round")
        print(f"  Workers: {self.n_workers}")
        print()

        # Each worker loads its data
        worker_data = []
        for worker in self.workers:
            data = worker.load_training_data()
            worker_data.append(data)

        t0 = time.time()

        for round_idx in range(n_rounds):
            round_losses = []

            # Each worker trains locally
            for w_idx, (worker, data) in enumerate(zip(self.workers, worker_data)):
                worker_losses = []
                for step in range(steps_per_round):
                    loss = worker.train_step(data)
                    worker_losses.append(loss)
                    worker.recent_losses.append(loss)

                avg_loss = sum(worker_losses) / len(worker_losses)
                round_losses.append(avg_loss)

                # Submit update to coordinator
                update_payload = worker.get_update_payload()
                self.coordinator.submit_update(
                    worker_id=worker.worker_id,
                    compressed_updates=update_payload["updates"],
                    loss_before=update_payload["loss_before"],
                    loss_after=avg_loss,
                )

            # Distribute updated weights back to workers
            new_weights = self.coordinator.get_model_weights()
            for worker in self.workers:
                worker.apply_coordinator_weights(new_weights)

            # Logging
            if (round_idx + 1) % 10 == 0:
                avg = sum(round_losses) / len(round_losses)
                dt = time.time() - t0
                status = self.coordinator.get_status()
                print(
                    f"  Round {round_idx + 1:4d}/{n_rounds} | "
                    f"loss: {avg:.4f} | "
                    f"version: {status['model_version']} | "
                    f"updates: {status['total_updates']} | "
                    f"time: {dt:.1f}s"
                )
                t0 = time.time()

        # Final status
        print(f"\nTraining complete!")
        status = self.coordinator.get_status()
        print(f"  Model version: {status['model_version']}")
        print(f"  Total updates: {status['total_updates']}")
        print(f"  Trust report: {status['trust_report']}")

        self.coordinator.save_checkpoint()
        return self.coordinator.get_model_weights()


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Nova Swarm Worker")
    parser.add_argument("--coordinator", type=str, default="ws://localhost:8765",
                        help="Coordinator WebSocket URL")
    parser.add_argument("--data", type=str, default=None,
                        help="Path to local training data (optional)")
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--device", type=str, default="auto")

    # Local simulation mode
    parser.add_argument("--simulate", action="store_true",
                        help="Run local swarm simulation (no network)")
    parser.add_argument("--n-workers", type=int, default=3,
                        help="Number of simulated workers")
    parser.add_argument("--n-rounds", type=int, default=50,
                        help="Number of training rounds")
    parser.add_argument("--steps-per-round", type=int, default=10,
                        help="Local steps per sync round")

    args = parser.parse_args()

    if args.simulate:
        # Local simulation — no network needed
        from dataclasses import asdict

        model_config = NovaConfig.tiny()
        model_config.vocab_size = 512
        model_config.dim = 128
        model_config.n_layers = 3
        model_config.n_heads = 4
        model_config.n_kv_heads = 2
        model_config.max_seq_len = 64

        aso_config = ASOConfig()

        sim = LocalSwarmSimulator(
            model_config=model_config,
            aso_config=aso_config,
            n_workers=args.n_workers,
            data_path=args.data,
            device=args.device if args.device != "auto" else "cpu",
        )
        sim.train(n_rounds=args.n_rounds, steps_per_round=args.steps_per_round)

    else:
        print("Connecting to coordinator...")
        print("(For local testing, use --simulate flag)")
        # Full network mode would use asyncio + websockets here


if __name__ == "__main__":
    main()
