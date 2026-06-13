"""
train.py — CLI entry-point for the EmoSense ML pipeline.
Orchestrates: data loading → baseline → tokenization → DistilBERT training → evaluation.
"""

from __future__ import annotations

import argparse
import os
import random
import sys
from pathlib import Path

import numpy as np
import torch

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))


def set_seed(seed: int) -> None:
    """Set random seeds globally for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="EmoSense — Train the emotion classification pipeline.",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=4,
        help="Number of training epochs (default: 4)",
    )
    parser.add_argument(
        "--batch_size",
        type=int,
        default=32,
        help="Training batch size (default: 32)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed (default: 42)",
    )
    parser.add_argument(
        "--no-baseline",
        action="store_true",
        default=False,
        help="Skip the TF-IDF + LogReg baseline step",
    )
    return parser.parse_args()


def main() -> None:
    """Run the full training pipeline."""
    args = parse_args()

    # ----- Seed everything -----
    set_seed(args.seed)
    os.environ["TRANSFORMERS_SEED"] = str(args.seed)
    print(f"[train] Seed set to {args.seed}")

    # ----- Step 1: Load data -----
    print("\n" + "=" * 60)
    print("  STEP 1 / 4 — Loading GoEmotions dataset")
    print("=" * 60)
    from data.load_data import main as load_data_main
    dataset = load_data_main(seed=args.seed)

    # ----- Step 2: Baseline -----
    if not args.no_baseline:
        print("\n" + "=" * 60)
        print("  STEP 2 / 4 — Training TF-IDF + LogReg baseline")
        print("=" * 60)
        from baseline.tfidf_logreg import train_baseline
        train_baseline(dataset)
    else:
        print("\n[train] Skipping baseline (--no-baseline flag set)")

    # ----- Step 3: DistilBERT training -----
    print("\n" + "=" * 60)
    print("  STEP 3 / 4 — Fine-tuning DistilBERT")
    print("=" * 60)
    from models.distilbert_clf import train_model
    train_model(
        dataset,
        epochs=args.epochs,
        batch_size=args.batch_size,
        seed=args.seed,
    )

    # ----- Step 4: Evaluation -----
    print("\n" + "=" * 60)
    print("  STEP 4 / 4 — Evaluating on test set")
    print("=" * 60)
    from evaluate.metrics import run_evaluation
    run_evaluation(dataset)

    print("\n" + "=" * 60)
    print("  ✓ Pipeline complete!  Check  results/  for outputs.")
    print("=" * 60)


if __name__ == "__main__":
    main()
