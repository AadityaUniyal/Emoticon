/* ───────────────────────────────────────────
   EMOSENSE NLP CLASSIFIERS LIBRARY
   ─────────────────────────────────────────── */

export const EMOJI_MAP = {
  admiration: '🤩', amusement: '😄', anger: '😠', annoyance: '😤',
  approval: '👍', caring: '🤗', confusion: '😕', curiosity: '🤔',
  desire: '😍', disapproval: '👎', disgust: '🤢', embarrassment: '😳',
  excitement: '🎉', fear: '😨', gratitude: '🙏', grief: '😢',
  joy: '😊', love: '❤️', nervousness: '😰', optimism: '🌟',
  pride: '💪', realization: '💡', relief: '😌', remorse: '😔',
  sadness: '😞', surprise: '😲', neutral: '😐',
};

const EMOTION_KEYWORDS = {
  admiration: ['amazing', 'incredible', 'impressive', 'wonderful', 'respect', 'brilliant', 'genius'],
  amusement: ['funny', 'hilarious', 'lol', 'haha', 'joke', 'laugh', 'humor'],
  anger: ['angry', 'furious', 'rage', 'mad', 'hate', 'pissed', 'livid'],
  annoyance: ['annoying', 'irritating', 'frustrating', 'ugh', 'pest', 'tedious'],
  approval: ['agree', 'correct', 'right', 'yes', 'exactly', 'approved', 'endorse'],
  caring: ['care', 'caring', 'hope you', 'feel better', 'take care', 'concerned'],
  confusion: ['confused', 'what', 'huh', 'dont understand', 'unclear', 'lost'],
  curiosity: ['curious', 'wonder', 'how does', 'why does', 'interesting', 'question'],
  desire: ['want', 'wish', 'desire', 'crave', 'need', 'longing'],
  disapproval: ['disagree', 'wrong', 'bad', 'no', 'disapprove', 'reject'],
  disgust: ['disgusting', 'gross', 'eww', 'nasty', 'vile', 'yuck'],
  embarrassment: ['embarrassed', 'awkward', 'cringe', 'ashamed', 'humiliated'],
  excitement: ['excited', 'thrilled', 'cant wait', 'pumped', 'hyped', 'yay'],
  fear: ['scared', 'afraid', 'terrified', 'fear', 'panic', 'dread'],
  gratitude: ['thank', 'thanks', 'grateful', 'appreciate', 'thankful'],
  grief: ['grief', 'grieve', 'mourning', 'loss', 'devastated', 'died'],
  joy: ['happy', 'joy', 'delighted', 'glad', 'wonderful', 'content'],
  love: ['love', 'adore', 'cherish', 'heart', 'romantic', 'affection'],
  nervousness: ['nervous', 'anxious', 'worried', 'uneasy', 'tense', 'stressed'],
  optimism: ['optimistic', 'hopeful', 'positive', 'bright', 'upbeat'],
  pride: ['proud', 'pride', 'accomplished', 'achievement', 'succeeded'],
  realization: ['realize', 'realized', 'oh', 'now I see', 'dawned on me'],
  relief: ['relieved', 'relief', 'phew', 'thank god', 'finally'],
  remorse: ['sorry', 'regret', 'apologize', 'my fault', 'guilty'],
  sadness: ['sad', 'unhappy', 'depressed', 'crying', 'sorrow', 'lonely'],
  surprise: ['surprised', 'shocking', 'unexpected', 'wow', 'omg', 'unbelievable'],
  neutral: ['okay', 'ok', 'fine', 'alright', 'sure', 'noted', 'meh'],
};

export function classifyEmotion(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const emotion of Object.keys(EMOTION_KEYWORDS)) {
    scores[emotion] = 0.01 + Math.random() * 0.02;
  }
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[emotion] += 0.2 + Math.random() * 0.15;
    }
  }
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore < 0.1) scores.neutral += 0.6;
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  for (const emotion of Object.keys(scores)) scores[emotion] /= total;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const top3 = sorted.slice(0, 3).map(([label, score]) => ({
    label,
    score: Math.round(score * 1000) / 1000,
    emoji: EMOJI_MAP[label] || '❓',
  }));

  return {
    dominant: top[0],
    confidence: Math.round(top[1] * 1000) / 1000,
    metadata: { top3 }
  };
}

