#!/usr/bin/env python3
"""
Quick Start — Train Nova LLM on sample data in minutes.

This script downloads a small text dataset, trains the tokenizer,
trains a tiny model, and generates sample text — all in one go.

Usage:
    python scripts/quickstart.py
"""

import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch
from nova.config import NovaConfig
from nova.model import NovaLLM
from nova.tokenizer import NovaTokenizer
from nova.trainer import TextDataset, Trainer
from nova.generate import generate


def get_sample_data():
    """Create sample training data."""
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    data_path = data_dir / "input.txt"

    if data_path.exists():
        print(f"Using existing data at {data_path}")
        return str(data_path)

    # Generate a decent amount of sample text
    print("Creating sample training data...")
    sample_text = """
The art of programming is the art of organizing complexity. Every program is a model
of a model within a theory of a model within a theory. Programs must be written for
people to read, and only incidentally for machines to execute.

The most important property of a program is whether it accomplishes the intention of
its user. Software is a great combination between artistry and engineering. When you
finally get something working, it just feels wonderful.

Any fool can write code that a computer can understand. Good programmers write code
that humans can understand. First, solve the problem. Then, write the code. The best
error message is the one that never shows up.

Code is like humor. When you have to explain it, it is bad. Sometimes it pays to stay
in bed on Monday, rather than spending the rest of the week debugging Monday's code.
The most disastrous thing that you can ever learn is your first programming language.

Talk is cheap. Show me the code. Programs must be written for people to read, and only
incidentally for machines to execute. The function of good software is to make the
complex appear to be simple.

In software, the most beautiful code, the most beautiful functions, and the most
beautiful programs are sometimes not there at all. Simplicity is prerequisite for
reliability. Measuring programming progress by lines of code is like measuring
aircraft building progress by weight.

The computer was born to solve problems that did not exist before. Technology is
nothing. What is important is that you have a faith in people, that they are basically
good and smart, and if you give them tools, they will do wonderful things with them.

If debugging is the process of removing software bugs, then programming must be the
process of putting them in. Before software can be reusable it first has to be usable.
The best way to predict the future is to invent it.

It is not enough for code to work. Clean code is simple and direct. Clean code reads
like well-written prose. Clean code never obscures the designer's intent but rather is
full of crisp abstractions and straightforward lines of control.

Make it work, make it right, make it fast. Premature optimization is the root of all
evil. There are only two hard things in computer science: cache invalidation and
naming things. Walking on water and developing software from a specification are easy
if both are frozen.

The best programs are the ones written when the programmer is supposed to be working
on something else. The most important single aspect of software development is to be
clear about what you are trying to build. Most good programmers do programming not
because they expect to get paid or get adulation by the public, but because it is fun.

""" * 5  # Repeat for more training data

    with open(data_path, "w") as f:
        f.write(sample_text)

    print(f"Created {len(sample_text):,} characters of sample data")
    return str(data_path)


def main():
    print("=" * 60)
    print("  Nova LLM — Quick Start")
    print("  Training a real transformer from scratch!")
    print("=" * 60)

    # Get data
    data_path = get_sample_data()
    with open(data_path) as f:
        text = f.read()

    # Train tokenizer
    print("\n[1/4] Training BPE tokenizer...")
    tokenizer = NovaTokenizer(vocab_size=512)
    tokenizer.train(text, verbose=False)
    tokenizer.save("tokenizer")
    print(f"  Vocab size: {len(tokenizer)}")

    # Tokenize
    token_ids = tokenizer.encode(text)
    print(f"  Total tokens: {len(token_ids):,}")

    # Create tiny config
    print("\n[2/4] Creating model...")
    config = NovaConfig.tiny()
    config.vocab_size = len(tokenizer)
    config.dim = 192
    config.n_layers = 4
    config.n_heads = 4
    config.n_kv_heads = 2
    config.max_seq_len = 128
    config.max_steps = 500
    config.batch_size = 8
    config.warmup_steps = 50
    config.log_interval = 50
    config.eval_interval = 250
    config.save_interval = 250
    config.learning_rate = 1e-3
    config.use_amp = False  # CPU-friendly

    model = NovaLLM(config)
    print(f"  Parameters: {model.estimate_params():,}")

    # Split data
    split = int(len(token_ids) * 0.9)
    train_data = TextDataset(token_ids[:split], config.max_seq_len)
    val_data = TextDataset(token_ids[split:], config.max_seq_len)

    # Train
    print(f"\n[3/4] Training for {config.max_steps} steps...")
    trainer = Trainer(
        model=model,
        config=config,
        train_dataset=train_data,
        val_dataset=val_data,
        checkpoint_dir="checkpoints",
        device="cuda" if torch.cuda.is_available() else "cpu",
    )
    trainer.train()

    # Generate
    print(f"\n[4/4] Generating text...")
    device = next(model.parameters()).device

    prompts = [
        "The art of",
        "Code is like",
        "The best programs",
    ]

    for prompt in prompts:
        prompt_tokens = tokenizer.encode(prompt)
        output_tokens = generate(
            model,
            prompt_tokens,
            max_new_tokens=100,
            temperature=0.8,
            top_k=30,
            top_p=0.9,
            device=str(device),
        )
        output_text = tokenizer.decode(output_tokens)
        print(f"\n  Prompt: '{prompt}'")
        print(f"  Output: '{output_text[:200]}'")

    print("\n" + "=" * 60)
    print("  Done! Your model is saved in checkpoints/")
    print("  To generate more: python scripts/generate.py --checkpoint checkpoints/latest.pt")
    print("=" * 60)


if __name__ == "__main__":
    main()
