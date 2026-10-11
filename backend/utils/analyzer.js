const { calculateEntropy, detectPools, entropyLabel } = require('./entropy');
const { estimateCrackTimes } = require('./crackTime');
const {
  hasCommonPattern,
  inDictionary,
  hasRepetitiveChars,
} = require('./patterns');

function ratingFor(pass, weight = 1) {
  return pass ? { status: 'Excellent', pct: 100 * weight } : { status: 'Weak', pct: 20 * weight };
}

function analyzePassword(password) {
  password = password || '';
  const length = password.length;
  const pools = detectPools(password);

  const lengthOk = length >= 12;
  const lengthGood = length >= 8;
  const commonPattern = hasCommonPattern(password);
  const dictionaryHit = inDictionary(password);
  const repetitive = hasRepetitiveChars(password);

  const breakdown = [
    {
      key: 'length',
      label: `Length (${length})`,
      pass: lengthOk,
      pct: Math.min(100, Math.round((length / 16) * 100)),
      status: lengthOk ? 'Excellent' : lengthGood ? 'Good' : 'Weak',
    },
    {
      key: 'uppercase',
      label: 'Uppercase (A-Z)',
      pass: pools.upper,
      pct: pools.upper ? 100 : 0,
      status: pools.upper ? 'Excellent' : 'Weak',
    },
    {
      key: 'lowercase',
      label: 'Lowercase (a-z)',
      pass: pools.lower,
      pct: pools.lower ? 100 : 0,
      status: pools.lower ? 'Excellent' : 'Weak',
    },
    {
      key: 'numbers',
      label: 'Numbers (0-9)',
      pass: pools.digits,
      pct: pools.digits ? 100 : 0,
      status: pools.digits ? 'Excellent' : 'Weak',
    },
    {
      key: 'special',
      label: 'Special Characters (!@#$...)',
      pass: pools.special,
      pct: pools.special ? 100 : 0,
      status: pools.special ? 'Excellent' : 'Weak',
    },
    {
      key: 'commonPatterns',
      label: 'Common Patterns',
      pass: !commonPattern,
      pct: commonPattern ? 40 : 100,
      status: commonPattern ? 'Good' : 'Excellent',
    },
    {
      key: 'dictionaryCheck',
      label: 'Dictionary Check',
      pass: !dictionaryHit,
      pct: dictionaryHit ? 20 : 100,
      status: dictionaryHit ? 'Weak' : 'Excellent',
    },
    {
      key: 'repetitiveChars',
      label: 'Repetitive Characters',
      pass: !repetitive,
      pct: repetitive ? 30 : 100,
      status: repetitive ? 'Weak' : 'Excellent',
    },
  ];

  // Weighted overall score out of 100
  const weights = {
    length: 0.25,
    uppercase: 0.1,
    lowercase: 0.1,
    numbers: 0.1,
    special: 0.15,
    commonPatterns: 0.1,
    dictionaryCheck: 0.15,
    repetitiveChars: 0.05,
  };
  let score = 0;
  breakdown.forEach((item) => {
    score += (weights[item.key] || 0) * item.pct;
  });
  score = Math.round(Math.max(0, Math.min(100, score)));

  let scoreLabel = 'Weak';
  if (score >= 85) scoreLabel = 'Excellent';
  else if (score >= 65) scoreLabel = 'Good';
  else if (score >= 40) scoreLabel = 'Fair';

  const entropy = calculateEntropy(password);
  const eLabel = entropyLabel(entropy);
  const crackTimes = estimateCrackTimes(password);

  const weaknesses = [
    { key: 'tooShort', label: 'Too Short', hit: length < 12 },
    { key: 'noNumbers', label: 'No Numbers', hit: !pools.digits },
    { key: 'noSpecialChars', label: 'No Special Chars', hit: !pools.special },
    { key: 'commonWords', label: 'Common Words', hit: dictionaryHit },
    { key: 'repetitiveChars', label: 'Repetitive Chars', hit: repetitive },
  ].filter((w) => w.hit);

  return {
    password_length: length,
    score,
    scoreLabel,
    entropy,
    entropyLabel: eLabel.label,
    breakdown,
    crackTimes,
    weaknesses,
    dominantCrackTime: crackTimes.formatted.bruteForceOffline,
  };
}

module.exports = { analyzePassword };
