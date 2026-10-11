const express = require('express');
const crypto = require('crypto');
const router = express.Router();

/**
 * We never send the raw password anywhere. Using the k-anonymity model:
 *  1. SHA-1 hash the password locally.
 *  2. Send only the first 5 hex characters of the hash to the API.
 *  3. The API returns all hash suffixes that share that prefix.
 *  4. We check locally whether our full hash's suffix is in that list.
 * This means the full password (and even its full hash) never leaves
 * this server. See: https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
router.post('/', async (req, res) => {
  const { password } = req.body || {};

  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'password is required' });
  }

  try {
    const sha1 = crypto.createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Breach database lookup failed' });
    }

    const text = await response.text();
    const lines = text.split('\n');

    let count = 0;
    for (const line of lines) {
      const [lineSuffix, lineCount] = line.trim().split(':');
      if (lineSuffix === suffix) {
        count = parseInt(lineCount, 10) || 0;
        break;
      }
    }

    res.json({
      breached: count > 0,
      count,
      message:
        count > 0
          ? `This password has appeared in ${count.toLocaleString()} known data breaches. Change it immediately.`
          : 'Good news — this password was not found in any known breaches.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Unable to reach breach database', details: err.message });
  }
});

module.exports = router;
