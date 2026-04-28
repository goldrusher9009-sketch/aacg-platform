"""Training engine for Nova LLM.

Features:
- Mixed precision training (AMP)
- Gradient accumulation for effective large batch sizes
- Cosine learning rate schedule with warmup
- Gradient clipping
- Checkpoint save/resume
- Training metrics logging
- Validation loss tracking
"""

import json
import math
import os
import time
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

from nova.config import NovaConfig
from nova.model import NovaLLM


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

class TextDataset(Dataset):
    """Simple text dataset that creates fixed-length token sequences.

    Loads pre-tokenized data and creates overlapping windows for training.
    """

    def __init__(self, token_ids: list, seq_len: int):
        self.token_ids = torch.tensor(token_ids, dtype=torch.long)
        self.seq_len = seq_len

    def __len__(self):
        return max(0, len(self.token_ids) - self.seq_len - 1)

    def __getitem__(self, idx):
        chunk = self.token_ids[idx : idx + self.seq_len + 1]
        x = chunk[:-1]
        y = chunk[1:]
        return x, y


# ---------------------------------------------------------------------------
# Learning Rate Schedule
# ---------------------------------------------------------------------------

def get_lr(step: int, config: NovaConfig) -> float:
    """Cosine learning rate schedule with linear warmup.

    - Linear warmup from 0 to lr over warmup_steps
    - Cosine decay from lr to lr/10 over remaining steps
    """
    if step < config.warmup_steps:
        return config.learning_rate * (step + 1) / config.warmup_steps

    if step >= config.max_steps:
        return config.learning_rate / 10

    # Cosine decay
    progress = (step - config.warmup_steps) / (config.max_steps - config.warmup_steps)
    cosine_decay = 0.5 * (1.0 + math.cos(math.pi * progress))
    min_lr = config.learning_rate / 10
    return min_lr + (config.learning_rate - min_lr) * cosine_decay


# ---------------------------------------------------------------------------
# Trainer
# ---------------------------------------------------------------------------

