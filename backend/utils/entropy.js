/**
 * Entropy calculation utilities.
 *
 * We estimate entropy using the classic "pool size" model:
 *   entropy (bits) = length * log2(poolSize)
 *
 * poolSize is the size of the character set the password draws from,
 * based on which character classes are present. This is the same
 * approach used by most password-strength meters (it's an upper bound
 * on entropy, not a measure of the password's actual unpredictability,
 * since it doesn't know if the password is a dictionary word etc. -
 * that's handled separately by pattern/dictionary checks).
 */

const POOL_SIZES = {
  lower: 26,
  upper: 26,
  digits: 10,
  special: 33, // !@#$%^&*()-_=+[]{};:'",.<>/?\|`~
};

function detectPools(password) {
  return {
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digits: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
}

function calculatePoolSize(password) {
  const present = detectPools(password);
  let pool = 0;
  Object.keys(present).forEach((key) => {
    if (present[key]) pool += POOL_SIZES[key];
  });
  return pool || 1;
}

function calculateEntropy(password) {
  if (!password) return 0;
  const pool = calculatePoolSize(password);
  const bits = password.length * Math.log2(pool);
  return Math.round(bits * 100) / 100;
}

function entropyLabel(bits) {
  if (bits < 28) return { label: 'Very Weak', color: 'red' };
  if (bits < 36) return { label: 'Weak', color: 'orange' };
  if (bits < 60) return { label: 'Good', color: 'yellow' };
  if (bits < 80) return { label: 'Strong', color: 'lightgreen' };
  return { label: 'Very Strong', color: 'green' };
}

module.exports = { calculateEntropy, calculatePoolSize, detectPools, entropyLabel };
