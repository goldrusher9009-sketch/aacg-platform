"""Nova LLM — Full transformer architecture.

Implements a modern decoder-only transformer with:
- RoPE (Rotary Position Embeddings)
- RMSNorm (Root Mean Square Layer Normalization)
- SwiGLU (Swish-Gated Linear Unit activation)
- Grouped Query Attention (GQA)
- KV-Cache for efficient autoregressive inference
- Pre-norm residual connections
"""

import math
from typing import Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F

from nova.config import NovaConfig


# ---------------------------------------------------------------------------
# RMSNorm — Faster and more stable than LayerNorm
# ---------------------------------------------------------------------------

class RMSNorm(nn.Module):
    """Root Mean Square Layer Normalization (Zhang & Sennrich, 2019).

    Simpler and faster than LayerNorm — no mean subtraction or bias.
    Used in LLaMA, Mistral, Gemma, and most modern LLMs.
    """

    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        rms = torch.rsqrt(x.float().pow(2).mean(-1, keepdim=True) + self.eps)
        return (x.float() * rms).type_as(x) * self.weight


# ---------------------------------------------------------------------------
# Rotary Position Embeddings (RoPE)
# ---------------------------------------------------------------------------

def precompute_rope_freqs(dim: int, max_seq_len: int, theta: float = 10000.0) -> torch.Tensor:
    """Precompute the complex exponential frequencies for RoPE.

    RoPE encodes position by rotating query/key vectors in 2D subspaces.
    This gives the model relative position awareness without explicit position embeddings.
    """
    freqs = 1.0 / (theta ** (torch.arange(0, dim, 2).float() / dim))
    t = torch.arange(max_seq_len)
    freqs = torch.outer(t, freqs)
    # Complex exponentials: cos(θ) + i·sin(θ)
    freqs_cis = torch.polar(torch.ones_like(freqs), freqs)
    return freqs_cis


def apply_rope(
    xq: torch.Tensor,
    xk: torch.Tensor,
    freqs_cis: torch.Tensor,
) -> Tuple[torch.Tensor, torch.Tensor]:
    """Apply rotary position embeddings to query and key tensors.

    Reshapes the last dimension into complex pairs, multiplies by the
    rotation matrix (represented as complex exponentials), then reshapes back.
    """
    # Reshape to complex: (..., dim) -> (..., dim/2, 2) -> complex
    xq_complex = torch.view_as_complex(xq.float().reshape(*xq.shape[:-1], -1, 2))
    xk_complex = torch.view_as_complex(xk.float().reshape(*xk.shape[:-1], -1, 2))

    # Reshape freqs for broadcasting: (seq_len, dim/2) -> (1, seq_len, 1, dim/2)
    freqs_cis = freqs_cis.unsqueeze(0).unsqueeze(2)

    # Apply rotation and convert back to real
    xq_out = torch.view_as_real(xq_complex * freqs_cis).flatten(-2)
    xk_out = torch.view_as_real(xk_complex * freqs_cis).flatten(-2)

    return xq_out.type_as(xq), xk_out.type_as(xk)


# ---------------------------------------------------------------------------
# Grouped Query Attention (GQA)
# ---------------------------------------------------------------------------

