"""
tfidf_logreg.py — TF-IDF + Logistic Regression baseline for GoEmotions.
Trains a multinomial LR on TF-IDF features and saves metrics to results/.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
)

# Resolve project root so we can import sibling packages
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data.load_data import EMOTION_LABELS, ID2LABEL


def train_baseline(dataset, results_dir: Path | None = None) -> dict:
    """Train TF-IDF + LogReg baseline and return a metrics dictionary."""

    results_dir = results_dir or (PROJECT_ROOT / "results")
    results_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Vectorise
    # ------------------------------------------------------------------
    print("\n[baseline] Fitting TF-IDF vectorizer …")
    vectorizer = TfidfVectorizer(
        max_features=50_000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        strip_accents="unicode",
    )
    X_train = vectorizer.fit_transform(dataset["train"]["text"])
    X_val = vectorizer.transform(dataset["validation"]["text"])
    X_test = vectorizer.transform(dataset["test"]["text"])

    y_train = np.array(dataset["train"]["label"])
    y_val = np.array(dataset["validation"]["label"])
    y_test = np.array(dataset["test"]["label"])

    print(f"[baseline] TF-IDF matrix — train: {X_train.shape}, "
          f"val: {X_val.shape}, test: {X_test.shape}")

    # ------------------------------------------------------------------
    # Train
    # ------------------------------------------------------------------
    print("[baseline] Training Logistic Regression …")
    t0 = time.perf_counter()
    clf = LogisticRegression(
        C=1.0,
        max_iter=1000,
        multi_class="multinomial",
        solver="lbfgs",
        n_jobs=-1,
        random_state=42,
    )
    clf.fit(X_train, y_train)
    train_time = time.perf_counter() - t0
    print(f"[baseline] Training completed in {train_time:.1f}s")

    # ------------------------------------------------------------------
    # Evaluate
    # ------------------------------------------------------------------
    y_pred_val = clf.predict(X_val)
    y_pred_test = clf.predict(X_test)

    val_macro_f1 = f1_score(y_val, y_pred_val, average="macro", zero_division=0)
    val_weighted_f1 = f1_score(y_val, y_pred_val, average="weighted", zero_division=0)
    val_accuracy = accuracy_score(y_val, y_pred_val)

    test_macro_f1 = f1_score(y_test, y_pred_test, average="macro", zero_division=0)
    test_weighted_f1 = f1_score(y_test, y_pred_test, average="weighted", zero_division=0)
    test_accuracy = accuracy_score(y_test, y_pred_test)

    print(f"\n[baseline] Validation — macro-F1: {val_macro_f1:.4f}  "
          f"weighted-F1: {val_weighted_f1:.4f}  accuracy: {val_accuracy:.4f}")
    print(f"[baseline] Test      — macro-F1: {test_macro_f1:.4f}  "
          f"weighted-F1: {test_weighted_f1:.4f}  accuracy: {test_accuracy:.4f}")

    # Per-class report
    report = classification_report(
        y_test,
        y_pred_test,
        target_names=EMOTION_LABELS,
        zero_division=0,
        output_dict=True,
    )

    # ------------------------------------------------------------------
    # Save
    # ------------------------------------------------------------------
    metrics = {
        "model": "TF-IDF + LogisticRegression",
        "tfidf_max_features": 50_000,
        "tfidf_ngram_range": [1, 2],
        "C": 1.0,
        "train_time_seconds": round(train_time, 2),
        "validation": {
            "macro_f1": round(val_macro_f1, 4),
            "weighted_f1": round(val_weighted_f1, 4),
            "accuracy": round(val_accuracy, 4),
        },
        "test": {
            "macro_f1": round(test_macro_f1, 4),
            "weighted_f1": round(test_weighted_f1, 4),
            "accuracy": round(test_accuracy, 4),
        },
        "per_class_f1": {
            lbl: round(report[lbl]["f1-score"], 4) for lbl in EMOTION_LABELS
        },
    }

    out_path = results_dir / "baseline_metrics.json"
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(metrics, fh, indent=2)
    print(f"[baseline] Metrics saved → {out_path}")

    return metrics


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    from data.load_data import main as load_data_main

    dataset = load_data_main()
    train_baseline(dataset)
