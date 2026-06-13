# Model Card — EmoSense Emotion Classifier

## Model Details

| Field | Value |
|-------|-------|
| **Model Name** | EmoSense v1.0 |
| **Architecture** | DistilBERT-base-uncased (66M parameters) |
| **Task** | Multi-class text emotion classification (27 classes) |
| **Language** | English |
| **Framework** | PyTorch + HuggingFace Transformers |
| **License** | Apache 2.0 |
| **Fine-tuned from** | `distilbert-base-uncased` |

## Intended Use

EmoSense classifies English text into one of 27 emotion categories from the GoEmotions taxonomy.

### Primary use cases
- Sentiment / emotion monitoring in user feedback
- Conversational AI emotion-awareness
- Social media emotion analysis research

### Out-of-scope uses
- Clinical mental health diagnosis
- Non-English text classification
- Real-time safety-critical systems

## Training Data

| Property | Value |
|----------|-------|
| **Dataset** | [GoEmotions](https://huggingface.co/datasets/google-research-datasets/goemotions) (simplified) |
| **Source** | Reddit comments curated by Google Research |
| **Train / Val / Test** | ~43k / ~5.4k / ~5.4k examples |
| **Label scheme** | Multi-label collapsed to single dominant label |
| **Classes** | 27 emotion labels (see below) |

### Emotion Labels

admiration · amusement · anger · annoyance · approval · caring · confusion ·
curiosity · desire · disapproval · disgust · embarrassment · excitement ·
fear · gratitude · grief · joy · love · nervousness · optimism · pride ·
realization · relief · remorse · sadness · surprise · neutral

## Training Procedure

| Hyperparameter | Value |
|---------------|-------|
| Optimizer | AdamW |
| Learning rate | 2e-5 |
| Weight decay | 0.01 |
| LR scheduler | Linear with 10% warmup |
| Epochs | 4 (with early stopping, patience=2) |
| Train batch size | 32 |
| Eval batch size | 64 |
| Max sequence length | 128 tokens |
| Mixed precision | fp16 |
| Loss function | CrossEntropyLoss with inverse-frequency class weights |
| Seed | 42 |

## Evaluation Results

### Aggregate Metrics

| Metric | TF-IDF + LogReg (baseline) | DistilBERT (fine-tuned) |
|--------|---------------------------|------------------------|
| Macro F1 | [FILL] | [FILL] |
| Weighted F1 | [FILL] | [FILL] |
| Accuracy | [FILL] | [FILL] |

### Per-Class F1 (DistilBERT)

| Emotion | F1 Score |
|---------|----------|
| admiration | [FILL] |
| amusement | [FILL] |
| anger | [FILL] |
| annoyance | [FILL] |
| approval | [FILL] |
| caring | [FILL] |
| confusion | [FILL] |
| curiosity | [FILL] |
| desire | [FILL] |
| disapproval | [FILL] |
| disgust | [FILL] |
| embarrassment | [FILL] |
| excitement | [FILL] |
| fear | [FILL] |
| gratitude | [FILL] |
| grief | [FILL] |
| joy | [FILL] |
| love | [FILL] |
| nervousness | [FILL] |
| optimism | [FILL] |
| pride | [FILL] |
| realization | [FILL] |
| relief | [FILL] |
| remorse | [FILL] |
| sadness | [FILL] |
| surprise | [FILL] |
| neutral | [FILL] |

## Limitations & Biases

- **Data bias**: GoEmotions is sourced from Reddit, which skews toward younger, English-speaking, US-centric demographics.
- **Label noise**: Multi-label to single-label conversion loses information; some examples may have ambiguous dominant emotions.
- **Class imbalance**: Rare emotions (grief, pride, relief) have very few training examples and correspondingly lower F1 scores.
- **Domain transfer**: Performance may degrade on formal, technical, or non-conversational text.
- **Cultural context**: Emotion expression varies across cultures; the model reflects predominantly Western norms.

## Ethical Considerations

- This model should **not** be used for mental health diagnosis or clinical assessment.
- Predictions on sensitive topics (grief, fear, anger) should be treated with caution.
- Users should be informed when their text is being analysed for emotional content.
- The model may perpetuate biases present in the Reddit training data.

## Citation

```bibtex
@inproceedings{demszky2020goemotions,
  title={GoEmotions: A Dataset of Fine-Grained Emotions},
  author={Demszky, Dorottya and Movshovitz-Attias, Dana and Ko, Jeongwoo
          and Cowen, Alan and Nemade, Gaurav and Ravi, Sujith},
  booktitle={ACL},
  year={2020}
}
```