const SENTIMENT_KEYWORDS = {
  positive: ['love', 'like', 'great', 'awesome', 'good', 'happy', 'wonderful', 'amazing', 'excellent', 'agree', 'yes', 'thank'],
  negative: ['hate', 'dislike', 'terrible', 'bad', 'sad', 'wrong', 'furious', 'annoy', 'gross', 'sorry', 'disagree', 'no'],
};

export function classifySentiment(text) {
  const lower = text.toLowerCase();
  let pos = 0.01 + Math.random() * 0.02;
  let neg = 0.01 + Math.random() * 0.02;
  let neu = 0.1 + Math.random() * 0.05;

  for (const kw of SENTIMENT_KEYWORDS.positive) {
    if (lower.includes(kw)) pos += 0.25;
  }
  for (const kw of SENTIMENT_KEYWORDS.negative) {
    if (lower.includes(kw)) neg += 0.25;
  }

  const total = pos + neg + neu;
  pos /= total;
  neg /= total;
  neu /= total;

  let dominant = 'neutral';
  let confidence = neu;
  if (pos > neg && pos > neu) {
    dominant = 'positive';
    confidence = pos;
  } else if (neg > pos && neg > neu) {
    dominant = 'negative';
    confidence = neg;
  }

  return {
    dominant,
    confidence: Math.round(confidence * 1000) / 1000,
    metadata: {
      positive: Math.round(pos * 1000) / 1000,
      negative: Math.round(neg * 1000) / 1000,
      neutral: Math.round(neu * 1000) / 1000,
    }
  };
}

const TOXICITY_KEYWORDS = {
  toxic: ['stupid', 'idiot', 'jerk', 'hate', 'kill', 'suck', 'dumb', 'loser', 'trash', 'ass', 'bastard', 'fuck'],
  threat: ['kill you', 'murder', 'punch', 'beat you', 'die', 'hurt you'],
  insult: ['stupid', 'idiot', 'jerk', 'dumb', 'loser', 'clown'],
};

export function classifyToxicity(text) {
  const lower = text.toLowerCase();
  let toxicScore = 0.02 + Math.random() * 0.03;
  let threatScore = 0.01 + Math.random() * 0.02;
  let insultScore = 0.01 + Math.random() * 0.02;

  for (const kw of TOXICITY_KEYWORDS.toxic) {
    if (lower.includes(kw)) toxicScore += 0.3;
  }
  for (const kw of TOXICITY_KEYWORDS.threat) {
    if (lower.includes(kw)) threatScore += 0.45;
  }
  for (const kw of TOXICITY_KEYWORDS.insult) {
    if (lower.includes(kw)) insultScore += 0.35;
  }

  toxicScore = Math.min(toxicScore, 0.99);
  threatScore = Math.min(threatScore, 0.99);
  insultScore = Math.min(insultScore, 0.99);

  const dominant = toxicScore > 0.35 ? 'toxic' : 'clean';
  const confidence = dominant === 'toxic' ? toxicScore : (1 - toxicScore);

  return {
    dominant,
    confidence: Math.round(confidence * 1000) / 1000,
    metadata: {
      toxic: Math.round(toxicScore * 1000) / 1000,
      insult: Math.round(insultScore * 1000) / 1000,
      threat: Math.round(threatScore * 1000) / 1000,
    }
  };
}

export function classifySummarization(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  if (sentences.length <= 2) {
    return {
      dominant: 'summary_complete',
      confidence: 1.0,
      metadata: {
        summary: text,
        original_length: text.length,
        summary_length: text.length,
        ratio: 1.0,
      }
    };
  }

  const scored = sentences.map((s, i) => {
    let score = 100 - Math.abs(15 - s.split(' ').length);
    if (i === 0) score += 30;
    if (i === sentences.length - 1) score += 20;
    return { sentence: s.trim(), score };
  });

  const selected = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(item => item.sentence)
    .join(' ');

  const ratio = Math.round((selected.length / text.length) * 1000) / 1000;

  return {
    dominant: 'summary_complete',
    confidence: Math.round((1 - ratio) * 1000) / 1000,
    metadata: {
      summary: selected,
      original_length: text.length,
      summary_length: selected.length,
      ratio,
    }
  };
}

