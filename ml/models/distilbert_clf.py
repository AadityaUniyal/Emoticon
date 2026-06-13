

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import numpy as np
import torch
from datasets import DatasetDict
from sklearn.metrics import accuracy_score, f1_score
from transformers import (
    AutoTokenizer,
    DistilBertForSequenceClassification,
    EarlyStoppingCallback,
    Trainer,
    TrainingArguments,
)

# Resolve project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data.load_data import EMOTION_LABELS, ID2LABEL, LABEL2ID, compute_class_weights


MODEL_NAME = "distilbert-base-uncased"
MAX_LENGTH = 128
NUM_LABELS = 27

OUTPUT_DIR = PROJECT_ROOT / "outputs"
BEST_MODEL_DIR = OUTPUT_DIR / "best_model"


def get_tokenizer():
    """Return the DistilBERT tokenizer."""
    return AutoTokenizer.from_pretrained(MODEL_NAME)


def tokenize_function(examples: dict, tokenizer) -> dict:
    """Tokenize a batch of examples with padding and truncation."""
    return tokenizer(
        examples["text"],
        padding="max_length",
        truncation=True,
        max_length=MAX_LENGTH,
    )


def tokenize_dataset(dataset: DatasetDict, tokenizer) -> DatasetDict:
    """Apply tokenization to every split in the DatasetDict."""
    return dataset.map(
        lambda ex: tokenize_function(ex, tokenizer),
        batched=True,
        desc="Tokenizing",
    )


def build_model() -> DistilBertForSequenceClassification:
    """Instantiate DistilBertForSequenceClassification with 27 labels."""
    model = DistilBertForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_LABELS,
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )
    return model


def compute_metrics(eval_pred) -> dict[str, float]:
    """Compute macro F1, weighted F1, and accuracy for Trainer."""
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {
        "macro_f1": f1_score(labels, preds, average="macro", zero_division=0),
        "weighted_f1": f1_score(labels, preds, average="weighted", zero_division=0),
        "accuracy": accuracy_score(labels, preds),
    }

class WeightedTrainer(Trainer):
    """Trainer subclass that applies per-class weights to CrossEntropyLoss."""

    def __init__(self, class_weights: np.ndarray | None = None, **kwargs: Any):
        """Initialise with optional class_weights array."""
        super().__init__(**kwargs)
        if class_weights is not None:
            self._class_weights = torch.tensor(
                class_weights, dtype=torch.float32
            )
        else:
            self._class_weights = None

    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        """Forward pass with class-weighted CrossEntropyLoss."""
        labels = inputs.pop("labels")
        outputs = model(**inputs)
        logits = outputs.logits

        if self._class_weights is not None:
            weight = self._class_weights.to(logits.device)
        else:
            weight = None

        loss_fn = torch.nn.CrossEntropyLoss(weight=weight)
        loss = loss_fn(logits, labels)
        return (loss, outputs) if return_outputs else loss



def get_training_args(
    epochs: int = 4,
    train_batch_size: int = 32,
    eval_batch_size: int = 64,
    seed: int = 42,
    output_dir: Path | None = None,
) -> TrainingArguments:
    """Build TrainingArguments with project defaults."""
    output_dir = output_dir or OUTPUT_DIR
    total_steps_approx = 58_000 // train_batch_size * epochs  # rough estimate
    warmup_steps = int(total_steps_approx * 0.10)

    return TrainingArguments(
        output_dir=str(output_dir),
        num_train_epochs=epochs,
        per_device_train_batch_size=train_batch_size,
        per_device_eval_batch_size=eval_batch_size,
        learning_rate=2e-5,
        weight_decay=0.01,
        warmup_steps=warmup_steps,
        lr_scheduler_type="linear",
        fp16=True,
        eval_strategy="epoch",
        save_strategy="epoch",
        logging_strategy="steps",
        logging_steps=100,
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="macro_f1",
        greater_is_better=True,
        seed=seed,
        report_to="none",
    )


def train_model(
    dataset: DatasetDict,
    epochs: int = 4,
    batch_size: int = 32,
    seed: int = 42,
) -> Trainer:
    """Tokenize, build model, train with early stopping, and save best checkpoint."""

    tokenizer = get_tokenizer()
    tok_dataset = tokenize_dataset(dataset, tokenizer)
    tok_dataset.set_format("torch", columns=["input_ids", "attention_mask", "label"])

    model = build_model()
    class_weights = compute_class_weights(dataset, split="train")
    training_args = get_training_args(
        epochs=epochs,
        train_batch_size=batch_size,
        seed=seed,
    )

    trainer = WeightedTrainer(
        class_weights=class_weights,
        model=model,
        args=training_args,
        train_dataset=tok_dataset["train"],
        eval_dataset=tok_dataset["validation"],
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    print(f"\n[model] Starting DistilBERT fine-tuning for {epochs} epochs …")
    trainer.train()

    # Save best model + tokenizer
    BEST_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(BEST_MODEL_DIR))
    tokenizer.save_pretrained(str(BEST_MODEL_DIR))
    print(f"[model] Best model saved → {BEST_MODEL_DIR}")

    return trainer


if __name__ == "__main__":
    from data.load_data import main as load_data_main

    dataset = load_data_main()
    train_model(dataset)
