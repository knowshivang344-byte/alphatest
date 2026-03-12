/**
 * charts.js — Chart rendering module
 *
 * Renders all 5 charts using Chart.js 4.4.
 * All charts are destroyed and re-created on each backtest run.
 */

const _charts = {};

const MONO = "'JetBrains Mono'";
const GRID = 'rgba(35,40,55,0.6)';
const TICK = { color: '#4b5563', font: { family: MONO, size: 9 } };

function _destroy(id) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

// ── 1. Price Chart with indicator overlays + buy/sell markers ──────

/**
 * Render the main price chart with strategy indicators and signals.
 *
 * @param {DayData[]}     data
 * @param {string[]}      signals
 * @param {SignalResult}  stratResult
 * @param {string}        ticker
 */
function renderPriceChart(data, signals, stratResult) {
  _destroy('priceChart');

  const labels  = data.map(d => d.date);
  const closes  = data.map(d => d.close);
  const { indicators, indicatorNames, indicatorColors } = stratResult;

  // Build indicator overlay datasets
  const indicatorDatasets = Object.values(indicators).map((vals, i) => ({
    label:           indicatorNames[i],
    data:            vals,
    borderColor:     indicatorColors[i],
    borderWidth:     1.5,
    pointRadius:     0,
    fill:            false,
    tension:         0.2,
    yAxisID:         'y',
  }));

  // BUY scatter points
  const buyPoints = data
    .map((d, i) => signals[i] === 'BUY' ? { x: d.date, y: d.close } : null)
    .filter(Boolean);

  // SELL scatter points
  const sellPoints = data
    .map((d, i) => signals[i] === 'SELL' ? { x: d.date, y: d.close } : null)
    .filter(Boolean);

  const ctx = document.getElementById('priceChart').getContext('2d');
  _charts.priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label:       'Price',
          data:        closes,
          borderColor: '#e2e8f0',
          borderWidth: 1.5,
          pointRadius: 0,
          fill:        false,
          tension:     0.1,
          yAxisID:     'y',
        },
        ...indicatorDatasets,
        {
          label:           '▲ BUY',
          data:            labels.map(l => buyPoints.find(p => p.x === l)?.y ?? null),
          borderColor:     '#22c55e',
          backgroundColor: '#22c55e',
          pointRadius:     labels.map(l => buyPoints.find(p => p.x === l) ? 7 : 0),
          pointStyle:      'triangle',
          showLine:        false,
          yAxisID:         'y',
        },
        {
          label:           '▼ SELL',
          data:            labels.map(l => sellPoints.find(p => p.x === l)?.y ?? null),
          borderColor:     '#ef4444',
          backgroundColor: '#ef4444',
          pointRadius:     labels.map(l => sellPoints.find(p => p.x === l) ? 7 : 0),
          pointStyle:      'triangle',
          pointRotation:   180,
          showLine:        false,
          yAxisID:         'y',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.dataset.label === '▲ BUY' || ctx.dataset.label === '▼ SELL') {
                return ctx.parsed.y != null ? `${ctx.dataset.label} @ $${ctx.parsed.y.toFixed(2)}` : null;
              }
              return ctx.parsed.y != null ? `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}` : null;
            },
          },
        },
      },
      scales: {
        x: { ticks: { ...TICK, maxTicksLimit: 10 }, grid: { color: GRID } },
        y: { ticks: { ...TICK, callback: v => `$${v.toFixed(0)}` }, grid: { color: GRID } },
      },
    },
  });
}

// ── 2. Equity Curve ────────────────────────────────────────────────

function renderEquityChart(data, result) {
  _destroy('equityChart');

  const labels = data.map(d => d.date);
  const ctx    = document.getElementById('equityChart').getContext('2d');

  _charts.equityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label:       'Strategy',
          data:        result.equityCurve,
          borderColor: '#6c63ff',
          borderWidth: 2,
          pointRadius: 0,
          fill:        {
            target: 'origin',
            above:  'rgba(108,99,255,0.06)',
          },
          tension: 0.2,
        },
        {
          label:       'Buy & Hold',
          data:        result.bhCurve,
          borderColor: '#f59e0b',
          borderWidth: 1.5,
          borderDash:  [4, 4],
          pointRadius: 0,
          fill:        false,
          tension:     0.2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          labels: { color: '#4b5563', font: { family: MONO, size: 10 }, boxWidth: 12 },
        },
        tooltip: {
          callbacks: { label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(0)}` },
        },
      },
      scales: {
        x: { ticks: { ...TICK, maxTicksLimit: 8 }, grid: { color: GRID } },
        y: { ticks: { ...TICK, callback: v => `$${v.toFixed(0)}` }, grid: { color: GRID } },
      },
    },
  });
}

// ── 3. Drawdown Chart ──────────────────────────────────────────────

function renderDrawdownChart(data, result) {
  _destroy('drawdownChart');

  const labels = data.map(d => d.date);
  const ctx    = document.getElementById('drawdownChart').getContext('2d');

  _charts.drawdownChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:           'Drawdown',
        data:            result.drawdowns,
        borderColor:     '#ef4444',
        borderWidth:     1.5,
        pointRadius:     0,
        fill:            { target: 'origin', below: 'rgba(239,68,68,0.12)' },
        tension:         0.2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { ...TICK, maxTicksLimit: 8 }, grid: { color: GRID } },
        y: { ticks: { ...TICK, callback: v => `${v.toFixed(1)}%` }, grid: { color: GRID } },
      },
    },
  });
}

// ── 4. Trade P&L distribution ──────────────────────────────────────

function renderTradeChart(result) {
  _destroy('tradeChart');

  const pnls   = result.trades.map(t => t.pnlPct);
  const colors = pnls.map(p => p >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)');
  const labels = result.trades.map((t, i) => `T${i + 1}`);

  const ctx = document.getElementById('tradeChart').getContext('2d');
  _charts.tradeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data:            pnls,
        backgroundColor: colors,
        borderWidth:     0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: TICK, grid: { color: GRID } },
        y: { ticks: { ...TICK, callback: v => `${v.toFixed(1)}%` }, grid: { color: GRID } },
      },
    },
  });
}

// ── 5. Monthly returns ─────────────────────────────────────────────

function renderMonthlyChart(result) {
  _destroy('monthlyChart');

  const monthly = result.monthlyReturns;
  const labels  = monthly.map(m => m.label);
  const values  = monthly.map(m => m.return);
  const colors  = values.map(v => v >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)');

  const ctx = document.getElementById('monthlyChart').getContext('2d');
  _charts.monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { ...TICK, maxRotation: 45 }, grid: { color: GRID } },
        y: { ticks: { ...TICK, callback: v => `${v.toFixed(1)}%` }, grid: { color: GRID } },
      },
    },
  });
}

// ── Render all ─────────────────────────────────────────────────────

function renderAllCharts(data, signals, stratResult, backtestResult) {
  renderPriceChart(data, signals, stratResult);
  renderEquityChart(data, backtestResult);
  renderDrawdownChart(data, backtestResult);
  renderTradeChart(backtestResult);
  renderMonthlyChart(backtestResult);
}