class GroupedQueryAttention(nn.Module):
    """Multi-head attention with Grouped Query Attention (GQA).

    GQA uses fewer key/value heads than query heads, reducing memory
    and computation while maintaining quality. When n_kv_heads == n_heads,
    this is standard MHA. When n_kv_heads == 1, this is Multi-Query Attention.

    Includes KV-cache for efficient autoregressive generation.
    """

    def __init__(self, config: NovaConfig):
        super().__init__()
        self.n_heads = config.n_heads
        self.n_kv_heads = config.n_kv_heads
        self.head_dim = config.head_dim
        self.n_rep = self.n_heads // self.n_kv_heads  # How many Q heads share each KV head

        self.wq = nn.Linear(config.dim, config.n_heads * self.head_dim, bias=False)
        self.wk = nn.Linear(config.dim, config.n_kv_heads * self.head_dim, bias=False)
        self.wv = nn.Linear(config.dim, config.n_kv_heads * self.head_dim, bias=False)
        self.wo = nn.Linear(config.n_heads * self.head_dim, config.dim, bias=False)

        self.attn_dropout = nn.Dropout(config.attention_dropout)

    def forward(
        self,
        x: torch.Tensor,
        freqs_cis: torch.Tensor,
        mask: Optional[torch.Tensor] = None,
        cache: Optional[Tuple[torch.Tensor, torch.Tensor]] = None,
    ) -> Tuple[torch.Tensor, Optional[Tuple[torch.Tensor, torch.Tensor]]]:
        B, T, _ = x.shape

        # Project to Q, K, V
        q = self.wq(x).view(B, T, self.n_heads, self.head_dim)
        k = self.wk(x).view(B, T, self.n_kv_heads, self.head_dim)
        v = self.wv(x).view(B, T, self.n_kv_heads, self.head_dim)

        # Apply RoPE to Q and K
        q = q.transpose(1, 2)  # (B, n_heads, T, head_dim)
        k = k.transpose(1, 2)  # (B, n_kv_heads, T, head_dim)
        v = v.transpose(1, 2)  # (B, n_kv_heads, T, head_dim)

        # RoPE operates on (B, T, n_heads, head_dim) so transpose back temporarily
        q_rope = q.transpose(1, 2)
        k_rope = k.transpose(1, 2)
        q_rope, k_rope = apply_rope(q_rope, k_rope, freqs_cis)
        q = q_rope.transpose(1, 2)
        k = k_rope.transpose(1, 2)

        # KV-Cache for inference
        new_cache = None
        if cache is not None:
            cache_k, cache_v = cache
            k = torch.cat([cache_k, k], dim=2)
            v = torch.cat([cache_v, v], dim=2)
            new_cache = (k, v)

        # Expand KV heads to match Q heads (GQA)
        if self.n_rep > 1:
            k = k.repeat_interleave(self.n_rep, dim=1)
            v = v.repeat_interleave(self.n_rep, dim=1)

        # Scaled dot-product attention
        scale = 1.0 / math.sqrt(self.head_dim)
        scores = torch.matmul(q, k.transpose(-2, -1)) * scale

        if mask is not None:
            scores = scores + mask

        attn = F.softmax(scores.float(), dim=-1).type_as(q)
        attn = self.attn_dropout(attn)

        out = torch.matmul(attn, v)  # (B, n_heads, T, head_dim)
        out = out.transpose(1, 2).contiguous().view(B, T, -1)

        return self.wo(out), new_cache


# ---------------------------------------------------------------------------
# SwiGLU Feed-Forward Network
# ---------------------------------------------------------------------------

