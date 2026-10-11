const express = require('express');
const router = express.Router();
const { generatePassword } = require('../utils/generator');
const { analyzePassword } = require('../utils/analyzer');

// POST /api/generate  { length, useUpper, useLower, useDigits, useSpecial, excludeAmbiguous }
router.post('/', (req, res) => {
  const options = req.body || {};
  const password = generatePassword(options);
  const analysis = analyzePassword(password);
  res.json({ password, analysis });
});

module.exports = router;
