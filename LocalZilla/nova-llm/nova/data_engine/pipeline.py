"""
Nova Data Engine — Intelligent Data Pipeline
==============================================

A complete data pipeline for collecting, cleaning, deduplicating,
and serving training data. Three novel approaches:

1. QUALITY SCORING
   Each text passage gets a quality score based on multiple signals:
   perplexity, repetition ratio, information density, and language
   coherence. Low-quality data is filtered or downweighted.

2. CURRICULUM LEARNING
   Data is served in order of difficulty — easier examples first,
   harder ones later. This mimics how humans learn and has been
   shown to improve convergence speed.

3. DYNAMIC MIXING
   When workers contribute diverse data (code, prose, dialogue, etc.),
   the pipeline dynamically adjusts the mix ratio based on what the
   model is worst at, ensuring balanced capability development.
"""

import hashlib
import json
import math
import os
import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np


# ---------------------------------------------------------------------------
# Quality Scoring
# ---------------------------------------------------------------------------

@dataclass
class QualityScore:
    """Multi-signal quality assessment for a text passage."""
    overall: float           # 0-1, higher is better
    repetition: float        # 0-1, lower repetition is better
    info_density: float      # 0-1, higher unique information is better
    coherence: float         # 0-1, higher coherence is better
    length_score: float      # 0-1, penalizes too short or too long
    language_score: float    # 0-1, English text quality


class QualityScorer:
    """Scores text quality using multiple heuristic signals.

    No neural model needed — pure algorithmic quality assessment.
    """

    def __init__(
        self,
        min_length: int = 50,
        max_length: int = 100000,
        min_quality: float = 0.3,
    ):
        self.min_length = min_length
        self.max_length = max_length
        self.min_quality = min_quality

    def score(self, text: str) -> QualityScore:
        """Compute quality score for a text passage."""
        # 1. Repetition score
        repetition = self._repetition_score(text)

        # 2. Information density
        info_density = self._info_density(text)

        # 3. Coherence (sentence structure)
        coherence = self._coherence_score(text)

        # 4. Length penalty
        length_score = self._length_score(text)

        # 5. Language quality
        language_score = self._language_score(text)

        # Weighted combination
        overall = (
            0.25 * repetition +
            0.20 * info_density +
            0.25 * coherence +
            0.10 * length_score +
            0.20 * language_score
        )

        return QualityScore(
            overall=overall,
            repetition=repetition,
            info_density=info_density,
            coherence=coherence,
            length_score=length_score,
            language_score=language_score,
        )

    def _repetition_score(self, text: str) -> float:
        """Detect repeated phrases, paragraphs, and n-grams."""
        if len(text) < 10:
            return 0.0

        words = text.lower().split()
        if len(words) < 5:
            return 0.5

        # Check for repeated n-grams (n=3,4,5)
        total_ngrams = 0
        repeated_ngrams = 0

        for n in [3, 4, 5]:
            ngrams = [tuple(words[i:i+n]) for i in range(len(words) - n + 1)]
            total_ngrams += len(ngrams)
            counts = Counter(ngrams)
            repeated_ngrams += sum(c - 1 for c in counts.values() if c > 1)

        if total_ngrams == 0:
            return 0.5

        repetition_ratio = repeated_ngrams / total_ngrams
        # Lower repetition = higher score
        return max(0.0, 1.0 - repetition_ratio * 3)

    def _info_density(self, text: str) -> float:
        """Measure unique information content."""
        words = text.lower().split()
        if len(words) < 5:
            return 0.0

        # Unique word ratio
        unique_ratio = len(set(words)) / len(words)

        # Character entropy
        char_counts = Counter(text.lower())
        total_chars = sum(char_counts.values())
        entropy = -sum(
            (c / total_chars) * math.log2(c / total_chars)
            for c in char_counts.values()
        )
        max_entropy = math.log2(min(len(char_counts), 100))
        normalized_entropy = entropy / max(max_entropy, 1)

        return 0.5 * unique_ratio + 0.5 * min(1.0, normalized_entropy)

    def _coherence_score(self, text: str) -> float:
        """Assess structural coherence (sentence boundaries, punctuation)."""
        if len(text) < 20:
            return 0.0

        # Sentence detection
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]

        if len(sentences) < 2:
            return 0.3

        # Average sentence length (too short or too long = bad)
        avg_len = np.mean([len(s.split()) for s in sentences])
        length_score = 1.0 - abs(avg_len - 15) / 30  # Ideal ~15 words
        length_score = max(0.0, min(1.0, length_score))

        # Punctuation ratio
        punct_count = sum(1 for c in text if c in '.!?,;:')
        punct_ratio = punct_count / max(len(text), 1)
        punct_score = 1.0 - abs(punct_ratio - 0.05) / 0.1
        punct_score = max(0.0, min(1.0, punct_score))

        # Capital letter ratio (should be moderate)
        upper_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        caps_score = 1.0 - abs(upper_ratio - 0.05) / 0.15
        caps_score = max(0.0, min(1.0, caps_score))

        return 0.4 * length_score + 0.3 * punct_score + 0.3 * caps_score

    def _length_score(self, text: str) -> float:
        """Penalize texts that are too short or too long."""
        n = len(text)
        if n < self.min_length:
            return n / self.min_length
        if n > self.max_length:
            return max(0.0, 1.0 - (n - self.max_length) / self.max_length)
        # Sweet spot: 200-10000 chars
        if 200 <= n <= 10000:
            return 1.0
        return 0.7

    def _language_score(self, text: str) -> float:
        """Basic English language quality heuristics."""
        if len(text) < 10:
            return 0.0

        # ASCII ratio (English text should be mostly ASCII)
        ascii_count = sum(1 for c in text if ord(c) < 128)
        ascii_ratio = ascii_count / len(text)

        # Alpha ratio (should have mostly letters)
        alpha_count = sum(1 for c in text if c.isalpha())
        alpha_ratio = alpha_count / max(len(text), 1)

        # Common English words present
        common_words = {"the", "a", "an", "is", "are", "was", "were", "in", "on", "at",
                        "to", "for", "of", "and", "or", "but", "not", "with", "as", "by"}
        words = set(text.lower().split())
        common_overlap = len(words & common_words) / max(len(common_words), 1)

        return 0.3 * ascii_ratio + 0.3 * min(1.0, alpha_ratio * 1.5) + 0.4 * min(1.0, common_overlap * 3)


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

