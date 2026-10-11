const crypto = require('crypto');

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  special: '!@#$%^&*()-_=+[]{};:,.<>?',
};

function randomInt(max) {
  return crypto.randomInt(0, max);
}

function generatePassword({
  length = 16,
  useUpper = true,
  useLower = true,
  useDigits = true,
  useSpecial = true,
  excludeAmbiguous = false,
} = {}) {
  let pool = '';
  const required = [];

  if (useLower) { pool += SETS.lower; required.push(SETS.lower); }
  if (useUpper) { pool += SETS.upper; required.push(SETS.upper); }
  if (useDigits) { pool += SETS.digits; required.push(SETS.digits); }
  if (useSpecial) { pool += SETS.special; required.push(SETS.special); }

  if (excludeAmbiguous) {
    pool = pool.replace(/[Il1O0]/g, '');
  }

  if (!pool) pool = SETS.lower + SETS.digits;
  length = Math.max(4, Math.min(128, length));

  const chars = [];
  // Guarantee at least one char from each selected category
  required.forEach((set) => {
    const s = excludeAmbiguous ? set.replace(/[Il1O0]/g, '') : set;
    if (s.length) chars.push(s[randomInt(s.length)]);
  });

  while (chars.length < length) {
    chars.push(pool[randomInt(pool.length)]);
  }

  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.slice(0, length).join('');
}

module.exports = { generatePassword };
