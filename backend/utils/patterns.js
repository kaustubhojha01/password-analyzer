/**
 * Pattern, dictionary and repetition detection.
 *
 * These checks look for the kinds of structure that make a password
 * far easier to guess than its raw character-pool entropy suggests
 * (keyboard walks, sequences, common words, repeated runs, etc).
 */

const COMMON_PASSWORDS = [
  'password', 'password1', '123456', '12345678', '123456789', 'qwerty',
  'qwerty123', 'letmein', 'welcome', 'admin', 'iloveyou', 'monkey',
  'dragon', 'football', 'baseball', 'master', 'sunshine', 'princess',
  'login', 'passw0rd', 'abc123', 'trustno1', 'superman', 'batman',
  'shadow', 'michael', 'jennifer', 'jordan', 'hunter', 'freedom',
  'whatever', 'starwars', 'cheese', 'summer', 'winter', 'flower',
];

const KEYBOARD_ROWS = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890',
];

function hasSequentialChars(password, minRun = 3) {
  const lower = password.toLowerCase();
  let run = 1;
  for (let i = 1; i < lower.length; i++) {
    const prev = lower.charCodeAt(i - 1);
    const curr = lower.charCodeAt(i);
    if (curr === prev + 1) {
      run++;
      if (run >= minRun) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

function hasKeyboardWalk(password, minRun = 3) {
  const lower = password.toLowerCase();
  for (const row of KEYBOARD_ROWS) {
    for (let i = 0; i <= row.length - minRun; i++) {
      const chunk = row.slice(i, i + minRun);
      if (lower.includes(chunk)) return true;
    }
  }
  return false;
}

function hasCommonPattern(password) {
  return hasSequentialChars(password) || hasKeyboardWalk(password) || /^(19|20)\d{2}$/.test(password);
}

function inDictionary(password) {
  const lower = password.toLowerCase();
  return COMMON_PASSWORDS.some((word) => lower.includes(word));
}

function hasRepetitiveChars(password, minRun = 3) {
  let run = 1;
  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) {
      run++;
      if (run >= minRun) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

module.exports = {
  hasCommonPattern,
  inDictionary,
  hasRepetitiveChars,
  hasSequentialChars,
  hasKeyboardWalk,
  COMMON_PASSWORDS,
};
