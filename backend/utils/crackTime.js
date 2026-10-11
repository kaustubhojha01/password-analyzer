const { calculatePoolSize } = require('./entropy');
const { hasCommonPattern, inDictionary } = require('./patterns');

/**
 * Guesses-per-second assumptions for each attack type. These are
 * illustrative, commonly-cited ballpark figures used for educational
 * password meters (not a precise cryptographic model).
 */
const ATTACK_RATES = {
  bruteForceOnline: 100, // throttled login endpoint
  bruteForceOffline: 1e10, // fast offline hash cracking (GPU rig)
  dictionary: 1e6, // dictionary + common mutations
  hybrid: 1e8, // dictionary words + brute-force suffixes
  mask: 1e12, // structure/mask attack once pattern is known
};

function formatSeconds(seconds) {
  if (!isFinite(seconds) || seconds < 0) return 'Instantly';
  if (seconds < 1) return 'Instantly';
  if (seconds < 60) return `${Math.round(seconds)} Seconds`;

  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const year = day * 365;

  if (seconds < hour) return `${Math.round(seconds / minute)} Minutes`;
  if (seconds < day) return `${Math.round(seconds / hour)} Hours`;
  if (seconds < year) return `${Math.round(seconds / day)} Days`;

  const years = seconds / year;
  if (years > 1e6) return 'Millions of Years';
  if (years > 1000) return 'Thousands of Years';
  if (years > 100) return 'Hundreds of Years';
  return `${Math.round(years)} Years`;
}

function estimateCrackTimes(password) {
  const pool = calculatePoolSize(password);
  const length = password.length || 0;
  const fullSpace = Math.pow(pool, length);

  // Dictionary / hybrid attacks are far faster if the password contains
  // a dictionary word or a common pattern, since the effective search
  // space shrinks dramatically.
  const weak = inDictionary(password) || hasCommonPattern(password);
  const dictionarySpace = weak ? Math.max(fullSpace / 1e6, 1e3) : fullSpace * 10;
  const hybridSpace = weak ? Math.max(fullSpace / 1e3, 1e6) : fullSpace;
  const maskSpace = weak ? Math.max(fullSpace / 1e8, 10) : fullSpace / 10;

  const results = {
    bruteForceOnline: fullSpace / ATTACK_RATES.bruteForceOnline,
    bruteForceOffline: fullSpace / ATTACK_RATES.bruteForceOffline,
    dictionary: dictionarySpace / ATTACK_RATES.dictionary,
    hybrid: hybridSpace / ATTACK_RATES.hybrid,
    mask: Math.max(maskSpace, 1) / ATTACK_RATES.mask,
  };

  return {
    seconds: results,
    formatted: {
      bruteForceOnline: formatSeconds(results.bruteForceOnline),
      bruteForceOffline: formatSeconds(results.bruteForceOffline),
      dictionary: formatSeconds(results.dictionary),
      hybrid: formatSeconds(results.hybrid),
      mask: formatSeconds(results.mask),
    },
  };
}

module.exports = { estimateCrackTimes, formatSeconds };
