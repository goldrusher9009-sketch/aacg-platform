"""Byte-Pair Encoding (BPE) Tokenizer — built from scratch.

Implements the same algorithm used by GPT-2/3/4 tokenizers:
1. Start with individual bytes as the vocabulary
2. Iteratively merge the most frequent adjacent pair
3. Continue until reaching the desired vocabulary size

Includes special tokens, encoding/decoding, and save/load.
"""

import json
import re
from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Tuple


# GPT-2 style regex pattern for pre-tokenization
# Splits on word boundaries, keeping contractions together
GPT2_PAT = re.compile(
    r"""'s|'t|'re|'ve|'m|'ll|'d| ?\w+| ?\d+| ?[^\s\w\d]+|\s+(?!\S)|\s+""",
    re.UNICODE,
)


class NovaTokenizer:
    """Byte-Pair Encoding tokenizer trained from scratch.

    Features:
    - Byte-level BPE (handles any UTF-8 text)
    - GPT-2 style pre-tokenization regex
    - Special tokens (BOS, EOS, PAD, UNK)
    - Save/load for reuse
    """

    # Special token IDs
    PAD_ID = 0
    BOS_ID = 1
    EOS_ID = 2
    UNK_ID = 3

    SPECIAL_TOKENS = {
        "<pad>": 0,
        "<bos>": 1,
        "<eos>": 2,
        "<unk>": 3,
    }

    def __init__(self, vocab_size: int = 4096):
        self.vocab_size = vocab_size
        self.merges: List[Tuple[int, int]] = []
        self.vocab: Dict[int, bytes] = {}
        self._build_base_vocab()

    def _build_base_vocab(self):
        """Initialize vocabulary with special tokens + all 256 byte values."""
        self.vocab = {}
        # Special tokens first
        for token, idx in self.SPECIAL_TOKENS.items():
            self.vocab[idx] = token.encode("utf-8")

        # All 256 byte values
        n_special = len(self.SPECIAL_TOKENS)
        for i in range(256):
            self.vocab[n_special + i] = bytes([i])

    @property
    def base_vocab_size(self) -> int:
        return len(self.SPECIAL_TOKENS) + 256

    def train(self, text: str, verbose: bool = True):
        """Train BPE merges from text data.

        Args:
            text: Training text
            verbose: Print progress
        """
        if verbose:
            print(f"Training BPE tokenizer (target vocab: {self.vocab_size})...")

        # Pre-tokenize using regex
        chunks = re.findall(GPT2_PAT, text)

        # Convert each chunk to a list of byte token IDs
        n_special = len(self.SPECIAL_TOKENS)
        ids_list = []
        for chunk in chunks:
            byte_ids = [b + n_special for b in chunk.encode("utf-8")]
            ids_list.append(byte_ids)

        # Iteratively find and merge most frequent pairs
        num_merges = self.vocab_size - self.base_vocab_size
        self.merges = []

        for i in range(num_merges):
            # Count all adjacent pairs across all chunks
            pair_counts = Counter()
            for ids in ids_list:
                for j in range(len(ids) - 1):
                    pair_counts[(ids[j], ids[j + 1])] += 1

            if not pair_counts:
                break

            # Find most frequent pair
            best_pair = pair_counts.most_common(1)[0][0]
            best_count = pair_counts[best_pair]

            if best_count < 2:
                break

            # Create new token ID
            new_id = self.base_vocab_size + len(self.merges)

            # Record merge
            self.merges.append(best_pair)

            # Build new vocab entry
            self.vocab[new_id] = self.vocab[best_pair[0]] + self.vocab[best_pair[1]]

            # Apply merge to all chunks
            ids_list = [self._apply_merge(ids, best_pair, new_id) for ids in ids_list]

            if verbose and (i + 1) % 100 == 0:
                print(f"  Merge {i + 1}/{num_merges}: "
                      f"({best_pair[0]}, {best_pair[1]}) -> {new_id} "
                      f"(count: {best_count}, "
                      f"token: {self.vocab[new_id]!r})")

        actual_vocab_size = self.base_vocab_size + len(self.merges)
        if verbose:
            print(f"Training complete. Vocab size: {actual_vocab_size} "
                  f"({len(self.merges)} merges)")

    @staticmethod
    def _apply_merge(ids: List[int], pair: Tuple[int, int], new_id: int) -> List[int]:
        """Replace all occurrences of pair in ids with new_id."""
        result = []
        i = 0
        while i < len(ids):
            if i < len(ids) - 1 and ids[i] == pair[0] and ids[i + 1] == pair[1]:
                result.append(new_id)
                i += 2
            else:
                result.append(ids[i])
                i += 1
        return result

    def encode(self, text: str, add_bos: bool = False, add_eos: bool = False) -> List[int]:
        """Encode text to token IDs.

        Args:
            text: Input text
            add_bos: Prepend BOS token
            add_eos: Append EOS token

        Returns:
            List of token IDs
        """
        # Pre-tokenize
        chunks = re.findall(GPT2_PAT, text)

        all_ids = []
        if add_bos:
            all_ids.append(self.BOS_ID)

        n_special = len(self.SPECIAL_TOKENS)

        for chunk in chunks:
            # Start with byte-level tokens
            ids = [b + n_special for b in chunk.encode("utf-8")]

            # Apply merges in order
            for pair in self.merges:
                ids = self._apply_merge(ids, pair, self.base_vocab_size + self.merges.index(pair))
                if len(ids) == 1:
                    break

            all_ids.extend(ids)

        if add_eos:
            all_ids.append(self.EOS_ID)

        return all_ids

    def decode(self, ids: List[int]) -> str:
        """Decode token IDs back to text.

        Args:
            ids: List of token IDs

        Returns:
            Decoded string
        """
        byte_chunks = []
        for token_id in ids:
            if token_id in self.SPECIAL_TOKENS.values():
                continue  # Skip special tokens in decoded output
            if token_id in self.vocab:
                byte_chunks.append(self.vocab[token_id])
            else:
                byte_chunks.append(b"\xef\xbf\xbd")  # Unicode replacement char

        return b"".join(byte_chunks).decode("utf-8", errors="replace")

    def save(self, path: str):
        """Save tokenizer to disk."""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)

        # Save merges
        with open(path / "merges.json", "w") as f:
            json.dump(self.merges, f)

        # Save config
        config = {
            "vocab_size": self.vocab_size,
            "actual_vocab_size": self.base_vocab_size + len(self.merges),
        }
        with open(path / "tokenizer_config.json", "w") as f:
            json.dump(config, f, indent=2)

        print(f"Tokenizer saved to {path}")

    @classmethod
    def load(cls, path: str) -> "NovaTokenizer":
        """Load tokenizer from disk."""
        path = Path(path)

        with open(path / "tokenizer_config.json") as f:
            config = json.load(f)

        tok = cls(vocab_size=config["vocab_size"])

        with open(path / "merges.json") as f:
            tok.merges = [tuple(p) for p in json.load(f)]

        # Rebuild vocab from merges
        for pair in tok.merges:
            new_id = tok.base_vocab_size + tok.merges.index(pair)
            tok.vocab[new_id] = tok.vocab[pair[0]] + tok.vocab[pair[1]]

        return tok

    def __len__(self) -> int:
        return self.base_vocab_size + len(self.merges)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Nova BPE Tokenizer")
    parser.add_argument("--train", action="store_true", help="Train tokenizer")
    parser.add_argument("--data", type=str, help="Path to training text file")
    parser.add_argument("--vocab-size", type=int, default=4096, help="Target vocab size")
    parser.add_argument("--save-path", type=str, default="tokenizer", help="Save directory")
    args = parser.parse_args()

    if args.train:
        assert args.data, "Must provide --data for training"
        with open(args.data) as f:
            text = f.read()

        tokenizer = NovaTokenizer(vocab_size=args.vocab_size)
        tokenizer.train(text)
        tokenizer.save(args.save_path)

        # Quick test
        test = "Hello, world! This is a test."
        encoded = tokenizer.encode(test)
        decoded = tokenizer.decode(encoded)
        print(f"\nTest: '{test}'")
        print(f"Encoded: {encoded}")
        print(f"Decoded: '{decoded}'")
        print(f"Roundtrip OK: {test == decoded}")
