#!/usr/bin/env python3
"""Text generation entry point for Nova LLM.

Usage:
    python scripts/generate.py --checkpoint checkpoints/latest.pt --prompt "Once upon a time"
    python scripts/generate.py --checkpoint checkpoints/best.pt --prompt "The meaning of life" --temperature 0.6 --max-tokens 512
"""

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch
from nova.config import NovaConfig
from nova.model import NovaLLM
from nova.tokenizer import NovaTokenizer
from nova.generate import generate, stream_generate


def main():
    parser = argparse.ArgumentParser(description="Generate text with Nova LLM")
    parser.add_argument("--checkpoint", type=str, required=True, help="Path to model checkpoint")
    parser.add_argument("--tokenizer", type=str, default="tokenizer", help="Path to tokenizer dir")
    parser.add_argument("--prompt", type=str, default="Once upon a time", help="Input prompt")
    parser.add_argument("--max-tokens", type=int, default=256, help="Max tokens to generate")
    parser.add_argument("--temperature", type=float, default=0.8, help="Sampling temperature")
    parser.add_argument("--top-k", type=int, default=50, help="Top-k sampling")
    parser.add_argument("--top-p", type=float, default=0.9, help="Nucleus sampling threshold")
    parser.add_argument("--rep-penalty", type=float, default=1.1, help="Repetition penalty")
    parser.add_argument("--stream", action="store_true", help="Stream output token by token")
    parser.add_argument("--device", type=str, default="auto")
    args = parser.parse_args()

    # Device
    if args.device == "auto":
        if torch.cuda.is_available():
            device = "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            device = "mps"
        else:
            device = "cpu"
    else:
        device = args.device

    # Load tokenizer
    print(f"Loading tokenizer from {args.tokenizer}...")
    tokenizer = NovaTokenizer.load(args.tokenizer)

    # Load model
    print(f"Loading model from {args.checkpoint}...")
    checkpoint = torch.load(args.checkpoint, map_location=device)
    config = NovaConfig(**checkpoint["config"])
    model = NovaLLM(config).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    print(f"Model loaded ({model.estimate_params():,} params) on {device}")

    # Encode prompt
    prompt_tokens = tokenizer.encode(args.prompt)
    print(f"\nPrompt: {args.prompt}")
    print(f"Tokens: {len(prompt_tokens)}")
    print("-" * 60)

    t0 = time.time()

    if args.stream:
        # Streaming generation
        sys.stdout.write(args.prompt)
        sys.stdout.flush()
        n_generated = 0
        for token_id in stream_generate(
            model,
            prompt_tokens,
            max_new_tokens=args.max_tokens,
            temperature=args.temperature,
            top_k=args.top_k,
            top_p=args.top_p,
            repetition_penalty=args.rep_penalty,
            stop_tokens=[tokenizer.EOS_ID],
            device=device,
        ):
            text = tokenizer.decode([token_id])
            sys.stdout.write(text)
            sys.stdout.flush()
            n_generated += 1
        print()
    else:
        # Batch generation
        output_tokens = generate(
            model,
            prompt_tokens,
            max_new_tokens=args.max_tokens,
            temperature=args.temperature,
            top_k=args.top_k,
            top_p=args.top_p,
            repetition_penalty=args.rep_penalty,
            stop_tokens=[tokenizer.EOS_ID],
            device=device,
        )
        output_text = tokenizer.decode(output_tokens)
        print(output_text)
        n_generated = len(output_tokens) - len(prompt_tokens)

    dt = time.time() - t0
    print(f"\n[Generated {n_generated} tokens in {dt:.2f}s ({n_generated / dt:.1f} tok/s)]")


if __name__ == "__main__":
    main()
