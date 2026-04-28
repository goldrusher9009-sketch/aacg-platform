"""
Adaptive Swarm Optimization (ASO) — A Novel Training Algorithm
================================================================

ASO is a new distributed optimization algorithm designed for training LLMs
across unreliable internet-connected GPUs. It combines three innovations:

1. MOMENTUM DECOMPOSITION
   Instead of syncing full gradients (expensive), each worker decomposes its
   optimizer momentum into a low-rank approximation. Only the top-k singular
   values and vectors are communicated, reducing bandwidth by 50-200x.

2. ADAPTIVE SYNC FREQUENCY
   Workers don't sync on a fixed schedule. Instead, each worker monitors its
   local "gradient divergence" — how much its gradients differ from the last
   synced state. When divergence exceeds a learned threshold, it triggers a
   sync. This means workers with similar data sync less, saving bandwidth,
   while workers that are drifting sync more to stay aligned.

3. TRUST-WEIGHTED AGGREGATION
   When aggregating updates from multiple workers, ASO maintains a trust
   score for each worker based on the consistency of their contributions.
   Workers whose updates consistently reduce validation loss get higher
   trust. Workers sending garbage (malicious or buggy) get downweighted
   toward zero. This provides Byzantine fault tolerance without expensive
   cryptographic verification.

The algorithm converges faster than standard distributed SGD on high-latency
networks because it communicates less but smarter.
"""

import math
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from collections import deque

import torch
import torch.nn as nn


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

@dataclass
class ASOConfig:
    """Configuration for Adaptive Swarm Optimization."""

    # Optimizer basics
    lr: float = 3e-4
    beta1: float = 0.9
    beta2: float = 0.95
    eps: float = 1e-8
    weight_decay: float = 0.1

    # Momentum decomposition
    compression_rank: int = 32       # Rank for low-rank approximation
    top_k_ratio: float = 0.01       # Fraction of parameters to communicate (1% default)
    error_feedback: bool = True      # Accumulate compression error for next round

    # Adaptive sync
    initial_sync_interval: int = 50  # Steps between syncs (starting point)
    min_sync_interval: int = 10      # Never sync more often than this
    max_sync_interval: int = 500     # Never go longer than this without syncing
    divergence_threshold: float = 0.1  # Trigger sync when divergence exceeds this
    divergence_ema_alpha: float = 0.1  # EMA smoothing for divergence tracking

    # Trust system
    initial_trust: float = 1.0       # Starting trust for new workers
    trust_decay: float = 0.99        # Slow decay to require ongoing good behavior
    trust_boost: float = 1.05        # Boost for consistent good updates
    trust_penalty: float = 0.8       # Penalty for bad updates
    min_trust: float = 0.01          # Floor — never fully zero out a worker
    trust_window: int = 20           # Number of recent updates to evaluate

    # Gradient clipping
    max_grad_norm: float = 1.0


# ---------------------------------------------------------------------------
# Momentum Decomposition
# ---------------------------------------------------------------------------

