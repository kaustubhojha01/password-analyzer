const API = window.CYBER_API_URL || ''; // same-origin by default; supports remote API if deployed separately

/* ---------------- Navigation ---------------- */
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const viewTitle = document.getElementById('viewTitle');

const TITLES = {
  dashboard: 'Dashboard',
  analyzer: 'Password Analyzer',
  generator: 'Password Generator',
  breach: 'Breach Checker',
  history: 'History',
  tips: 'Secure Tips',
  settings: 'Settings',
  about: 'About',
};

navItems.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.view;
    if (!target) return;
    navItems.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    views.forEach((v) => v.classList.add('hidden'));
    const viewEl = document.getElementById(`view-${target}`);
    if (viewEl) viewEl.classList.remove('hidden');
    viewTitle.textContent = TITLES[target] || 'Dashboard';
    if (target === 'history') loadHistoryView();
  });
});

/* ---------------- Helpers ---------------- */
function statusClass(status) {
  return (status || '').toLowerCase();
}

function barClass(status) {
  if (status === 'Excellent') return '';
  if (status === 'Good') return 'fair';
  return 'weak';
}

function setArc(circleEl, circumference, percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;
  circleEl.style.strokeDasharray = circumference;
  circleEl.style.strokeDashoffset = offset;
}

function buildSparkline(svgEl, data, color) {
  if (!data || data.length < 2) { svgEl.innerHTML = ''; return; }
  const w = 200, h = 40;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(' ');
  svgEl.innerHTML = `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
}

function buildAreaChart(svgEl, labels, values) {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light' || document.body.classList.contains('light-theme');
  const textColor = isLight ? '#64748b' : '#8b93a7';
  if (!values || values.length === 0) {
    svgEl.innerHTML = `<text x="280" y="110" fill="${textColor}" font-size="13" text-anchor="middle">No history yet — analyze a password to get started</text>`;
    return;
  }
  const w = 560, h = 220, padTop = 20, padBottom = 30, padLeft = 10, padRight = 10;
  const plotH = h - padTop - padBottom;
  const plotW = w - padLeft - padRight;
  const max = 100, min = 0;
  const step = values.length > 1 ? plotW / (values.length - 1) : 0;

  const pts = values.map((v, i) => {
    const x = padLeft + i * step;
    const y = padTop + plotH - ((v - min) / (max - min)) * plotH;
    return [x, y];
  });

  const linePath = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1][0]},${padTop + plotH} L${pts[0][0]},${padTop + plotH} Z`;

  const dots = pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#22c55e" />`).join('');
  const labelEls = labels.map((l, i) => {
    if (labels.length > 8 && i % Math.ceil(labels.length / 7) !== 0) return '';
    return `<text x="${pts[i][0]}" y="${h - 8}" fill="${textColor}" font-size="10" text-anchor="middle">${l}</text>`;
  }).join('');

  svgEl.innerHTML = `
    <defs>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#22c55e" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#areaGrad)" />
    <path d="${linePath}" fill="none" stroke="#22c55e" stroke-width="2.5" />
    ${dots}
    ${labelEls}
  `;
}

