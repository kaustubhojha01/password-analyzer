require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const analyzeRoute = require('./routes/analyze');
const generateRoute = require('./routes/generate');
const breachRoute = require('./routes/breach');
const historyRoute = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/analyze', analyzeRoute);
app.use('/api/generate', generateRoute);
app.use('/api/breach-check', breachRoute);
app.use('/api/history', historyRoute);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the static frontend (so the whole app can run from one server)
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Cyber Password Analyzer backend running at http://localhost:${PORT}`);
  });
}

module.exports = app;