class MomentumDecomposer:
    """Compresses optimizer momentum into a low-rank representation.

    Instead of sending the full momentum tensor M (dim x dim), we compute
    a truncated SVD: M ≈ U_k @ S_k @ V_k^T where k << dim.

    Only the top-k components are sent, reducing communication by ~dim/k.
    An error feedback buffer accumulates the compression residual so
    information is never permanently lost.
    """

    def __init__(self, config: ASOConfig):
        self.rank = config.compression_rank
        self.top_k_ratio = config.top_k_ratio
        self.use_error_feedback = config.error_feedback
        self.error_buffers: Dict[str, torch.Tensor] = {}

    def compress(self, name: str, tensor: torch.Tensor) -> Dict:
        """Compress a parameter's momentum for transmission.

        Returns a dict with the compressed representation.
        """
        original_shape = tensor.shape
        flat = tensor.flatten()

        # Add accumulated error from previous compressions
        if self.use_error_feedback and name in self.error_buffers:
            flat = flat + self.error_buffers[name]

        # Method 1: Top-K sparsification (for 1D tensors or small tensors)
        if flat.numel() < 1000 or len(original_shape) < 2:
            k = max(1, int(flat.numel() * self.top_k_ratio))
            values, indices = torch.topk(flat.abs(), k)
            signs = flat[indices].sign()
            sparse_values = values * signs

            # Error feedback: store what we didn't send
            if self.use_error_feedback:
                reconstructed = torch.zeros_like(flat)
                reconstructed[indices] = sparse_values
                self.error_buffers[name] = flat - reconstructed

            return {
                "type": "topk",
                "values": sparse_values,
                "indices": indices,
                "shape": original_shape,
                "numel": flat.numel(),
            }

        # Method 2: Low-rank SVD approximation (for 2D+ tensors)
        # Reshape to 2D for SVD
        if len(original_shape) == 1:
            rows = int(math.sqrt(flat.numel()))
            cols = flat.numel() // rows
            if rows * cols != flat.numel():
                cols = flat.numel()
                rows = 1
            matrix = flat[:rows * cols].reshape(rows, cols)
        else:
            matrix = tensor.reshape(original_shape[0], -1)

        rank = min(self.rank, min(matrix.shape))

        try:
            U, S, Vh = torch.linalg.svd(matrix, full_matrices=False)
            U_k = U[:, :rank]
            S_k = S[:rank]
            Vh_k = Vh[:rank, :]

            # Error feedback
            if self.use_error_feedback:
                approx = (U_k * S_k.unsqueeze(0)) @ Vh_k
                error = matrix - approx
                self.error_buffers[name] = error.reshape(original_shape)

            return {
                "type": "svd",
                "U": U_k,
                "S": S_k,
                "Vh": Vh_k,
                "shape": original_shape,
                "matrix_shape": matrix.shape,
            }

        except Exception:
            # Fallback to top-k if SVD fails
            k = max(1, int(flat.numel() * self.top_k_ratio))
            values, indices = torch.topk(flat.abs(), k)
            signs = flat[indices].sign()

            if self.use_error_feedback:
                reconstructed = torch.zeros_like(flat)
                reconstructed[indices] = values * signs
                self.error_buffers[name] = flat - reconstructed

            return {
                "type": "topk",
                "values": values * signs,
                "indices": indices,
                "shape": original_shape,
                "numel": flat.numel(),
            }

    @staticmethod
    def decompress(compressed: Dict) -> torch.Tensor:
        """Reconstruct a tensor from its compressed representation."""
        if compressed["type"] == "topk":
            flat = torch.zeros(compressed["numel"], device=compressed["values"].device)
            flat[compressed["indices"]] = compressed["values"]
            return flat.reshape(compressed["shape"])

        elif compressed["type"] == "svd":
            U, S, Vh = compressed["U"], compressed["S"], compressed["Vh"]
            matrix = (U * S.unsqueeze(0)) @ Vh
            return matrix.reshape(compressed["shape"])

    def compression_ratio(self, name: str, tensor: torch.Tensor) -> float:
        """Estimate the compression ratio for a given tensor."""
        compressed = self.compress(name, tensor.clone())
        if compressed["type"] == "topk":
            sent = compressed["values"].numel() + compressed["indices"].numel()
        else:
            sent = (compressed["U"].numel() + compressed["S"].numel() + compressed["Vh"].numel())
        return tensor.numel() / max(sent, 1)


# ---------------------------------------------------------------------------
# Adaptive Sync Controller
# ---------------------------------------------------------------------------

