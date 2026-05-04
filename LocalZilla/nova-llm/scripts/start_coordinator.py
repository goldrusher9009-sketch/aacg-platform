#!/usr/bin/env python3
"""
Start the Nova Swarm Coordinator.

Run this on any machine (even without a GPU). It's the central hub
that all volunteer workers connect to.

Usage:
    python scripts/start_coordinator.py --port 8765
    python scripts/start_coordinator.py --config configs/tiny.json --port 8765
"""

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch
from nova.config import NovaConfig
from nova.model import NovaLLM
from nova.swarm.aso_optimizer import ASOConfig
from nova.swarm.coordinator import SwarmCoordinator, run_coordinator_server


def main():
    parser = argparse.ArgumentParser(description="Start Nova Swarm Coordinator")
    parser.add_argument("--config", type=str, default="configs/tiny.json")
    parser.add_argument("--checkpoint", type=str, default=None,
                        help="Resume from checkpoint")
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--min-workers", type=int, default=1)
    args = parser.parse_args()

    # Load model config
    model_config = NovaConfig.load(args.config)
    aso_config = ASOConfig()

    # Initialize or load model
    if args.checkpoint:
        print(f"Loading checkpoint: {args.checkpoint}")
        checkpoint = torch.load(args.checkpoint, map_location="cpu")
        model_state = checkpoint["model_state_dict"]
    else:
        print("Initializing fresh model...")
        model = NovaLLM(model_config)
        model_state = model.state_dict()

    print(f"Model: {sum(v.numel() for v in model_state.values()):,} parameters")

    # Create coordinator
    coordinator = SwarmCoordinator(
        model_state_dict=model_state,
        config=aso_config,
        min_workers_for_sync=args.min_workers,
    )

    # Run server
    print(f"\nStarting coordinator on ws://{args.host}:{args.port}")
    print(f"Tell volunteers to run:")
    print(f"  python -m nova.swarm.worker --coordinator ws://YOUR_IP:{args.port}")
    print()

    asyncio.run(run_coordinator_server(coordinator, args.host, args.port))


if __name__ == "__main__":
    main()