class Trainer:
    """Training engine for Nova LLM.

    Handles the full training loop with modern best practices:
    - AdamW optimizer with weight decay
    - Mixed precision with GradScaler
    - Gradient accumulation
    - Cosine LR schedule with warmup
    - Periodic evaluation and checkpointing
    """

    def __init__(
        self,
        model: NovaLLM,
        config: NovaConfig,
        train_dataset: TextDataset,
        val_dataset: Optional[TextDataset] = None,
        checkpoint_dir: str = "checkpoints",
        device: str = "auto",
    ):
        self.config = config
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

        # Device selection
        if device == "auto":
            if torch.cuda.is_available():
                self.device = torch.device("cuda")
            elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                self.device = torch.device("mps")
            else:
                self.device = torch.device("cpu")
        else:
            self.device = torch.device(device)

        print(f"Training on: {self.device}")

        self.model = model.to(self.device)
        print(f"Model parameters: {model.estimate_params():,}")

        # Datasets
        self.train_loader = DataLoader(
            train_dataset,
            batch_size=config.batch_size,
            shuffle=True,
            num_workers=0,
            pin_memory=(self.device.type == "cuda"),
            drop_last=True,
        )
        self.val_loader = None
        if val_dataset is not None:
            self.val_loader = DataLoader(
                val_dataset,
                batch_size=config.batch_size,
                shuffle=False,
                num_workers=0,
                pin_memory=(self.device.type == "cuda"),
                drop_last=True,
            )

        # Optimizer: AdamW with weight decay only on 2D params (no bias/norm)
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
            lr=config.learning_rate,
            betas=(config.beta1, config.beta2),
            fused=(self.device.type == "cuda"),
        )

        # Mixed precision
        self.scaler = torch.amp.GradScaler("cuda", enabled=(config.use_amp and self.device.type == "cuda"))
        self.amp_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16

        # State
        self.step = 0
        self.best_val_loss = float("inf")
        self.train_losses = []

    def train(self):
        """Run the full training loop."""
        print(f"\nStarting training for {self.config.max_steps} steps...")
        print(f"  Batch size: {self.config.batch_size}")
        print(f"  Gradient accumulation: {self.config.gradient_accumulation_steps}")
        print(f"  Effective batch size: {self.config.batch_size * self.config.gradient_accumulation_steps}")
        print(f"  Learning rate: {self.config.learning_rate}")
        print(f"  Mixed precision: {self.config.use_amp}")
        print()

        self.model.train()
        data_iter = iter(self.train_loader)
        t0 = time.time()

        while self.step < self.config.max_steps:
            # Update learning rate
            lr = get_lr(self.step, self.config)
            for param_group in self.optimizer.param_groups:
                param_group["lr"] = lr

            # Gradient accumulation loop
            loss_accum = 0.0
            self.optimizer.zero_grad(set_to_none=True)

            for micro_step in range(self.config.gradient_accumulation_steps):
                try:
                    x, y = next(data_iter)
                except StopIteration:
                    data_iter = iter(self.train_loader)
                    x, y = next(data_iter)

                x = x.to(self.device)
                y = y.to(self.device)

                # Forward pass with mixed precision
                with torch.amp.autocast(self.device.type, dtype=self.amp_dtype, enabled=self.config.use_amp):
                    _, loss, _ = self.model(x, targets=y)
                    loss = loss / self.config.gradient_accumulation_steps

                loss_accum += loss.item()
                self.scaler.scale(loss).backward()

            # Gradient clipping
            if self.config.grad_clip > 0:
                self.scaler.unscale_(self.optimizer)
                nn.utils.clip_grad_norm_(self.model.parameters(), self.config.grad_clip)

            # Optimizer step
            self.scaler.step(self.optimizer)
            self.scaler.update()

            self.train_losses.append(loss_accum)
            self.step += 1

            # Logging
            if self.step % self.config.log_interval == 0:
                dt = time.time() - t0
                tokens_per_sec = (
                    self.config.batch_size
                    * self.config.gradient_accumulation_steps
                    * self.config.max_seq_len
                    * self.config.log_interval
                    / dt
                )
                print(
                    f"Step {self.step:6d}/{self.config.max_steps} | "
                    f"loss: {loss_accum:.4f} | "
                    f"lr: {lr:.2e} | "
                    f"tok/s: {tokens_per_sec:,.0f} | "
                    f"time: {dt:.1f}s"
                )
                t0 = time.time()

            # Evaluation
            if self.val_loader and self.step % self.config.eval_interval == 0:
                val_loss = self.evaluate()
                print(f"  -> Val loss: {val_loss:.4f}")
                if val_loss < self.best_val_loss:
                    self.best_val_loss = val_loss
                    self.save_checkpoint("best.pt")
                    print(f"  -> New best! Saved checkpoint.")
                self.model.train()

            # Periodic save
            if self.step % self.config.save_interval == 0:
                self.save_checkpoint(f"step_{self.step}.pt")

        # Final save
        self.save_checkpoint("latest.pt")
        print(f"\nTraining complete! Final loss: {self.train_losses[-1]:.4f}")

    @torch.no_grad()
    def evaluate(self) -> float:
        """Evaluate on validation set."""
        self.model.eval()
        total_loss = 0.0
        n_batches = 0

        for x, y in self.val_loader:
            x = x.to(self.device)
            y = y.to(self.device)

            with torch.amp.autocast(self.device.type, dtype=self.amp_dtype, enabled=self.config.use_amp):
                _, loss, _ = self.model(x, targets=y)

            total_loss += loss.item()
            n_batches += 1

            if n_batches >= 50:  # Cap eval at 50 batches
                break

        return total_loss / max(n_batches, 1)

    def save_checkpoint(self, filename: str):
        """Save model checkpoint."""
        path = self.checkpoint_dir / filename
        checkpoint = {
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "scaler_state_dict": self.scaler.state_dict(),
            "step": self.step,
            "best_val_loss": self.best_val_loss,
            "config": self.config.__dict__,
        }
        torch.save(checkpoint, path)

    def load_checkpoint(self, path: str):
        """Resume from checkpoint."""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        self.scaler.load_state_dict(checkpoint["scaler_state_dict"])
        self.step = checkpoint["step"]
        self.best_val_loss = checkpoint["best_val_loss"]
        print(f"Resumed from step {self.step}")