const ENTITY_DICTIONARY = [
  { text: 'Google', type: 'ORG' },
  { text: 'Amazon', type: 'ORG' },
  { text: 'Microsoft', type: 'ORG' },
  { text: 'DeepMind', type: 'ORG' },
  { text: 'Aaditya', type: 'PER' },
  { text: 'Aaditya Uniyal', type: 'PER' },
  { text: 'Uniyal', type: 'PER' },
  { text: 'London', type: 'LOC' },
  { text: 'New York', type: 'LOC' },
  { text: 'Seattle', type: 'LOC' },
  { text: 'Monday', type: 'DATE' },
  { text: 'Friday', type: 'DATE' },
  { text: 'June', type: 'DATE' },
  { text: '2026', type: 'DATE' },
];

export function classifyNER(text) {
  const entities = [];
  
  for (const item of ENTITY_DICTIONARY) {
    const regex = new RegExp(`\\b${item.text}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        text: item.text,
        type: item.type,
        index: match.index,
      });
    }
  }

  const words = text.split(/\s+/);
  words.forEach((word, idx) => {
    if (idx > 0 && /^[A-Z][a-z]+/.test(word)) {
      const clean = word.replace(/[^a-zA-Z]/g, '');
      const alreadyFound = entities.some(e => e.text.toLowerCase() === clean.toLowerCase());
      if (!alreadyFound && clean.length > 2) {
        entities.push({
          text: clean,
          type: 'MISC',
          index: text.indexOf(clean),
        });
      }
    }
  });

  const unique = Array.from(new Set(entities.map(JSON.stringify))).map(JSON.parse);

  return {
    dominant: `${unique.length} entities detected`,
    confidence: unique.length > 0 ? 0.95 : 1.0,
    metadata: {
      entities: unique
    }
  };
}

export function redactPII(text) {
  if (!text || typeof text !== 'string') return text;
  
  let redacted = text;
  
  // 1. Email Redaction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  redacted = redacted.replace(emailRegex, '[REDACTED_EMAIL]');
  
  // 2. Phone Redaction (matches standard phone numbers, plus signs, hyphens, and 7 or 10 digit formats like +1-555-0199)
  const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|(?:\+?\d{1,4}[-.\s]?)?\b\d{3}[-.\s]?\d{4}\b/g;
  redacted = redacted.replace(phoneRegex, '[REDACTED_PHONE]');
  
  // 3. Credit Card Redaction (13 to 19 digit numbers, possibly separated by spaces/hyphens)
  const cardRegex = /\b(?:\d[ -]*?){13,19}\b/g;
  redacted = redacted.replace(cardRegex, (match) => {
    const digits = match.replace(/[\s-]/g, '');
    if (/^\d{13,19}$/.test(digits)) {
      return '[REDACTED_CARD]';
    }
    return match;
  });
  
  return redacted;
}

export function classifyAspectEmotion(text) {
  const lower = text.toLowerCase();
  const aspects = [
    { key: 'database', label: 'DATABASE_SYSTEM' },
    { key: 'db', label: 'DATABASE_SYSTEM' },
    { key: 'neon', label: 'DATABASE_SYSTEM' },
    { key: 'model', label: 'ML_PIPELINE' },
    { key: 'pipeline', label: 'ML_PIPELINE' },
    { key: 'distilbert', label: 'ML_PIPELINE' },
    { key: 'ui', label: 'USER_INTERFACE' },
    { key: 'dashboard', label: 'USER_INTERFACE' },
    { key: 'api', label: 'API_GATEWAY' },
    { key: 'key', label: 'API_GATEWAY' },
    { key: 'latency', label: 'PERFORMANCE' },
    { key: 'speed', label: 'PERFORMANCE' },
    { key: 'rate limit', label: 'SECURITY' },
    { key: 'auth', label: 'SECURITY' }
  ];
  
  const detected = [];
  const globalEmotion = classifyEmotion(text);
  
  for (const aspect of aspects) {
    if (lower.includes(aspect.key)) {
      const index = lower.indexOf(aspect.key);
      const start = Math.max(0, index - 40);
      const end = Math.min(text.length, index + aspect.key.length + 40);
      const contextText = text.substring(start, end);
      const localEmotion = classifyEmotion(contextText);
      
      detected.push({
        aspect: aspect.label,
        emotion: localEmotion.dominant,
        confidence: Math.round(localEmotion.confidence * 1000) / 1000,
        snippet: `…${text.substring(Math.max(0, index - 20), Math.min(text.length, index + aspect.key.length + 20))}…`
      });
    }
  }
  
  if (detected.length === 0) {
    detected.push({
      aspect: 'GENERAL_CONTEXT',
      emotion: globalEmotion.dominant,
      confidence: globalEmotion.confidence,
      snippet: text.length > 40 ? `…${text.slice(0, 40)}…` : text
    });
  }
  
  return {
    dominant: `${detected.length} aspects mapped`,
    confidence: Math.round(detected[0].confidence * 1000) / 1000,
    metadata: {
      aspects: detected
    }
  };
}

const STOP_WORDS = new Set([
  'the', 'is', 'and', 'to', 'a', 'of', 'in', 'i', 'you', 'we', 'my', 'our', 'your', 'it', 'that', 'this',
  'with', 'on', 'for', 'at', 'by', 'an', 'be', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do',
  'does', 'did', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'about', 'more', 'some', 'any'
]);

export function classifyKeyphrase(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  
  const scored = Object.entries(freq).map(([word, count]) => {
    const score = count * (1 + 0.1 * word.length);
    return { word, score };
  });
  
  const sorted = scored.sort((a, b) => b.score - a.score).slice(0, 5);
  const total = sorted.reduce((sum, item) => sum + item.score, 0) || 1;
  
  const keyphrases = sorted.map(item => ({
    phrase: item.word,
    score: Math.round((item.score / total) * 1000) / 1000
  }));
  
  return {
    dominant: keyphrases.length > 0 ? keyphrases[0].phrase : 'none',
    confidence: keyphrases.length > 0 ? keyphrases[0].score : 0.0,
    metadata: {
      keyphrases
    }
  };
}

const BIAS_RULES = [
  {
    id: 'catastrophizing',
    label: 'CATASTROPHIZING',
    desc: 'Assuming the worst possible outcome will occur, even with minimal evidence.',
    keywords: ['ruined', 'worst', 'failure', 'destroyed', 'horrible', 'disaster', 'end of the world', 'apocalypse', 'doomed']
  },
  {
    id: 'polarization',
    label: 'BLACK_AND_WHITE_THINKING',
    desc: 'Thinking in extremes (all-or-nothing). No middle ground or nuances.',
    keywords: ['completely', 'absolutely', 'perfect', 'worthless', 'entirely', 'impossible', 'nothing', 'everything', 'useless']
  },
  {
    id: 'overgeneralization',
    label: 'OVERGENERALIZATION',
    desc: 'Drawing a broad, negative conclusion based on a single isolated incident.',
    keywords: ['always', 'never', 'everyone', 'nobody', 'every time', 'fails every', 'always fails']
  },
  {
    id: 'emotional_reasoning',
    label: 'EMOTIONAL_REASONING',
    desc: 'Believing that because you feel a certain way, it must reflect objective reality.',
    keywords: ['feel like', 'feel that', 'makes me feel', 'feeling tells me', 'gut tells me']
  },
  {
    id: 'personalization',
    label: 'PERSONALIZATION',
    desc: 'Taking things personally or assuming self-blame for events outside your control.',
    keywords: ['my fault', 'blame me', 'because of me', 'its me', 'did it to me', 'targeting me']
  }
];

export function classifyCognitiveBias(text) {
  const lower = text.toLowerCase();
  const detected = [];
  
  for (const rule of BIAS_RULES) {
    const matchedKeywords = [];
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        matchedKeywords.push(kw);
      }
    }
    
    if (matchedKeywords.length > 0) {
      const firstKw = matchedKeywords[0];
      const index = lower.indexOf(firstKw);
      const start = Math.max(0, index - 25);
      const end = Math.min(text.length, index + firstKw.length + 25);
      const snippet = `…${text.substring(start, end)}…`;
      
      detected.push({
        bias: rule.label,
        description: rule.desc,
        matches: matchedKeywords,
        snippet,
        severity: Math.min(0.3 + matchedKeywords.length * 0.2, 0.95)
      });
    }
  }
  
  const hasBias = detected.length > 0;
  const dominant = hasBias ? `${detected.length} distortions detected` : 'clean';
  const confidence = hasBias ? Math.max(...detected.map(d => d.severity)) : 1.0;
  
  return {
    dominant,
    confidence: Math.round(confidence * 100) / 100,
    metadata: {
      biases: detected
    }
  };
}
