

from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # non-interactive backend

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from datasets import DatasetDict
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from transformers import (
    AutoTokenizer,
    DistilBertForSequenceClassification,
    Trainer,
    TrainingArguments,
)

# Resolve project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data.load_data import EMOTION_LABELS, ID2LABEL
from models.distilbert_clf import (
    BEST_MODEL_DIR,
    MAX_LENGTH,
    OUTPUT_DIR,
    compute_metrics,
)

RESULTS_DIR = PROJECT_ROOT / "results"


def load_best_model():
    """Load the best saved DistilBERT checkpoint and tokenizer."""
    tokenizer = AutoTokenizer.from_pretrained(str(BEST_MODEL_DIR))
    model = DistilBertForSequenceClassification.from_pretrained(str(BEST_MODEL_DIR))
    return model, tokenizer


def evaluate_on_test(
    dataset: DatasetDict,
    model=None,
    tokenizer=None,
) -> dict:
    """Run inference on the test split and return a comprehensive metrics dict."""

    if model is None or tokenizer is None:
        model, tokenizer = load_best_model()

    # Tokenize test split
    test_ds = dataset["test"].map(
        lambda ex: tokenizer(
            ex["text"],
            padding="max_length",
            truncation=True,
            max_length=MAX_LENGTH,
        ),
        batched=True,
        desc="Tokenizing test set",
    )
    test_ds.set_format("torch", columns=["input_ids", "attention_mask", "label"])

    # Use Trainer for batch inference
    args = TrainingArguments(
        output_dir=str(OUTPUT_DIR / "eval_tmp"),
        per_device_eval_batch_size=64,
        report_to="none",
    )
    trainer = Trainer(model=model, args=args, compute_metrics=compute_metrics)
    predictions = trainer.predict(test_ds)
    preds = np.argmax(predictions.predictions, axis=-1)
    labels = predictions.label_ids

    macro_f1 = f1_score(labels, preds, average="macro", zero_division=0)
    weighted_f1 = f1_score(labels, preds, average="weighted", zero_division=0)
    acc = accuracy_score(labels, preds)

    report = classification_report(
        labels, preds,
        target_names=EMOTION_LABELS,
        zero_division=0,
        output_dict=True,
    )

    metrics = {
        "model": "DistilBERT (fine-tuned)",
        "test": {
            "macro_f1": round(macro_f1, 4),
            "weighted_f1": round(weighted_f1, 4),
            "accuracy": round(acc, 4),
        },
        "per_class_f1": {
            lbl: round(report[lbl]["f1-score"], 4) for lbl in EMOTION_LABELS
        },
    }

    return metrics, preds, labels


def plot_confusion_matrix(labels: np.ndarray, preds: np.ndarray, out_path: Path) -> None:
    """Generate and save a confusion matrix heatmap as PNG."""
    cm = confusion_matrix(labels, preds, labels=list(range(len(EMOTION_LABELS))))
    # Normalise per row for readability
    cm_norm = cm.astype(np.float64)
    row_sums = cm_norm.sum(axis=1, keepdims=True)
    row_sums = np.where(row_sums == 0, 1, row_sums)
    cm_norm = cm_norm / row_sums

    fig, ax = plt.subplots(figsize=(16, 14))
    sns.heatmap(
        cm_norm,
        annot=False,
        fmt=".2f",
        cmap="Blues",
        xticklabels=EMOTION_LABELS,
        yticklabels=EMOTION_LABELS,
        ax=ax,
    )
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("True", fontsize=12)
    ax.set_title("Normalised Confusion Matrix — DistilBERT on GoEmotions", fontsize=14)
    plt.xticks(rotation=45, ha="right", fontsize=8)
    plt.yticks(rotation=0, fontsize=8)
    plt.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    print(f"[eval] Confusion matrix saved → {out_path}")


