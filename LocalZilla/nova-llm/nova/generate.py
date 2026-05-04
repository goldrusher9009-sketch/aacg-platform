"""Inference engine for Nova LLM.

Supports multiple sampling strategies for text generation:
- Greedy decoding
- Temperature scaling
- Top-k sampling
- Top-p (nucleus) sampling
- Repetition penalty
- KV-cache for fast autoregressive generation
"""

from typing import List, Optional

import torch
import torch.nn.functional as F

from nova.model import NovaLLM


@torch.no_grad()
def generate(
    model: NovaLLM,
    prompt_tokens: List[int],
    max_new_tokens: int = 256,
    temperature: float = 0.8,
    top_k: int = 50,
    top_p: float = 0.9,
    repetition_penalty: float = 1.1,
    stop_tokens: Optional[List[int]] = None,
    use_cache: bool = True,
    device: str = "cpu",
) -> List[int]:
    """Generate text tokens autoregressively with KV-cache.

    Args:
        model: Nova LLM model
        prompt_tokens: Input token IDs
        max_new_tokens: Maximum tokens to generate
        temperature: Sampling temperature (0 = greedy, higher = more random)
        top_k: Top-k filtering (0 = disabled)
        top_p: Nucleus sampling threshold (1.0 = disabled)
        repetition_penalty: Penalty for repeating tokens (1.0 = disabled)
        stop_tokens: Token IDs that trigger early stopping
        use_cache: Whether to use KV-cache for fast generation
        device: Device to run on

    Returns:
        Complete sequence (prompt + generated tokens)
    """
    model.eval()

    if stop_tokens is None:
        stop_tokens = []

    tokens = list(prompt_tokens)
    input_ids = torch.tensor([tokens], dtype=torch.long, device=device)

    cache = None
    start_pos = 0

    # Process prompt (prefill)
    if use_cache:
        logits, _, cache = model(input_ids, cache=None, start_pos=0)
        start_pos = len(tokens)
    else:
        logits, _, _ = model(input_ids)

    # Get logits for last position
    next_logits = logits[:, -1, :]

    for _ in range(max_new_tokens):
        # Apply repetition penalty
        if repetition_penalty != 1.0:
            for token_id in set(tokens):
                if next_logits[0, token_id] > 0:
                    next_logits[0, token_id] /= repetition_penalty
                else:
                    next_logits[0, token_id] *= repetition_penalty

        # Temperature
        if temperature == 0.0:
            # Greedy
            next_token = next_logits.argmax(dim=-1).item()
        else:
            logits_scaled = next_logits / temperature

            # Top-k filtering
            if top_k > 0:
                top_k_val = min(top_k, logits_scaled.size(-1))
                kth_val = torch.topk(logits_scaled, top_k_val, dim=-1).values[:, -1:]
                logits_scaled = torch.where(
                    logits_scaled < kth_val,
                    torch.full_like(logits_scaled, float("-inf")),
                    logits_scaled,
                )

            # Top-p (nucleus) filtering
            if top_p < 1.0:
                sorted_logits, sorted_indices = torch.sort(logits_scaled, descending=True, dim=-1)
                cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)

                # Remove tokens with cumulative probability above threshold
                sorted_mask = cumulative_probs - F.softmax(sorted_logits, dim=-1) >= top_p
                sorted_logits[sorted_mask] = float("-inf")

                # Scatter back
                logits_scaled = torch.zeros_like(logits_scaled).scatter_(
                    -1, sorted_indices, sorted_logits
                )

            # Sample
            probs = F.softmax(logits_scaled, dim=-1)
            next_token = torch.multinomial(probs, num_samples=1).item()

        tokens.append(next_token)

        # Check stop condition
        if next_token in stop_tokens:
            break

        # Next step
        next_input = torch.tensor([[next_token]], dtype=torch.long, device=device)

        if use_cache:
            logits, _, cache = model(next_input, cache=cache, start_pos=start_pos)
            start_pos += 1
        else:
            # Without cache, must re-process entire sequence
            full_input = torch.tensor([tokens], dtype=torch.long, device=device)
            logits, _, _ = model(full_input)

        next_logits = logits[:, -1, :]

    return tokens


def stream_generate(
    model: NovaLLM,
    prompt_tokens: List[int],
    max_new_tokens: int = 256,
    temperature: float = 0.8,
    top_k: int = 50,
    top_p: float = 0.9,
    repetition_penalty: float = 1.1,
    stop_tokens: Optional[List[int]] = None,
    device: str = "cpu",
):
    """Generator that yields tokens one at a time for streaming output.

    Same parameters as generate(), but yields each new token as it's produced.
    """
    model.eval()

    if stop_tokens is None:
        stop_tokens = []

    tokens = list(prompt_tokens)
    input_ids = torch.tensor([tokens], dtype=torch.long, device=device)

    # Prefill
    logits, _, cache = model(input_ids, cache=None, start_pos=0)
    start_pos = len(tokens)
    next_logits = logits[:, -1, :]

    for _ in range(max_new_tokens):
        # Apply repetition penalty
        if repetition_penalty != 1.0:
            for token_id in set(tokens):
                if next_logits[0, token_id] > 0:
                    next_logits[0, token_id] /= repetition_penalty
                else:
                    next_logits[0, token_id] *= repetition_penalty

        if temperature == 0.0:
            next_token = next_logits.argmax(dim=-1).item()
        else:
            logits_scaled = next_logits / temperature

            if top_k > 0:
                top_k_val = min(top_k, logits_scaled.size(-1))
                kth_val = torch.topk(logits_scaled, top_k_val, dim=-1).values[:, -1:]
                logits_scaled = torch.where(
                    logits_scaled < kth_val,
                    torch.full_like(logits_scaled, float("-inf")),
                    logits_scaled,
                )

            if top_p < 1.0:
                sorted_logits, sorted_indices = torch.sort(logits_scaled, descending=True, dim=-1)
                cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                sorted_mask = cumulative_probs - F.softmax(sorted_logits, dim=-1) >= top_p
                sorted_logits[sorted_mask] = float("-inf")
                logits_scaled = torch.zeros_like(logits_scaled).scatter_(
                    -1, sorted_indices, sorted_logits
                )

            probs = F.softmax(logits_scaled, dim=-1)
            next_token = torch.multinomial(probs, num_samples=1).item()

        tokens.append(next_token)
        yield next_token

        if next_token in stop_tokens:
            break

        next_input = torch.tensor([[next_token]], dtype=torch.long, device=device)
        logits, _, cache = model(next_input, cache=cache, start_pos=start_pos)
        start_pos += 1
        next_logits = logits[:, -1, :]