class SwiGLUFFN(nn.Module):
    """SwiGLU Feed-Forward Network (Shazeer, 2020).

    Uses a gating mechanism with SiLU (Swish) activation:
        FFN(x) = (Swish(xW_gate) * xW_up) W_down

    More expressive than standard ReLU FFN, used in LLaMA, PaLM, etc.
    """

    def __init__(self, config: NovaConfig):
        super().__init__()
        self.w_gate = nn.Linear(config.dim, config.ff_dim, bias=False)
        self.w_up = nn.Linear(config.dim, config.ff_dim, bias=False)
        self.w_down = nn.Linear(config.ff_dim, config.dim, bias=False)
        self.dropout = nn.Dropout(config.dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.dropout(self.w_down(F.silu(self.w_gate(x)) * self.w_up(x)))


# ---------------------------------------------------------------------------
# Transformer Block
# ---------------------------------------------------------------------------

class TransformerBlock(nn.Module):
    """Single transformer decoder block with pre-norm architecture.

    Architecture: x -> RMSNorm -> GQA -> residual -> RMSNorm -> SwiGLU -> residual
    """

    def __init__(self, config: NovaConfig):
        super().__init__()
        self.attention = GroupedQueryAttention(config)
        self.feed_forward = SwiGLUFFN(config)
        self.attention_norm = RMSNorm(config.dim, eps=config.norm_eps)
        self.ffn_norm = RMSNorm(config.dim, eps=config.norm_eps)

    def forward(
        self,
        x: torch.Tensor,
        freqs_cis: torch.Tensor,
        mask: Optional[torch.Tensor] = None,
        cache: Optional[Tuple[torch.Tensor, torch.Tensor]] = None,
    ) -> Tuple[torch.Tensor, Optional[Tuple[torch.Tensor, torch.Tensor]]]:
        # Pre-norm attention with residual
        h, new_cache = self.attention(self.attention_norm(x), freqs_cis, mask, cache)
        x = x + h

        # Pre-norm FFN with residual
        x = x + self.feed_forward(self.ffn_norm(x))

        return x, new_cache


# ---------------------------------------------------------------------------
# Nova LLM — The Full Model
# ---------------------------------------------------------------------------

class NovaLLM(nn.Module):
    """Nova: A modern decoder-only transformer language model.

    Complete architecture with all modern innovations:
    - Token + RoPE embeddings
    - N transformer blocks with GQA + SwiGLU
    - Final RMSNorm
    - Tied input/output embeddings (optional)
    """

    def __init__(self, config: NovaConfig):
        super().__init__()
        self.config = config

        # Token embeddings (no learned position embedding — RoPE handles position)
        self.tok_emb = nn.Embedding(config.vocab_size, config.dim)
        self.dropout = nn.Dropout(config.dropout)

        # Transformer blocks
        self.layers = nn.ModuleList([TransformerBlock(config) for _ in range(config.n_layers)])

        # Final normalization
        self.norm = RMSNorm(config.dim, eps=config.norm_eps)

        # Output projection (language model head)
        self.lm_head = nn.Linear(config.dim, config.vocab_size, bias=False)

        # Weight tying: share embedding weights with output projection
        self.tok_emb.weight = self.lm_head.weight

        # Precompute RoPE frequencies
        self.register_buffer(
            "freqs_cis",
            precompute_rope_freqs(config.head_dim, config.max_seq_len * 2, config.rope_theta),
            persistent=False,
        )

        # Initialize weights
        self.apply(self._init_weights)
        # Scale residual projections (GPT-2 style)
        for pn, p in self.named_parameters():
            if pn.endswith("wo.weight") or pn.endswith("w_down.weight"):
                nn.init.normal_(p, mean=0.0, std=0.02 / math.sqrt(2 * config.n_layers))

    def _init_weights(self, module: nn.Module):
        if isinstance(module, nn.Linear):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def forward(
        self,
        tokens: torch.Tensor,
        targets: Optional[torch.Tensor] = None,
        cache: Optional[list] = None,
        start_pos: int = 0,
    ) -> Tuple[torch.Tensor, Optional[torch.Tensor], Optional[list]]:
        """Forward pass.

        Args:
            tokens: Input token IDs, shape (B, T)
            targets: Target token IDs for loss computation, shape (B, T)
            cache: List of KV-cache tuples per layer (for inference)
            start_pos: Starting position for RoPE (for cached inference)

        Returns:
            logits: Output logits, shape (B, T, vocab_size)
            loss: Cross-entropy loss if targets provided
            new_cache: Updated KV-cache
        """
        B, T = tokens.shape
        assert T <= self.config.max_seq_len, f"Sequence length {T} exceeds max {self.config.max_seq_len}"

        # Token embeddings
        h = self.dropout(self.tok_emb(tokens))

        # Get RoPE frequencies for this sequence
        freqs_cis = self.freqs_cis[start_pos : start_pos + T]

        # Causal mask
        if T > 1:
            mask = torch.full((T, T), float("-inf"), device=tokens.device)
            mask = torch.triu(mask, diagonal=1)
            # If using cache, we need to account for cached tokens
            if cache is not None and cache[0] is not None:
                cache_len = cache[0][0].shape[2]
                pad = torch.zeros((T, cache_len), device=tokens.device)
                mask = torch.cat([pad, mask], dim=-1)
            mask = mask.unsqueeze(0).unsqueeze(0)  # (1, 1, T, T+cache)
        else:
            mask = None

        # Forward through transformer blocks
        new_cache = []
        for i, layer in enumerate(self.layers):
            layer_cache = cache[i] if cache is not None else None
            h, layer_new_cache = layer(h, freqs_cis, mask, layer_cache)
            new_cache.append(layer_new_cache)

        # Final norm + projection
        h = self.norm(h)
        logits = self.lm_head(h)

        # Compute loss if targets provided
        loss = None
        if targets is not None:
            loss = F.cross_entropy(
                logits.view(-1, logits.size(-1)),
                targets.view(-1),
                ignore_index=-1,
            )

        return logits, loss, new_cache

    @torch.no_grad()
    def estimate_params(self) -> int:
        """Count actual trainable parameters."""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)
