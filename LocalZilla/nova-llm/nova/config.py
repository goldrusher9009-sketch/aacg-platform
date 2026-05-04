"""Model configuration for Nova LLM."""

from dataclasses import dataclass, field, asdict
import json
from pathlib import Path


@dataclass
class NovaConfig:
    """Configuration for the Nova transformer model.

    Follows modern LLM design: pre-norm, RoPE, SwiGLU, GQA.
    """
    # Model architecture
    vocab_size: int = 32000
    dim: int = 768
    n_layers: int = 12
    n_heads: int = 12
    n_kv_heads: int = 4          # For GQA; set equal to n_heads for standard MHA
    max_seq_len: int = 1024

    # Feed-forward
    ff_dim_multiplier: float = 2.667  # SwiGLU uses 8/3 * dim by default
    ff_dim: int = 0                    # Computed if 0

    # Regularization
    dropout: float = 0.0
    attention_dropout: float = 0.0

    # RoPE
    rope_theta: float = 10000.0

    # Normalization
    norm_eps: float = 1e-6

    # Training
    learning_rate: float = 3e-4
    weight_decay: float = 0.1
    beta1: float = 0.9
    beta2: float = 0.95
    grad_clip: float = 1.0
    warmup_steps: int = 200
    max_steps: int = 10000
    batch_size: int = 32
    gradient_accumulation_steps: int = 1

    # Mixed precision
    use_amp: bool = True

    # Logging
    log_interval: int = 10
    eval_interval: int = 500
    save_interval: int = 1000

    def __post_init__(self):
        if self.ff_dim == 0:
            # SwiGLU hidden dim: 8/3 * dim, rounded to multiple of 256
            self.ff_dim = int(self.ff_dim_multiplier * self.dim)
            self.ff_dim = ((self.ff_dim + 255) // 256) * 256

        assert self.dim % self.n_heads == 0, "dim must be divisible by n_heads"
        assert self.n_heads % self.n_kv_heads == 0, "n_heads must be divisible by n_kv_heads"

    @property
    def head_dim(self) -> int:
        return self.dim // self.n_heads

    @property
    def n_params(self) -> int:
        """Estimate total parameter count."""
        embed = self.vocab_size * self.dim
        attn_per_layer = (
            self.dim * self.dim +                                    # Q
            self.dim * (self.n_kv_heads * self.head_dim) +           # K
            self.dim * (self.n_kv_heads * self.head_dim) +           # V
            self.dim * self.dim                                       # O
        )
        ff_per_layer = 3 * self.dim * self.ff_dim  # gate, up, down for SwiGLU
        norm_per_layer = 2 * self.dim               # 2 RMSNorms per layer
        final_norm = self.dim
        lm_head = self.vocab_size * self.dim        # output projection

        total = embed + self.n_layers * (attn_per_layer + ff_per_layer + norm_per_layer) + final_norm + lm_head
        return total

    def save(self, path: str):
        with open(path, "w") as f:
            json.dump(asdict(self), f, indent=2)

    @classmethod
    def load(cls, path: str) -> "NovaConfig":
        with open(path) as f:
            data = json.load(f)
        return cls(**data)

    @classmethod
    def tiny(cls) -> "NovaConfig":
        return cls(dim=384, n_layers=6, n_heads=6, n_kv_heads=2, max_seq_len=512, vocab_size=4096)

    @classmethod
    def small(cls) -> "NovaConfig":
        return cls(dim=768, n_layers=12, n_heads=12, n_kv_heads=4, max_seq_len=1024)

    @classmethod
    def medium(cls) -> "NovaConfig":
        return cls(dim=1024, n_layers=24, n_heads=16, n_kv_heads=4, max_seq_len=2048)

    @classmethod
    def large(cls) -> "NovaConfig":
        return cls(dim=2048, n_layers=32, n_heads=32, n_kv_heads=8, max_seq_len=4096)
