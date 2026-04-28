#!/usr/bin/env python3
"""Training entry point for Nova LLM.

Usage:
    python scripts/train.py --config configs/tiny.json --data data/input.txt
    python scripts/train.py --config configs/small.json --data data/input.txt --resume checkpoints/latest.pt
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch
from nova.config import NovaConfig
from nova.model import NovaLLM
from nova.tokenizer import NovaTokenizer
from nova.trainer import TextDataset, Trainer


def main():
    parser = argparse.ArgumentParser(description="Train Nova LLM")
    parser.add_argument("--config", type=str, required=True, help="Path to config JSON")
    parser.add_argument("--data", type=str, required=True, help="Path to training text file")
    parser.add_argument("--tokenizer", type=str, default=None, help="Path to saved tokenizer")
    parser.add_argument("--vocab-size", type=int, default=4096, help="Vocab size for new tokenizer")
    parser.add_argument("--val-split", type=float, default=0.05, help="Validation split ratio")
    parser.add_argument("--resume", type=str, default=None, help="Resume from checkpoint")
    parser.add_argument("--checkpoint-dir", type=str, default="checkpoints")
    parser.add_argument("--device", type=str, default="auto")
    args = parser.parse_args()

    # Load config
    config = NovaConfig.load(args.config)
    print(f"Config loaded. Estimated params: {config.n_params:,}")

    # Load or train tokenizer
    if args.tokenizer and Path(args.tokenizer).exists():
        print(f"Loading tokenizer from {args.tokenizer}")
        tokenizer = NovaTokenizer.load(args.tokenizer)
    else:
        print("Training new tokenizer...")
        with open(args.data) as f:
            text = f.read()
        tokenizer = NovaTokenizer(vocab_size=args.vocab_size)
        tokenizer.train(text)
        tokenizer.save("tokenizer")

    # Update config vocab size to match tokenizer
    config.vocab_size = len(tokenizer)
    print(f"Vocab size: {config.vocab_size}")

    # Tokenize data
    print("Tokenizing data...")
    with open(args.data) as f:
        text = f.read()
    token_ids = tokenizer.encode(text)
    print(f"Total tokens: {len(token_ids):,}")

    # Train/val split
    split_idx = int(len(token_ids) * (1 - args.val_split))
    train_ids = token_ids[:split_idx]
    val_ids = token_ids[split_idx:]

    train_dataset = TextDataset(train_ids, config.max_seq_len)
    val_dataset = TextDataset(val_ids, config.max_seq_len) if val_ids else None

    print(f"Train sequences: {len(train_dataset):,}")
    if val_dataset:
        print(f"Val sequences: {len(val_dataset):,}")

    # Create model
    model = NovaLLM(config)
    print(f"Model created. Actual params: {model.estimate_params():,}")

    # Create trainer
    trainer = Trainer(
        model=model,
        config=config,
        train_dataset=train_dataset,
        val_dataset=val_dataset,
        checkpoint_dir=args.checkpoint_dir,
        device=args.device,
    )

    # Resume if requested
    if args.resume:
        trainer.load_checkpoint(args.resume)

    # Save config alongside checkpoints
    config.save(str(Path(args.checkpoint_dir) / "config.json"))

    # Train!
    trainer.train()


if __name__ == "__main__":
    main()