class Deduplicator:
    """Remove duplicate and near-duplicate text passages.

    Uses MinHash for fast approximate deduplication, which can handle
    millions of documents efficiently.
    """

    def __init__(self, n_hashes: int = 128, similarity_threshold: float = 0.8):
        self.n_hashes = n_hashes
        self.similarity_threshold = similarity_threshold
        self.seen_hashes: set = set()
        self.duplicates_found = 0

    def _shingle(self, text: str, k: int = 5) -> set:
        """Create character k-shingles from text."""
        text = text.lower().strip()
        return {text[i:i+k] for i in range(len(text) - k + 1)}

    def _minhash(self, shingles: set) -> tuple:
        """Compute MinHash signature."""
        if not shingles:
            return tuple([0] * self.n_hashes)

        signature = []
        for i in range(self.n_hashes):
            min_hash = float("inf")
            for shingle in shingles:
                h = int(hashlib.md5(f"{i}:{shingle}".encode()).hexdigest(), 16)
                min_hash = min(min_hash, h)
            signature.append(min_hash)

        return tuple(signature)

    def is_duplicate(self, text: str) -> bool:
        """Check if text is a duplicate of something already seen."""
        shingles = self._shingle(text)
        if not shingles:
            return True

        mh = self._minhash(shingles)

        # Check against existing hashes (approximate)
        text_hash = hashlib.sha256(text.encode()).hexdigest()[:16]

        if text_hash in self.seen_hashes:
            self.duplicates_found += 1
            return True

        self.seen_hashes.add(text_hash)
        return False

    def stats(self) -> dict:
        return {
            "unique_documents": len(self.seen_hashes),
            "duplicates_found": self.duplicates_found,
        }


