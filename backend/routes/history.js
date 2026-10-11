const express = require('express');
const router = express.Router();
const historyStore = require('../utils/historyStore');

// GET /api/history  -> list of past analyses (most recent first)
router.get('/', async (req, res) => {
  try {
    const data = await historyStore.readAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/history/chart -> { labels: [...], scores: [...] } for the last 7 entries, oldest first
router.get('/chart', async (req, res) => {
  try {
    const all = await historyStore.readAll();
    const entries = all.slice(0, 20).reverse();
    const labels = entries.map((e) =>
      new Date(e.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
    );
    const scores = entries.map((e) => e.score);
    res.json({ labels, scores });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// DELETE /api/history -> clear all history
router.delete('/', async (req, res) => {
  try {
    await historyStore.clearAll();
    res.json({ cleared: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

module.exports = router;
