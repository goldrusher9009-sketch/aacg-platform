#!/usr/bin/env python3
"""
Simulate a swarm of workers locally — no network required.

This is the fastest way to test the entire ASO training system.
It creates multiple virtual workers on your machine and runs the
full coordinator + worker + aggregation pipeline.

Usage:
    python scripts/simulate_swarm.py
    python scripts/simulate_swarm.py --workers 5 --rounds 100
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch
from nova.config import NovaConfig
from nova.swarm.aso_optimizer import ASOConfig
from nova.swarm.worker import LocalSwarmSimulator


def main():
    parser = argparse.ArgumentParser(description="Simulate Nova Swarm Training")
    parser.add_argument("--workers", type=int, default=3, help="Number of simulated workers")
    parser.add_argument("--rounds", type=int, default=50, help="Training rounds")
    parser.add_argument("--steps-per-round", type=int, default=10, help="Steps per sync round")
    parser.add_argument("--data", type=str, default=None, help="Optional data file")
    parser.add_argument("--device", type=str, default="cpu")
    args = parser.parse_args()

    print("=" * 60)
    print("  Nova Swarm — Local Simulation")
    print("=" * 60)

    # Small model for testing
    model_config = NovaConfig.tiny()
    model_config.vocab_size = 512
    model_config.dim = 128
    model_config.n_layers = 3
    model_config.n_heads = 4
    model_config.n_kv_heads = 2
    model_config.max_seq_len = 64

    aso_config = ASOConfig(
        lr=1e-3,
        compression_rank=8,
        initial_sync_interval=10,
    )

    # Run simulation
    sim = LocalSwarmSimulator(
        model_config=model_config,
        aso_config=aso_config,
        n_workers=args.workers,
        data_path=args.data,
        device=args.device,
    )

    final_weights = sim.train(
        n_rounds=args.rounds,
        steps_per_round=args.steps_per_round,
    )

    print(f"\nSimulation complete!")
    print(f"Final model saved to swarm_checkpoints/")
    print(f"\nTo run with real volunteers:")
    print(f"  1. python scripts/start_coordinator.py")
    print(f"  2. Tell volunteers: python -m nova.swarm.worker --coordinator ws://YOUR_IP:8765")


if __name__ == "__main__":
    main()
