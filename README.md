# Cyber Password Analyzer

A full-stack password strength dashboard: entropy scoring, crack-time
estimation across multiple attack models, pattern/dictionary detection,
a secure password generator, and a "Have I Been Pwned" breach checker —
all wired to a real Express backend.

## Project structure

```
cyber-password-analyzer/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── package.json
│   ├── routes/
│   │   ├── analyze.js         # POST /api/analyze
│   │   ├── generate.js        # POST /api/generate
│   │   ├── breach.js          # POST /api/breach-check
│   │   └── history.js         # GET/DELETE /api/history
│   ├── utils/
│   │   ├── entropy.js         # Shannon-style pool entropy
│   │   ├── patterns.js        # dictionary / keyboard-walk / repetition checks
│   │   ├── crackTime.js       # crack-time estimates per attack type
│   │   ├── analyzer.js        # combines everything into a score + breakdown
│   │   ├── generator.js       # cryptographically-secure password generator
│   │   └── historyStore.js    # JSON-file backed history persistence
│   └── data/history.json      # created automatically at runtime
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js                 # calls the backend API and renders the UI
```

## Running it

```bash
cd backend
npm install
npm start
```

Then open **http://localhost:4000** — the backend also serves the
frontend as static files, so this one server is all you need. (If you'd
rather run the frontend separately, e.g. with `npx serve frontend`, just
make sure the backend is running on port 4000 and reachable from the
page — update the `API` constant at the top of `frontend/app.js` if you
host it on a different origin.)

## How the analysis works

- **Entropy**: `length * log2(poolSize)`, where `poolSize` depends on
  which character classes (lowercase, uppercase, digits, symbols) are
  present.
- **Pattern detection**: flags keyboard walks (`qwerty`, `asdf`...),
  ascending/descending sequences (`abc`, `123`), 4-digit years, and a
  built-in list of common passwords/words.
- **Crack time**: for each attack type (online brute force, offline
  brute force, dictionary, hybrid, mask) we assume a guesses-per-second
  rate and divide the effective search space by it. These are
  illustrative educational estimates, not a precise cryptographic
  model.
- **Score**: a weighted combination (0–100) of length, character
  diversity, and the absence of detected weaknesses.
- **Breach check**: uses the HaveIBeenPwned Pwned Passwords API with
  the **k-anonymity model** — only the first 5 characters of the
  password's SHA-1 hash are ever sent over the network, so the full
  password (or even its full hash) never leaves your server.

## Notes

- History is persisted to `backend/data/history.json`. Delete that file
  (or call `DELETE /api/history`) to reset it.
- The password generator uses Node's `crypto.randomInt`, a
  cryptographically secure random source — not `Math.random()`.
- This is an educational tool. Treat any password you type into it as
  compromised going forward and don't reuse real production passwords
  for testing.