/* ---------------- API calls ---------------- */
async function analyzePassword(password, save = true) {
  const res = await fetch(`${API}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, save }),
  });
  if (!res.ok) throw new Error('Analyze request failed');
  return res.json();
}

async function fetchHistory() {
  const res = await fetch(`${API}/api/history`);
  return res.ok ? res.json() : [];
}

async function fetchHistoryChart() {
  const res = await fetch(`${API}/api/history/chart`);
  return res.ok ? res.json() : { labels: [], scores: [] };
}

async function generatePasswordApi(options) {
  const res = await fetch(`${API}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return res.json();
}

async function checkBreach(password) {
  const res = await fetch(`${API}/api/breach-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return res.json();
}

/* ---------------- Rendering ---------------- */
function renderBreakdown(breakdown) {
  const el = document.getElementById('breakdownList');
  const icons = { length: '📏', uppercase: 'A', lowercase: 'a', numbers: '1', special: '#', commonPatterns: '◈', dictionaryCheck: '📖', repetitiveChars: '≋' };
  el.innerHTML = breakdown.map((item) => `
    <div class="breakdown-row">
      <span class="breakdown-label">${icons[item.key] || ''} ${item.label}</span>
      <div class="bar-track"><div class="bar-fill ${barClass(item.status)}" style="width:${item.pct}%"></div></div>
      <span class="status-chip ${statusClass(item.status)}">${item.status}</span>
    </div>
  `).join('');
}

function renderCrackTable(crackTimes) {
  const tbody = document.querySelector('#crackTable tbody');
  const rows = [
    ['Brute Force (Online)', crackTimes.formatted.bruteForceOnline],
    ['Brute Force (Offline)', crackTimes.formatted.bruteForceOffline],
    ['Dictionary Attack', crackTimes.formatted.dictionary],
    ['Hybrid Attack', crackTimes.formatted.hybrid],
    ['Mask Attack', crackTimes.formatted.mask],
  ];
  tbody.innerHTML = rows.map(([label, val]) => `<tr><td>${label}</td><td>${val}</td></tr>`).join('');
}

function renderWeaknesses(historyEntries) {
  const defs = [
    { key: 'tooShort', label: 'Too Short' },
    { key: 'noNumbers', label: 'No Numbers' },
    { key: 'noSpecialChars', label: 'No Special Chars' },
    { key: 'commonWords', label: 'Common Words' },
    { key: 'repetitiveChars', label: 'Repetitive Chars' },
  ];
  const el = document.getElementById('weaknessList');

  if (!historyEntries.weaknessStats) {
    el.innerHTML = '<div class="weakness-row"><span class="weakness-name">No data yet</span></div>';
    return;
  }
  el.innerHTML = defs.map((d) => {
    const pct = historyEntries.weaknessStats[d.key] || 0;
    const cls = pct >= 20 ? 'red' : pct >= 10 ? 'amber' : 'green';
    return `<div class="weakness-row">
      <span class="weakness-name">${d.label}</span>
      <span class="weakness-pct ${cls}">${pct}%</span>
    </div>`;
  }).join('');
}

function renderRecentTable(entries, bodyId) {
  const tbody = document.getElementById(bodyId);
  if (!entries.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:#8b93a7;">No analyses yet</td></tr>`;
    return;
  }
  tbody.innerHTML = entries.slice(0, 10).map((e) => `
    <tr>
      <td class="mono">${e.maskedPassword}</td>
      <td>${e.score}/100</td>
      <td><span class="status-chip ${statusClass(e.scoreLabel)}">${e.scoreLabel}</span></td>
      <td>${e.crackTime}</td>
      <td>${new Date(e.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
    </tr>
  `).join('');
}

function computeWeaknessStats(entries) {
  if (!entries.length) return null;
  // We only stored score-level info, so re-derive rough stats isn't possible
  // without the original password. Instead we rely on the current analysis'
  // weaknesses plus flag counts we can infer from score bands as an estimate.
  return null;
}

function renderDashboard(analysis, history, chart) {
  // Stat cards
  document.getElementById('statScore').textContent = `${analysis.score}/100`;
  document.getElementById('statScoreTag').textContent = analysis.scoreLabel;

  document.getElementById('statEntropy').textContent = `${analysis.entropy} bits`;
  document.getElementById('statEntropyTag').textContent = analysis.entropyLabel;

  const crackTime = analysis.dominantCrackTime || 'Millions of Years';
  document.getElementById('statCrackTime').textContent = crackTime;
  document.getElementById('statCrackTag').textContent = crackTime.includes('Instant') ? 'Very Insecure' : 'Very Secure';

  document.getElementById('statLength').textContent = analysis.password_length || 0;
  document.getElementById('statLengthTag').textContent = (analysis.password_length || 0) >= 12 ? 'Optimal' : 'Too Short';

  const scores = chart && chart.scores && chart.scores.length ? chart.scores : [analysis.score || 0];
  buildSparkline(document.getElementById('sparkScore'), scores, '#2f8fef');
  buildSparkline(document.getElementById('sparkEntropy'), scores.map((s) => s * 0.6), '#a855f7');
  buildSparkline(document.getElementById('sparkCrack'), scores.map((s) => s * 0.8), '#f5a623');
  buildSparkline(document.getElementById('sparkLength'), scores.map((s) => s * 0.16), '#22c55e');

  // Breakdown + crack table
  renderBreakdown(analysis.breakdown || []);
  if (analysis.crackTimes) renderCrackTable(analysis.crackTimes);

  // Entropy gauge (circumference for r=68 is 427.3)
  const entropyPct = Math.min(100, ((analysis.entropy || 0) / 100) * 100);
  setArc(document.getElementById('entropyArc'), 427.3, entropyPct);
  document.getElementById('entropyValue').textContent = analysis.entropy || 0;
  document.getElementById('entropyLabel').textContent = analysis.entropyLabel || '--';

  // Health gauge (sidebar, circumference for r=52 is 326.7)
  const scoreVal = analysis.score || 0;
  setArc(document.getElementById('healthArc'), 326.7, scoreVal);
  document.getElementById('healthPct').textContent = `${scoreVal}%`;
  document.getElementById('healthLabel').textContent = analysis.scoreLabel || '--';
  document.getElementById('healthLabel').className = `gauge-label ${scoreVal >= 65 ? 'good' : ''}`;

  // History chart + weaknesses
  if (chart) buildAreaChart(document.getElementById('historyChart'), chart.labels || [], chart.scores || []);

  const currentWeakKeys = (analysis.weaknesses || []).map((w) => w.key);
  const stats = {};
  ['tooShort', 'noNumbers', 'noSpecialChars', 'commonWords', 'repetitiveChars'].forEach((k) => {
    stats[k] = currentWeakKeys.includes(k) ? Math.round(100 / (analysis.weaknesses.length || 1)) : 0;
  });
  renderWeaknesses({ weaknessStats: stats });

  // Recent table
  renderRecentTable(history, 'recentTableBody');
}

/* ---------------- Dashboard bootstrap ---------------- */
async function refreshDashboard(password) {
  const analysis = await analyzePassword(password);
  const [history, chart] = await Promise.all([fetchHistory(), fetchHistoryChart()]);
  renderDashboard(analysis, history, chart);
  return analysis;
}

async function loadHistoryView() {
  const history = await fetchHistory();
  renderRecentTable(history, 'historyTableBody');
}

/* ---------------- Password Analyzer view ---------------- */
const analyzerInput = document.getElementById('analyzerInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const analyzerResult = document.getElementById('analyzerResult');
const toggleVis = document.getElementById('toggleAnalyzerVisibility');

toggleVis.addEventListener('click', () => {
  analyzerInput.type = analyzerInput.type === 'password' ? 'text' : 'password';
});

analyzeBtn.addEventListener('click', async () => {
  const pw = analyzerInput.value;
  if (!pw) return;
  analyzerResult.innerHTML = '<p style="color:#8b93a7;">Analyzing...</p>';
  const analysis = await analyzePassword(pw, true);
  analyzerResult.innerHTML = `
    <div class="card" style="margin-top:12px;">
      <div class="card-title">Score: ${analysis.score}/100 — ${analysis.scoreLabel}</div>
      <div id="analyzerBreakdown" class="breakdown-list"></div>
    </div>
  `;
  const container = document.getElementById('analyzerBreakdown');
  const icons = { length: '📏', uppercase: 'A', lowercase: 'a', numbers: '1', special: '#', commonPatterns: '◈', dictionaryCheck: '📖', repetitiveChars: '≋' };
  container.innerHTML = analysis.breakdown.map((item) => `
    <div class="breakdown-row">
      <span class="breakdown-label">${icons[item.key] || ''} ${item.label}</span>
      <div class="bar-track"><div class="bar-fill ${barClass(item.status)}" style="width:${item.pct}%"></div></div>
      <span class="status-chip ${statusClass(item.status)}">${item.status}</span>
    </div>
  `).join('');

  // Refresh dashboard state in background too
  refreshDashboard(pw).catch(() => {});
});

/* ---------------- Password Generator view ---------------- */
const genLength = document.getElementById('genLength');
const lengthVal = document.getElementById('lengthVal');
genLength.addEventListener('input', () => { lengthVal.textContent = genLength.value; });

document.getElementById('generateBtn').addEventListener('click', async () => {
  const options = {
    length: parseInt(genLength.value, 10),
    useUpper: document.getElementById('genUpper').checked,
    useLower: document.getElementById('genLower').checked,
    useDigits: document.getElementById('genDigits').checked,
    useSpecial: document.getElementById('genSpecial').checked,
    excludeAmbiguous: document.getElementById('genAmbiguous').checked,
  };
  const { password, analysis } = await generatePasswordApi(options);
  document.getElementById('generatedDisplay').textContent = password;
  document.getElementById('generatorResult').innerHTML = `
    <div class="card">
      <div class="card-title">Score: ${analysis.score}/100 — ${analysis.scoreLabel} · Entropy: ${analysis.entropy} bits</div>
    </div>
  `;
});

/* ---------------- Breach Checker view ---------------- */
async function runBreachCheck(password, resultEl) {
  if (!password) return;
  resultEl.innerHTML = '<p style="color:#8b93a7;">Checking against known breaches...</p>';
  try {
    const result = await checkBreach(password);
    const color = result.breached ? 'var(--red)' : 'var(--green)';
    resultEl.innerHTML = `<div class="card"><p style="color:${color}; font-weight:600; margin:0;">${result.message}</p></div>`;
  } catch (e) {
    resultEl.innerHTML = `<div class="card"><p style="color:var(--red);">Could not reach breach database.</p></div>`;
  }
}

document.getElementById('checkBreachBtn').addEventListener('click', () => {
  const pw = document.getElementById('breachInput').value;
  runBreachCheck(pw, document.getElementById('breachResult'));
});

document.getElementById('dashBreachBtn').addEventListener('click', () => {
  document.querySelector('.nav-item[data-view="breach"]').click();
});

/* ---------------- Theme & Dark Mode ---------------- */
const THEME_KEY = 'cyber_analyzer_theme';

function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('light-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.add('light-theme');
  }

  const darkToggle = document.getElementById('darkModeToggle');
  const settingsToggle = document.getElementById('settingsDarkToggle');
  if (darkToggle) darkToggle.checked = isDark;
  if (settingsToggle) settingsToggle.checked = isDark;

  const themeIcon = document.getElementById('sidebarThemeIcon');
  if (themeIcon) themeIcon.textContent = isDark ? '🌙' : '☀️';

  try {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  } catch (e) {}

  // Update history chart text if already rendered
  const historySvg = document.getElementById('historyChart');
  if (historySvg && historySvg.querySelector('text')) {
    fetchHistoryChart().then((chart) => {
      buildAreaChart(historySvg, chart.labels, chart.scores);
    }).catch(() => {});
  }
}

function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch (e) {}
  const isDark = saved !== null ? saved === 'dark' : true;
  applyTheme(isDark);
}

