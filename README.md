<div align="center">

# 🧠 EmoSense

**Emotion-Aware Sentiment Classifier — Powered by DistilBERT & GoEmotions**

[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-ee4c2c?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)

</div>

---

## 📋 Overview

EmoSense classifies text into **27 fine-grained emotions** using Google's [GoEmotions](https://github.com/google-research/google-research/tree/master/goemotions) dataset. It goes beyond basic positive/negative sentiment analysis to detect nuanced emotions like *admiration*, *curiosity*, *gratitude*, *fear*, *nervousness*, and more.

**Key Highlights:**
- 🔬 Fine-tuned **DistilBERT** model (66M params) achieving >20% macro F1 improvement over TF-IDF baseline
- 🌐 Beautiful **Weav-inspired** web interface built with Next.js
- 🔐 Secure authentication via **Clerk**
- 🗄️ Prediction history stored in **Neon PostgreSQL**
- 📊 Interactive dashboard with analytics and emotion breakdown
- ⚡ FastAPI serving with <200ms inference latency

---

## 🏗️ Project Structure

```
emosense/
├── .gitignore
├── README.md
├── ml/                          # Machine Learning pipeline
│   ├── data/load_data.py        # GoEmotions dataset loader
│   ├── baseline/tfidf_logreg.py # TF-IDF + Logistic Regression baseline
│   ├── models/distilbert_clf.py # DistilBERT fine-tuning pipeline
│   ├── evaluate/metrics.py      # Evaluation, plots, confusion matrix
│   ├── serve/api.py             # FastAPI inference endpoint
│   ├── train.py                 # Main training orchestrator
│   ├── predict.py               # CLI prediction script
│   ├── model_card.md            # Model card documentation
│   └── requirements.txt         # Python dependencies
└── web/                         # Next.js web application
    ├── app/                     # App router pages & API routes
    ├── components/              # Reusable UI components
    └── lib/                     # Database & utility helpers
```

---

## 🚀 Quick Start

### ML Pipeline

```bash
cd ml
pip install -r requirements.txt

# Train baseline + DistilBERT
python train.py --epochs 4 --batch_size 32 --seed 42

# Run inference
python predict.py --text "I am so excited about this project!"

# Start API server
uvicorn serve.api:app --host 0.0.0.0 --port 8000
```

### Web Application

```bash
cd web
npm install

# Create .env.local from the example
cp .env.local.example .env.local
# Fill in your Clerk and database credentials

npm run dev
```

---

## 📊 Results

| Model | Macro F1 | Weighted F1 | Accuracy |
|-------|----------|-------------|----------|
| TF-IDF + Logistic Regression | [FILL] | [FILL] | [FILL] |
| DistilBERT (fine-tuned) | [FILL] | [FILL] | [FILL] |
| **Improvement** | **[FILL]%** | — | — |

---

## 🏷️ Emotion Labels (27 classes)

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

---

## 🛡️ License

This project is for educational and portfolio purposes. The GoEmotions dataset is licensed under Apache 2.0.

---

<div align="center">
  <sub>Built by <strong>Aaditya Uniyal</strong> · Amazon ML School Resume Project</sub>
</div>
