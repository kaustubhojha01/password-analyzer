const express = require('express');
const router = express.Router();
const { analyzePassword } = require('../utils/analyzer');
const historyStore = require('../utils/historyStore');

// POST /api/analyze  { password: string, save?: boolean }
router.post('/', async (req, res) => {
  const { password, save = true } = req.body || {};

  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'password is required' });
  }

  const result = analyzePassword(password);

  if (save) {
    try {
      await historyStore.addEntry({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        maskedPassword: '•'.repeat(Math.min(password.length, 12)),
        score: result.score,
        scoreLabel: result.scoreLabel,
        crackTime: result.dominantCrackTime,
        date: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[AnalyzeRoute] Failed to record history entry:', e.message);
    }
  }

  res.json(result);
});

module.exports = router;