document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
  applyTheme(e.target.checked);
});

document.getElementById('settingsDarkToggle')?.addEventListener('change', (e) => {
  applyTheme(e.target.checked);
});

/* ---------------- Export report ---------------- */
document.getElementById('exportBtn').addEventListener('click', async () => {
  const history = await fetchHistory();
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'password-analysis-report.json';
  a.click();
  URL.revokeObjectURL(url);
});

/* ---------------- Floating Hover Interaction ---------------- */
function initFloatingHover() {
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isFinePointer || prefersReducedMotion) return;

  const cards = document.querySelectorAll('.stat-card, #view-dashboard .card');
  cards.forEach((card) => {
    let rafId = null;
    let targetTiltX = 0;
    let targetTiltY = 0;
    const isStat = card.classList.contains('stat-card');
    const maxTilt = isStat ? 4.5 : 3.0;
    const liftAmount = isStat ? '-10px' : '-8px';

    card.addEventListener('pointerenter', () => {
      card.style.setProperty('--tilt-lift', liftAmount);
    });

    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = ((x / rect.width) - 0.5) * 2;
      const dy = ((y / rect.height) - 0.5) * 2;

      targetTiltX = -dy * maxTilt;
      targetTiltY = dx * maxTilt;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          card.style.setProperty('--tilt-x', `${targetTiltX.toFixed(2)}deg`);
          card.style.setProperty('--tilt-y', `${targetTiltY.toFixed(2)}deg`);
          rafId = null;
        });
      }
    });

    card.addEventListener('pointerleave', () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      card.style.setProperty('--tilt-lift', '0px');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
}

/* ---------------- Init ---------------- */
(async function init() {
  initTheme();
  initFloatingHover();
  const DEMO_PASSWORD = 'Tr0ub4dor&SunsetSky!';
  try {
    await refreshDashboard(DEMO_PASSWORD);
  } catch (e) {
    console.error('Failed to load initial dashboard', e);
  }
})();