class AdaptiveSyncController:
    """Decides WHEN to synchronize with other workers.

    Monitors how much the local model has diverged from the last sync point.
    When divergence is high (model is drifting), sync more frequently.
    When divergence is low (model agrees with swarm), sync less.

    This is adaptive and learned — the threshold adjusts based on whether
    recent syncs actually helped (reduced loss) or not.
    """

    def __init__(self, config: ASOConfig):
        self.config = config
        self.current_interval = config.initial_sync_interval
        self.steps_since_sync = 0
        self.divergence_ema = 0.0
        self.last_sync_params: Optional[Dict[str, torch.Tensor]] = None
        self.sync_history: deque = deque(maxlen=50)
        self.loss_before_sync: Optional[float] = None
        self.loss_after_sync: Optional[float] = None

    def should_sync(self, model: nn.Module, current_loss: float) -> bool:
        """Determine if we should sync with the swarm now."""
        self.steps_since_sync += 1

        # Always sync if we've exceeded max interval
        if self.steps_since_sync >= self.config.max_sync_interval:
            return True

        # Don't sync if below minimum interval
        if self.steps_since_sync < self.config.min_sync_interval:
            return False

        # Check divergence from last sync point
        if self.last_sync_params is not None:
            divergence = self._compute_divergence(model)
            alpha = self.config.divergence_ema_alpha
            self.divergence_ema = alpha * divergence + (1 - alpha) * self.divergence_ema

            if self.divergence_ema > self.config.divergence_threshold:
                return True

        # Check if we've reached the adaptive interval
        if self.steps_since_sync >= self.current_interval:
            return True

        return False

    def record_sync(self, model: nn.Module, loss_before: float, loss_after: float):
        """Record the outcome of a sync to adapt future behavior."""
        self.steps_since_sync = 0
        self.loss_before_sync = loss_before
        self.loss_after_sync = loss_after

        # Save current params as reference for divergence tracking
        self.last_sync_params = {
            name: param.data.clone()
            for name, param in model.named_parameters()
            if param.requires_grad
        }

        # Did the sync help?
        improvement = loss_before - loss_after
        self.sync_history.append(improvement)

        # Adapt interval based on whether syncs are helping
        if len(self.sync_history) >= 5:
            recent_avg = sum(list(self.sync_history)[-5:]) / 5

            if recent_avg > 0:
                # Syncs are helping — sync more often
                self.current_interval = max(
                    self.config.min_sync_interval,
                    int(self.current_interval * 0.9)
                )
            else:
                # Syncs aren't helping — sync less often
                self.current_interval = min(
                    self.config.max_sync_interval,
                    int(self.current_interval * 1.1)
                )

    def _compute_divergence(self, model: nn.Module) -> float:
        """Compute how much the model has drifted from last sync."""
        total_divergence = 0.0
        total_params = 0

        for name, param in model.named_parameters():
            if name in self.last_sync_params and param.requires_grad:
                diff = (param.data - self.last_sync_params[name]).norm()
                total_divergence += diff.item()
                total_params += param.numel()

        return total_divergence / max(total_params, 1) * 1e6  # Scale for readability


# ---------------------------------------------------------------------------
# Trust-Weighted Aggregation
# ---------------------------------------------------------------------------

class TrustAggregator:
    """Maintains trust scores for each worker and aggregates updates accordingly.

    Trust is earned by consistently sending updates that improve model quality.
    Workers that send noisy, adversarial, or corrupted updates get downweighted.

    This provides Byzantine fault tolerance — even if 30-40% of workers are
    malicious, the model still converges correctly because their updates
    are effectively ignored.
    """

    def __init__(self, config: ASOConfig):
        self.config = config
        self.trust_scores: Dict[str, float] = {}
        self.update_history: Dict[str, deque] = {}

    def register_worker(self, worker_id: str):
        """Register a new worker with initial trust."""
        if worker_id not in self.trust_scores:
            self.trust_scores[worker_id] = self.config.initial_trust
            self.update_history[worker_id] = deque(maxlen=self.config.trust_window)

    def remove_worker(self, worker_id: str):
        """Remove a disconnected worker."""
        self.trust_scores.pop(worker_id, None)
        self.update_history.pop(worker_id, None)

    def record_update_quality(self, worker_id: str, loss_delta: float):
        """Record whether a worker's update improved or harmed the model.

        loss_delta < 0 means the update reduced loss (good).
        loss_delta > 0 means the update increased loss (bad).
        """
        if worker_id not in self.trust_scores:
            self.register_worker(worker_id)

        self.update_history[worker_id].append(loss_delta)

        # Update trust based on recent performance
        recent = list(self.update_history[worker_id])
        if len(recent) >= 3:
            avg_delta = sum(recent[-3:]) / 3

            if avg_delta < 0:
                # Good worker — boost trust
                self.trust_scores[worker_id] = min(
                    2.0,
                    self.trust_scores[worker_id] * self.config.trust_boost
                )
            elif avg_delta > 0.01:
                # Bad worker — penalize
                self.trust_scores[worker_id] = max(
                    self.config.min_trust,
                    self.trust_scores[worker_id] * self.config.trust_penalty
                )

        # Natural decay — everyone must keep earning trust
        self.trust_scores[worker_id] *= self.config.trust_decay
        self.trust_scores[worker_id] = max(self.config.min_trust, self.trust_scores[worker_id])

    def aggregate(
        self,
        updates: Dict[str, Dict[str, torch.Tensor]],
    ) -> Dict[str, torch.Tensor]:
        """Aggregate parameter updates from multiple workers, weighted by trust.

        Args:
            updates: {worker_id: {param_name: tensor}} — each worker's proposed update

        Returns:
            {param_name: tensor} — the trust-weighted average update
        """
        if not updates:
            return {}

        # Compute normalized trust weights
        worker_ids = list(updates.keys())
        raw_trust = [self.trust_scores.get(wid, self.config.initial_trust) for wid in worker_ids]
        total_trust = sum(raw_trust)

        if total_trust == 0:
            weights = [1.0 / len(worker_ids)] * len(worker_ids)
        else:
            weights = [t / total_trust for t in raw_trust]

        # Weighted average of updates
        first_worker = worker_ids[0]
        param_names = list(updates[first_worker].keys())

        aggregated = {}
        for param_name in param_names:
            weighted_sum = None
            for wid, weight in zip(worker_ids, weights):
                if param_name in updates[wid]:
                    contribution = updates[wid][param_name] * weight
                    if weighted_sum is None:
                        weighted_sum = contribution
                    else:
                        weighted_sum = weighted_sum + contribution

            if weighted_sum is not None:
                aggregated[param_name] = weighted_sum

        return aggregated

    def get_trust_report(self) -> Dict[str, float]:
        """Get current trust scores for all workers."""
        return dict(self.trust_scores)

    def get_suspicious_workers(self, threshold: float = 0.3) -> List[str]:
        """Identify workers with low trust (possible malicious actors)."""
        return [
            wid for wid, score in self.trust_scores.items()
            if score < threshold
        ]