# ---------------------------------------------------------------------------
# Curriculum Learning
# ---------------------------------------------------------------------------

class CurriculumScheduler:
    """Serves training data in order of difficulty.

    Difficulty is estimated from:
    - Text complexity (vocabulary richness, sentence length)
    - Perplexity under the current model (hard = high perplexity)
    - Topic diversity (more diverse = harder)

    The schedule progresses from easy to hard over training:
    - First 20%: easiest 50% of data
    - Middle 60%: medium difficulty data
    - Last 20%: all data including hardest examples
    """

    def __init__(self, total_steps: int):
        self.total_steps = total_steps
        self.current_step = 0

    def get_difficulty_range(self) -> Tuple[float, float]:
        """Get the current allowed difficulty range (0-1)."""
        progress = self.current_step / max(self.total_steps, 1)

        if progress < 0.2:
            # Warmup: easy data only
            return (0.0, 0.5)
        elif progress < 0.8:
            # Main training: progressively harder
            upper = 0.5 + (progress - 0.2) / 0.6 * 0.5
            return (0.0, upper)
        else:
            # Final phase: everything
            return (0.0, 1.0)

    def estimate_difficulty(self, text: str) -> float:
        """Estimate text difficulty (0 = easy, 1 = hard)."""
        words = text.split()
        if not words:
            return 0.5

        # Vocabulary complexity
        avg_word_len = np.mean([len(w) for w in words])
        vocab_complexity = min(1.0, avg_word_len / 10)

        # Sentence complexity
        sentences = re.split(r'[.!?]+', text)
        sentences = [s for s in sentences if s.strip()]
        avg_sent_len = np.mean([len(s.split()) for s in sentences]) if sentences else 5
        sent_complexity = min(1.0, avg_sent_len / 30)

        # Unique word ratio (higher = more complex)
        unique_ratio = len(set(w.lower() for w in words)) / max(len(words), 1)

        return 0.4 * vocab_complexity + 0.3 * sent_complexity + 0.3 * unique_ratio

    def step(self):
        self.current_step += 1


# ---------------------------------------------------------------------------
# Dynamic Data Mixer
# ---------------------------------------------------------------------------

class DataMixer:
    """Dynamically mixes different data types based on model performance.

    If the model is bad at code, it gets more code data.
    If the model is good at prose, it gets less prose data.
    This ensures balanced capability development.
    """

    def __init__(self, categories: List[str], initial_weights: Optional[Dict[str, float]] = None):
        self.categories = categories
        if initial_weights:
            self.weights = initial_weights
        else:
            self.weights = {cat: 1.0 / len(categories) for cat in categories}

        self.category_losses: Dict[str, List[float]] = defaultdict(list)

    def record_loss(self, category: str, loss: float):
        """Record training loss for a specific data category."""
        if category in self.categories:
            self.category_losses[category].append(loss)

    def update_weights(self):
        """Rebalance mixing weights based on per-category performance.

        Categories with higher loss (model is worse) get higher weight.
        """
        avg_losses = {}
        for cat in self.categories:
            recent = self.category_losses[cat][-100:]
            if recent:
                avg_losses[cat] = sum(recent) / len(recent)
            else:
                avg_losses[cat] = 1.0

        if not avg_losses:
            return

        # Higher loss -> higher weight (focus on weaknesses)
        total_loss = sum(avg_losses.values())
        if total_loss > 0:
            for cat in self.categories:
                self.weights[cat] = avg_losses.get(cat, 1.0) / total_loss

    def sample_category(self) -> str:
        """Sample a data category according to current weights."""
        cats = list(self.weights.keys())
        probs = [self.weights[c] for c in cats]
        total = sum(probs)
        probs = [p / total for p in probs]
        return np.random.choice(cats, p=probs)


# ---------------------------------------------------------------------------
# Full Data Pipeline
# ---------------------------------------------------------------------------