def plot_training_curves(out_path: Path) -> None:
    """Parse Trainer logs and plot loss / macro-F1 training curves."""
    log_history_path = OUTPUT_DIR / "trainer_state.json"

    # Trainer saves state in each checkpoint; find the latest one
    checkpoints = sorted(OUTPUT_DIR.glob("checkpoint-*"))
    if checkpoints:
        candidate = checkpoints[-1] / "trainer_state.json"
        if candidate.exists():
            log_history_path = candidate

    if not log_history_path.exists():
        print(f"[eval] No trainer_state.json found at {log_history_path}; skipping curves.")
        return

    with open(log_history_path, "r", encoding="utf-8") as fh:
        state = json.load(fh)

    log_history = state.get("log_history", [])
    if not log_history:
        print("[eval] Empty log_history; skipping curves.")
        return

    train_steps, train_losses = [], []
    eval_steps, eval_losses, eval_f1s = [], [], []

    for entry in log_history:
        if "loss" in entry and "eval_loss" not in entry:
            train_steps.append(entry.get("step", 0))
            train_losses.append(entry["loss"])
        if "eval_loss" in entry:
            eval_steps.append(entry.get("step", 0))
            eval_losses.append(entry["eval_loss"])
            eval_f1s.append(entry.get("eval_macro_f1", 0))

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Loss curves
    axes[0].plot(train_steps, train_losses, label="Train loss", alpha=0.7)
    if eval_steps:
        axes[0].plot(eval_steps, eval_losses, label="Val loss", marker="o")
    axes[0].set_xlabel("Step")
    axes[0].set_ylabel("Loss")
    axes[0].set_title("Training & Validation Loss")
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    # F1 curve
    if eval_f1s:
        axes[1].plot(eval_steps, eval_f1s, marker="o", color="green", label="Val macro-F1")
        axes[1].set_xlabel("Step")
        axes[1].set_ylabel("Macro F1")
        axes[1].set_title("Validation Macro F1")
        axes[1].legend()
        axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    print(f"[eval] Training curves saved → {out_path}")


def generate_comparison_table(distilbert_metrics: dict, results_dir: Path) -> None:
    """Print and save a markdown comparison table: baseline vs DistilBERT."""
    baseline_path = results_dir / "baseline_metrics.json"
    if baseline_path.exists():
        with open(baseline_path, "r", encoding="utf-8") as fh:
            baseline = json.load(fh)
    else:
        baseline = None

    lines = [
        "# Model Comparison — EmoSense",
        "",
        "| Metric | TF-IDF + LR | DistilBERT |",
        "|--------|-------------|------------|",
    ]

    db = distilbert_metrics["test"]

    if baseline:
        bl = baseline["test"]
        lines.append(f"| Macro F1 | {bl['macro_f1']:.4f} | **{db['macro_f1']:.4f}** |")
        lines.append(f"| Weighted F1 | {bl['weighted_f1']:.4f} | **{db['weighted_f1']:.4f}** |")
        lines.append(f"| Accuracy | {bl['accuracy']:.4f} | **{db['accuracy']:.4f}** |")
    else:
        lines.append(f"| Macro F1 | — | **{db['macro_f1']:.4f}** |")
        lines.append(f"| Weighted F1 | — | **{db['weighted_f1']:.4f}** |")
        lines.append(f"| Accuracy | — | **{db['accuracy']:.4f}** |")

    # Per-class section
    lines.extend(["", "## Per-Class F1 Scores", ""])
    lines.append("| Emotion | TF-IDF + LR | DistilBERT |")
    lines.append("|---------|-------------|------------|")
    for lbl in EMOTION_LABELS:
        bl_f1 = baseline["per_class_f1"].get(lbl, 0) if baseline else "—"
        db_f1 = distilbert_metrics["per_class_f1"].get(lbl, 0)
        if isinstance(bl_f1, (int, float)):
            lines.append(f"| {lbl} | {bl_f1:.4f} | {db_f1:.4f} |")
        else:
            lines.append(f"| {lbl} | {bl_f1} | {db_f1:.4f} |")

    table_text = "\n".join(lines) + "\n"

    out_path = results_dir / "comparison.md"
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(table_text)
    print(f"[eval] Comparison table saved → {out_path}")

    # Also print to console
    print("\n" + table_text)



def run_evaluation(dataset: DatasetDict) -> dict:
    """Full evaluation pipeline: metrics, confusion matrix, curves, comparison."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    print("\n[eval] Evaluating best DistilBERT checkpoint on test set …")
    metrics, preds, labels = evaluate_on_test(dataset)

    # Save metrics JSON
    metrics_path = RESULTS_DIR / "distilbert_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as fh:
        json.dump(metrics, fh, indent=2)
    print(f"[eval] DistilBERT metrics saved → {metrics_path}")

    # Confusion matrix
    plot_confusion_matrix(labels, preds, RESULTS_DIR / "confusion_matrix.png")

    # Training curves
    plot_training_curves(RESULTS_DIR / "training_curves.png")

    # Comparison table
    generate_comparison_table(metrics, RESULTS_DIR)

    return metrics



if __name__ == "__main__":
    from data.load_data import main as load_data_main

    dataset = load_data_main()
    run_evaluation(dataset)
