"""
api.py — FastAPI serving layer for EmoSense emotion classification.
Endpoints:
  POST /predict  — classify a text string, returns emotion + confidence + top-3
  GET  /health   — liveness / readiness probe
"""

from __future__ import annotations

import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, DistilBertForSequenceClassification

# Resolve project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data.load_data import ID2LABEL

BEST_MODEL_DIR = PROJECT_ROOT / "outputs" / "best_model"
MAX_LENGTH = 128


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    """Input schema for the /predict endpoint."""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to classify")


class EmotionScore(BaseModel):
    """Single emotion with its confidence score."""
    emotion: str
    confidence: float


class PredictResponse(BaseModel):
    """Output schema for the /predict endpoint."""
    emotion: str = Field(..., description="Top predicted emotion label")
    confidence: float = Field(..., description="Confidence of the top prediction")
    top3: list[EmotionScore] = Field(..., description="Top-3 predictions with scores")
    latency_ms: float = Field(..., description="Inference latency in milliseconds")


class HealthResponse(BaseModel):
    """Output schema for the /health endpoint."""
    status: str
    model_loaded: bool


# ---------------------------------------------------------------------------
# App state
# ---------------------------------------------------------------------------

_state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model and tokenizer on startup; clean up on shutdown."""
    if not BEST_MODEL_DIR.exists():
        raise RuntimeError(
            f"Best model directory not found at {BEST_MODEL_DIR}. "
            "Run train.py first to fine-tune the model."
        )
    print(f"[api] Loading model from {BEST_MODEL_DIR} …")
    _state["tokenizer"] = AutoTokenizer.from_pretrained(str(BEST_MODEL_DIR))
    _state["model"] = DistilBertForSequenceClassification.from_pretrained(
        str(BEST_MODEL_DIR)
    )
    _state["model"].eval()
    _state["device"] = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    _state["model"].to(_state["device"])
    print(f"[api] Model loaded on {_state['device']}")
    yield
    _state.clear()


app = FastAPI(
    title="EmoSense — Emotion Classifier API",
    description="Classify text into 27 GoEmotions categories using DistilBERT.",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest) -> PredictResponse:
    """Classify input text and return the predicted emotion with confidence."""
    if "model" not in _state:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    t0 = time.perf_counter()

    tokenizer = _state["tokenizer"]
    model = _state["model"]
    device = _state["device"]

    inputs = tokenizer(
        request.text,
        return_tensors="pt",
        padding="max_length",
        truncation=True,
        max_length=MAX_LENGTH,
    ).to(device)

    with torch.no_grad():
        outputs = model(**inputs)
    logits = outputs.logits[0]
    probs = torch.softmax(logits, dim=-1).cpu().numpy()

    top3_indices = probs.argsort()[-3:][::-1]
    top3 = [
        EmotionScore(
            emotion=ID2LABEL[int(idx)],
            confidence=round(float(probs[idx]), 4),
        )
        for idx in top3_indices
    ]

    latency_ms = (time.perf_counter() - t0) * 1000

    return PredictResponse(
        emotion=top3[0].emotion,
        confidence=top3[0].confidence,
        top3=top3,
        latency_ms=round(latency_ms, 2),
    )


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Return service health status."""
    return HealthResponse(
        status="ok",
        model_loaded="model" in _state,
    )


# ---------------------------------------------------------------------------
# CLI runner
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "serve.api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1,
    )