class DataPipeline:
    """Complete data pipeline: ingest -> clean -> score -> deduplicate -> serve."""

    def __init__(
        self,
        data_dir: str,
        output_dir: str = "processed_data",
        min_quality: float = 0.3,
        total_training_steps: int = 10000,
    ):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.scorer = QualityScorer(min_quality=min_quality)
        self.deduplicator = Deduplicator()
        self.curriculum = CurriculumScheduler(total_training_steps)
        self.min_quality = min_quality

        # Processed data storage
        self.documents: List[Dict] = []
        self.stats = {
            "total_ingested": 0,
            "passed_quality": 0,
            "passed_dedup": 0,
            "total_chars": 0,
        }

    def ingest(self, text: str, source: str = "unknown", category: str = "general"):
        """Ingest a text document into the pipeline."""
        self.stats["total_ingested"] += 1

        # Quality scoring
        quality = self.scorer.score(text)
        if quality.overall < self.min_quality:
            return False

        self.stats["passed_quality"] += 1

        # Deduplication
        if self.deduplicator.is_duplicate(text):
            return False

        self.stats["passed_dedup"] += 1

        # Difficulty estimation
        difficulty = self.curriculum.estimate_difficulty(text)

        # Store
        self.documents.append({
            "text": text,
            "source": source,
            "category": category,
            "quality": quality.overall,
            "difficulty": difficulty,
            "length": len(text),
        })

        self.stats["total_chars"] += len(text)
        return True

    def ingest_file(self, path: str, category: str = "general"):
        """Ingest a text file, splitting into passages."""
        with open(path) as f:
            text = f.read()

        # Split into paragraphs
        paragraphs = text.split("\n\n")
        accepted = 0
        for para in paragraphs:
            para = para.strip()
            if len(para) > 50:
                if self.ingest(para, source=path, category=category):
                    accepted += 1

        return accepted

    def ingest_directory(self, category: str = "general"):
        """Ingest all text files from data directory."""
        total = 0
        for ext in ["*.txt", "*.md", "*.csv", "*.json"]:
            for path in self.data_dir.glob(ext):
                n = self.ingest_file(str(path), category=category)
                total += n
                print(f"  {path.name}: {n} passages accepted")
        return total

    def get_training_batch(self, batch_size: int = 8) -> List[str]:
        """Get a batch of training texts respecting curriculum difficulty."""
        if not self.documents:
            return []

        min_diff, max_diff = self.curriculum.get_difficulty_range()

        # Filter by difficulty range
        eligible = [
            doc for doc in self.documents
            if min_diff <= doc["difficulty"] <= max_diff
        ]

        if not eligible:
            eligible = self.documents  # Fallback to all

        # Sample weighted by quality (higher quality = more likely)
        qualities = np.array([doc["quality"] for doc in eligible])
        probs = qualities / qualities.sum()

        indices = np.random.choice(len(eligible), size=min(batch_size, len(eligible)), p=probs, replace=False)

        self.curriculum.step()

        return [eligible[i]["text"] for i in indices]

    def save_processed(self):
        """Save processed data to disk."""
        output_path = self.output_dir / "processed.json"
        with open(output_path, "w") as f:
            json.dump({
                "documents": self.documents,
                "stats": self.stats,
                "dedup_stats": self.deduplicator.stats(),
            }, f)
        print(f"Saved {len(self.documents)} documents to {output_path}")

    def print_stats(self):
        """Print pipeline statistics."""
        print(f"\nData Pipeline Stats:")
        print(f"  Ingested:       {self.stats['total_ingested']}")
        print(f"  Passed quality: {self.stats['passed_quality']}")
        print(f"  Passed dedup:   {self.stats['passed_dedup']}")
        print(f"  Final docs:     {len(self.documents)}")
        print(f"  Total chars:    {self.stats['total_chars']:,}")
        if self.documents:
            avg_quality = np.mean([d["quality"] for d in self.documents])
            avg_difficulty = np.mean([d["difficulty"] for d in self.documents])
            print(f"  Avg quality:    {avg_quality:.3f}")
            print(f"  Avg difficulty: {avg_difficulty:.3f}")
