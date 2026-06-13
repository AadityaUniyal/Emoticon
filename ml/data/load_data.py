"""
load_data.py — Download GoEmotions from HuggingFace, convert multi-label
rows to single dominant label, print class distribution, and persist
label mappings (label2id.json, id2label.json) to the data/ directory.
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from datasets import DatasetDict, load_dataset

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EMOTION_LABELS: list[str] = [
    "admiration", "amusement", "anger", "annoyance", "approval",
    "caring", "confusion", "curiosity", "desire", "disapproval",
    "disgust", "embarrassment", "excitement", "fear", "gratitude",
    "grief", "joy", "love", "nervousness", "optimism",
    "pride", "realization", "relief", "remorse", "sadness",
    "surprise", "neutral",
]

LABEL2ID: dict[str, int] = {lbl: idx for idx, lbl in enumerate(EMOTION_LABELS)}
ID2LABEL: dict[int, str] = {idx: lbl for idx, lbl in enumerate(EMOTION_LABELS)}

DATA_DIR: Path = Path(__file__).resolve().parent


def _dominant_label(label_ids: list[int]) -> int:
    """Return the first (dominant) label from a multi-label list."""
    return label_ids[0] if label_ids else LABEL2ID["neutral"]


def load_goemotions(seed: int = 42) -> DatasetDict:
    """Download GoEmotions, collapse to single-label, and return a DatasetDict."""
    print("[data] Downloading GoEmotions from HuggingFace …")
    raw: DatasetDict = load_dataset(
        "google-research-datasets/goemotions", "simplified", trust_remote_code=True
    )

    def _map_single_label(example: dict) -> dict:
        """Collapse multi-label 'labels' to a single integer 'label'."""
        example["label"] = _dominant_label(example["labels"])
        return example

    processed = raw.map(_map_single_label, remove_columns=["labels"])
    # Shuffle training split for reproducibility
    processed["train"] = processed["train"].shuffle(seed=seed)
    return processed


def print_class_distribution(dataset: DatasetDict) -> None:
    """Pretty-print per-class counts for every split."""
    for split_name in dataset:
        counts = Counter(dataset[split_name]["label"])
        total = sum(counts.values())
        print(f"\n{'=' * 60}")
        print(f"  Split: {split_name}  ({total:,} examples)")
        print(f"{'=' * 60}")
        for idx in sorted(counts):
            lbl = ID2LABEL[idx]
            cnt = counts[idx]
            pct = cnt / total * 100
            bar = "█" * int(pct)
            print(f"  {idx:>2}  {lbl:<16} {cnt:>6}  ({pct:5.2f}%)  {bar}")


def save_label_mappings() -> None:
    """Persist label2id.json and id2label.json to the data/ directory."""
    l2i_path = DATA_DIR / "label2id.json"
    i2l_path = DATA_DIR / "id2label.json"

    with open(l2i_path, "w", encoding="utf-8") as fh:
        json.dump(LABEL2ID, fh, indent=2)
    print(f"[data] Saved {l2i_path}")

    # JSON keys must be strings
    id2label_str = {str(k): v for k, v in ID2LABEL.items()}
    with open(i2l_path, "w", encoding="utf-8") as fh:
        json.dump(id2label_str, fh, indent=2)
    print(f"[data] Saved {i2l_path}")


def compute_class_weights(dataset: DatasetDict, split: str = "train") -> np.ndarray:
    """Compute inverse-frequency class weights for the training split."""
    labels = np.array(dataset[split]["label"])
    counts = np.bincount(labels, minlength=len(EMOTION_LABELS)).astype(np.float64)
    # Avoid division-by-zero for absent classes
    counts = np.where(counts == 0, 1.0, counts)
    weights = counts.sum() / (len(EMOTION_LABELS) * counts)
    return weights.astype(np.float32)


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------

def main(seed: int = 42) -> DatasetDict:
    """Load data, print stats, save mappings, and return the dataset."""
    dataset = load_goemotions(seed=seed)
    print_class_distribution(dataset)
    save_label_mappings()
    return dataset


if __name__ == "__main__":
    main()
