# Nova LLM — From-Scratch Transformer Language Model

A complete, modern transformer language model built from scratch in PyTorch.
Implements the same architectural innovations found in LLaMA 2/3, Mistral, and Phi.

## Architecture Features

- **RoPE** (Rotary Position Embeddings) — superior positional encoding
- **RMSNorm** — faster, more stable normalization
- **SwiGLU** — gated activation for better expressivity
- **Grouped Query Attention (GQA)** — efficient multi-head attention
- **KV-Cache** — fast autoregressive inference
- **Pre-norm architecture** — more stable training
- **Custom BPE Tokenizer** — trained from your data

## Quick Start

```bash
# Install dependencies
pip install torch numpy tqdm

# Train tokenizer on your data
python -m nova.tokenizer --train --data data/input.txt --vocab-size 4096

# Train the model
python scripts/train.py --config configs/small.json

# Generate text
python scripts/generate.py --checkpoint checkpoints/latest.pt --prompt "Once upon a time"
```

## Model Sizes

| Config   | Params | Layers | Heads | Dim  | Context |
|----------|--------|--------|-------|------|---------|
| tiny     | ~5M    | 6      | 6     | 384  | 512     |
| small    | ~30M   | 12     | 12    | 768  | 1024    |
| medium   | ~125M  | 24     | 16    | 1024 | 2048    |
| large    | ~350M  | 32     | 32    | 2048 | 4096    |

## Project Structure

```
nova-llm/
  nova/
    __init__.py
    model.py          # Full transformer architecture
    tokenizer.py      # BPE tokenizer from scratch
    trainer.py        # Training engine
    generate.py       # Inference with sampling + KV-cache
    config.py         # Model configuration
  configs/
    tiny.json
    small.json
    medium.json
  scripts/
    train.py          # Training entry point
    generate.py       # Generation entry point
  data/
    (your training data here)
  demo_numpy.py       # Pure numpy demo (no PyTorch needed)
```

## Training Your Own Model

1. Place your text data in `data/input.txt` (plain text, one document per line or continuous text)
2. Train the tokenizer: `python -m nova.tokenizer --train --data data/input.txt --vocab-size 4096`
3. Choose a config (start with `tiny` or `small`)
4. Train: `python scripts/train.py --config configs/small.json --data data/input.txt`
5. Generate: `python scripts/generate.py --checkpoint checkpoints/latest.pt --prompt "Your prompt"`

## Requirements

- Python 3.8+
- PyTorch 2.0+ (for the full version)
- NumPy (for the demo version)
