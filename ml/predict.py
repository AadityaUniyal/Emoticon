"""
predict.py — CLI script for single-text emotion inference.
Usage:  python predict.py --text "I am so happy today!"
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import torch
from transformers import AutoTokenizer, DistilBertForSequenceClassification

# Resolve project root
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from data.load_data import ID2LABEL

BEST_MODEL_DIR = PROJECT_ROOT / "outputs" / "best_model"
MAX_LENGTH = 128


def predict_emotion(text: str) -> dict:
    """Predict the emotion label for a given text string."""
    if not BEST_MODEL_DIR.exists():
        print(f"[error] Model not found at {BEST_MODEL_DIR}")
        print("[error] Run  python train.py  first to fine-tune the model.")
        sys.exit(1)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    tokenizer = AutoTokenizer.from_pretrained(str(BEST_MODEL_DIR))
    model = DistilBertForSequenceClassification.from_pretrained(str(BEST_MODEL_DIR))
    model.to(device)
    model.eval()

    inputs = tokenizer(
        text,
        return_tensors="pt",
        padding="max_length",
        truncation=True,
        max_length=MAX_LENGTH,
    ).to(device)

    t0 = time.perf_counter()
    with torch.no_grad():
        outputs = model(**inputs)
    latency_ms = (time.perf_counter() - t0) * 1000

    logits = outputs.logits[0]
    probs = torch.softmax(logits, dim=-1).cpu().numpy()

    top3_indices = probs.argsort()[-3:][::-1]
    top3 = [(ID2LABEL[int(i)], float(probs[i])) for i in top3_indices]

    return {
        "text": text,
        "emotion": top3[0][0],
        "confidence": round(top3[0][1], 4),
        "top3": [{"emotion": e, "confidence": round(c, 4)} for e, c in top3],
        "latency_ms": round(latency_ms, 2),
    }


def main() -> None:
    """Parse CLI args and run single-text prediction."""
    parser = argparse.ArgumentParser(description="EmoSense — single-text prediction")
    parser.add_argument(
        "--text",
        type=str,
        required=True,
        help="Input text to classify",
    )
    args = parser.parse_args()

    result = predict_emotion(args.text)

    print(f"\n{'=' * 50}")
    print(f"  Input:      {result['text']}")
    print(f"  Emotion:    {result['emotion']}")
    print(f"  Confidence: {result['confidence']:.4f}")
    print(f"  Latency:    {result['latency_ms']:.2f} ms")
    print(f"{'=' * 50}")
    print(f"  Top-3 predictions:")
    for i, entry in enumerate(result["top3"], 1):
        print(f"    {i}. {entry['emotion']:<16} {entry['confidence']:.4f}")
    print(f"{'=' * 50}\n")


if __name__ == "__main__":
    main()
