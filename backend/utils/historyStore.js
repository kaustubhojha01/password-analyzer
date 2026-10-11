const fs = require('fs');
const path = require('path');
const supabase = require('./supabaseClient');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'history.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readLocal() {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeLocal(entries) {
  ensureFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf8');
  } catch (e) {
    console.error('[HistoryStore] Local write error:', e.message);
  }
}

function normalizeFromDb(row) {
  return {
    id: row.id,
    maskedPassword: row.masked_password || row.maskedPassword || '••••••••',
    score: Number(row.score) || 0,
    scoreLabel: row.score_label || row.scoreLabel || 'Unknown',
    crackTime: row.crack_time || row.crackTime || 'Instant',
    date: row.date || row.created_at || new Date().toISOString(),
  };
}

async function readAll() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .order('date', { ascending: false })
        .limit(200);

      if (!error && Array.isArray(data)) {
        return data.map(normalizeFromDb);
      }
      console.warn('[HistoryStore] Supabase read failed, falling back to local:', error?.message);
    } catch (err) {
      console.warn('[HistoryStore] Supabase read exception:', err.message);
    }
  }
  return readLocal();
}

async function addEntry(entry) {
  // Always update local cache for resilience
  const localEntries = readLocal();
  localEntries.unshift(entry);
  writeLocal(localEntries.slice(0, 200));

  if (supabase) {
    try {
      const dbPayload = {
        id: entry.id,
        masked_password: entry.maskedPassword,
        score: entry.score,
        score_label: entry.scoreLabel,
        crack_time: entry.crackTime,
        date: entry.date || new Date().toISOString(),
      };

      const { error } = await supabase.from('analysis_history').insert([dbPayload]);
      if (error) {
        console.warn('[HistoryStore] Supabase insert warning:', error.message);
      }
    } catch (err) {
      console.warn('[HistoryStore] Supabase insert exception:', err.message);
    }
  }

  return entry;
}

async function clearAll() {
  writeLocal([]);

  if (supabase) {
    try {
      const { error } = await supabase
        .from('analysis_history')
        .delete()
        .neq('id', '');
      if (error) {
        console.warn('[HistoryStore] Supabase delete warning:', error.message);
      }
    } catch (err) {
      console.warn('[HistoryStore] Supabase clear exception:', err.message);
    }
  }
}

module.exports = { readAll, addEntry, clearAll };