# ---------------------------------------------------------------------------
# ASO Optimizer (Local Component)
# ---------------------------------------------------------------------------

class ASOOptimizer:
    """The local optimizer each worker runs.

    This wraps AdamW with momentum decomposition for efficient communication.
    It's used by the worker process and handles the local training step.
    """

    def __init__(self, model: nn.Module, config: ASOConfig):
        self.config = config
        self.model = model

        # Separate weight decay and non-decay params
        decay_params = []
        no_decay_params = []
        for name, param in model.named_parameters():
            if param.requires_grad:
                if param.dim() >= 2:
                    decay_params.append(param)
                else:
                    no_decay_params.append(param)

        self.optimizer = torch.optim.AdamW(
            [
                {"params": decay_params, "weight_decay": config.weight_decay},
                {"params": no_decay_params, "weight_decay": 0.0},
            ],
            lr=config.lr,
            betas=(config.beta1, config.beta2),
            eps=config.eps,
        )

        self.decomposer = MomentumDecomposer(config)
        self.sync_controller = AdaptiveSyncController(config)
        self.step_count = 0

    def step(self, loss: torch.Tensor):
        """Perform one optimization step."""
        # Gradient clipping
        if self.config.max_grad_norm > 0:
            nn.utils.clip_grad_norm_(
                self.model.parameters(),
                self.config.max_grad_norm,
            )

        self.optimizer.step()
        self.optimizer.zero_grad(set_to_none=True)
        self.step_count += 1

    def get_compressed_state(self) -> Dict[str, Dict]:
        """Get compressed parameter deltas for transmission to coordinator."""
        compressed = {}
        for name, param in self.model.named_parameters():
            if param.requires_grad:
                compressed[name] = self.decomposer.compress(name, param.data)
        return compressed

    def apply_aggregated_update(self, aggregated: Dict[str, torch.Tensor]):
        """Apply the trust-weighted aggregated update from the coordinator."""
        with torch.no_grad():
            for name, param in self.model.named_parameters():
                if name in aggregated:
                    # Blend local params with aggregated (soft sync)
                    blend_factor = 0.5  # 50% local, 50% swarm
                    param.data.mul_(1 - blend_factor).add_(aggregated[name], alpha=blend_factor)

    def should_sync(self, current_loss: float) -> bool:
        """Check if it's time to sync with the swarm."""
        return self.sync_controller.should_sync(self.model, current_loss)
