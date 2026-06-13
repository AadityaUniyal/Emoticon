# EmoSense — ML Pipeline

Emotion-aware text classifier built on Google's **GoEmotions** dataset (27 emotion labels) using a fine-tuned **DistilBERT** model.

## Project Structure

```
ml/
├── requirements.txt          # Pinned Python dependencies
├── train.py                  # CLI training orchestrator
├── predict.py                # Single-text inference CLI
├── model_card.md             # Model card with evaluation placeholders
├── README.md                 # This file
│
├── data/
│   ├── load_data.py          # GoEmotions download & preprocessing
│   ├── label2id.json         # (generated) label → integer mapping
│   └── id2label.json         # (generated) integer → label mapping
│
├── baseline/
│   └── tfidf_logreg.py       # TF-IDF + Logistic Regression baseline
│
├── models/
│   └── distilbert_clf.py     # DistilBERT fine-tuning module
│
├── evaluate/
│   └── metrics.py            # Test evaluation, plots, comparison table
│
├── serve/
│   └── api.py                # FastAPI REST API for inference
│
├── outputs/                  # (generated) checkpoints & best model
│   └── best_model/
│
└── results/                  # (generated) metrics, plots, comparisons
    ├── baseline_metrics.json
    ├── distilbert_metrics.json
    ├── confusion_matrix.png
    ├── training_curves.png
    └── comparison.md
```

## Quick Start

### 1. Install Dependencies

```bash
cd ml/
pip install -r requirements.txt
```

> **Note:** A CUDA-capable GPU is strongly recommended. CPU training is possible but very slow.

### 2. Train the Full Pipeline

```bash
python train.py
```

This runs all four stages:
1. **Data loading** — downloads GoEmotions from HuggingFace, converts to single-label
2. **Baseline** — trains TF-IDF + Logistic Regression
3. **DistilBERT** — fine-tunes with class-weighted loss, early stopping
4. **Evaluation** — generates metrics, confusion matrix, training curves, comparison table

### 3. CLI Options

```bash
python train.py --epochs 4 --batch_size 32 --seed 42        # defaults
python train.py --epochs 2 --batch_size 16                   # smaller run
python train.py --no-baseline                                # skip baseline
```

| Argument | Default | Description |
|----------|---------|-------------|
| `--epochs` | 4 | Number of training epochs |
| `--batch_size` | 32 | Training batch size |
| `--seed` | 42 | Random seed for reproducibility |
| `--no-baseline` | false | Skip TF-IDF + LogReg baseline |

### 4. Single-Text Prediction

```bash
python predict.py --text "I am so grateful for your help!"
```

Output:
```
  Input:      I am so grateful for your help!
  Emotion:    gratitude
  Confidence: 0.9732
  Latency:    12.45 ms
  Top-3 predictions:
    1. gratitude        0.9732
    2. admiration       0.0134
    3. approval         0.0051
```

## Serving (FastAPI)

### Start the server

```bash
cd ml/
python -m serve.api
# or
uvicorn serve.api:app --host 0.0.0.0 --port 8000
```

### Endpoints

#### `POST /predict`

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "This is amazing!"}'
```

Response:
```json
{
  "emotion": "admiration",
  "confidence": 0.8542,
  "top3": [
    {"emotion": "admiration", "confidence": 0.8542},
    {"emotion": "excitement", "confidence": 0.0623},
    {"emotion": "approval", "confidence": 0.0311}
  ],
  "latency_ms": 15.23
}
```

#### `GET /health`

```bash
curl http://localhost:8000/health
```

Response:
```json
{"status": "ok", "model_loaded": true}
```

### Interactive docs

Open **http://localhost:8000/docs** for the Swagger UI.

## Training Details

| Hyperparameter | Value |
|---------------|-------|
| Base model | `distilbert-base-uncased` (66M params) |
| Dataset | GoEmotions (simplified, 27 labels) |
| Optimizer | AdamW (lr=2e-5, weight_decay=0.01) |
| Scheduler | Linear warmup (10% of total steps) |
| Loss | CrossEntropyLoss with inverse-frequency class weights |
| Epochs | 4 (early stopping, patience=2) |
| Batch size | 32 (train) / 64 (eval) |
| Max tokens | 128 |
| Precision | fp16 mixed precision |
| Seed | 42 |

## Evaluation

After training, check the `results/` directory for:

- **`baseline_metrics.json`** — TF-IDF + LogReg performance
- **`distilbert_metrics.json`** — DistilBERT performance
- **`confusion_matrix.png`** — normalised 27×27 heatmap
- **`training_curves.png`** — loss and macro-F1 over training
- **`comparison.md`** — side-by-side markdown table

## Emotion Labels (27)

| ID | Emotion | ID | Emotion | ID | Emotion |
|----|---------|----|---------|----|---------|
| 0 | admiration | 9 | disapproval | 18 | nervousness |
| 1 | amusement | 10 | disgust | 19 | optimism |
| 2 | anger | 11 | embarrassment | 20 | pride |
| 3 | annoyance | 12 | excitement | 21 | realization |
| 4 | approval | 13 | fear | 22 | relief |
| 5 | caring | 14 | gratitude | 23 | remorse |
| 6 | confusion | 15 | grief | 24 | sadness |
| 7 | curiosity | 16 | joy | 25 | surprise |
| 8 | desire | 17 | love | 26 | neutral |

## License

Apache 2.0
