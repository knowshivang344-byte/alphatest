/**
 * ui.js — UI rendering and DOM helpers
 */

const fmt  = n  => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct  = n  => (n > 0 ? '+' : '') + n.toFixed(2) + '%';
const clr  = n  => n >= 0 ? 'green' : 'red';

// ── KPI Cards ──────────────────────────────────────────────────────

function updateKPIs(metrics, capital) {
  const { finalValue, totalReturn, bhReturn, numTrades, winRate, sharpe, maxDrawdown } = metrics;

  setKPI('return',   pct(totalReturn),          `vs B&H: ${pct(bhReturn)}`,                   clr(totalReturn));
  setKPI('value',    `$${fmt(finalValue)}`,      `Started with $${capital.toLocaleString()}`,  clr(finalValue - capital));
  setKPI('trades',   numTrades,                  `${metrics.numWins} winners`,                 '');
  setKPI('winrate',  winRate.toFixed(1) + '%',   winRate >= 50 ? 'Above 50%' : 'Below 50%',    clr(winRate - 50));
  setKPI('sharpe',   sharpe.toFixed(2),          sharpe >= 1 ? '✓ Good (>1.0)' : 'Below 1.0', clr(sharpe - 1));
  setKPI('drawdown', pct(maxDrawdown),            'Max peak-to-trough',                         'red');
}

function setKPI(id, value, sub, colorClass) {
  const valEl = document.getElementById(`kpi-${id}`);
  const subEl = document.getElementById(`kpi-${id}-sub`);
  valEl.textContent = value;
  valEl.className   = `kpi-value ${colorClass}`;
  if (subEl) subEl.textContent = sub;
}

// ── Trade Log Table ────────────────────────────────────────────────

function updateTradeTable(trades) {
  const tbody = document.getElementById('tradeBody');
  if (trades.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty-row">No trades generated — try different parameters</td></tr>`;
    return;
  }

  tbody.innerHTML = trades.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><span class="tag tag-buy">LONG</span></td>
      <td>${t.entryDate}</td>
      <td>$${t.entryPrice.toFixed(2)}</td>
      <td>${t.exitDate}${t.open ? ' *' : ''}</td>
      <td>$${t.exitPrice.toFixed(2)}</td>
      <td>${t.shares}</td>
      <td style="color:${t.pnl >= 0 ? 'var(--green)' : 'var(--red)'}">
        ${t.pnl >= 0 ? '+' : ''}$${fmt(t.pnl)}
      </td>
      <td style="color:${t.pnlPct >= 0 ? 'var(--green)' : 'var(--red)'}">
        ${t.pnlPct >= 0 ? '+' : ''}${t.pnlPct.toFixed(2)}%
      </td>
      <td><span class="tag ${t.win ? 'tag-win' : 'tag-loss'}">${t.win ? 'WIN' : 'LOSS'}</span></td>
    </tr>
  `).join('');
}

// ── Top bar ────────────────────────────────────────────────────────

function updateTopBar(ticker, stratLabel, years) {
  document.getElementById('topTitle').textContent =
    `${ticker} — ${stratLabel} · ${years}Y Backtest`;
  document.getElementById('topSub').textContent =
    `AlphaTest · Simulated data · ${new Date().toLocaleDateString()}`;
  document.getElementById('priceChartTitle').textContent =
    `${ticker} Price + ${stratLabel} Signals`;
}

// ── Strategy param panel ────────────────────────────────────────────

function buildParamPanel(stratKey) {
  const strat  = STRATEGIES[stratKey];
  const panel  = document.getElementById('paramsPanel');
  panel.innerHTML = '';

  strat.paramDefs.forEach(def => {
    panel.innerHTML += `
      <div class="sidebar-section">
        <div class="param-row">
          <label>${def.label}</label>
          <input
            type="number"
            id="param-${def.key}"
            value="${strat.defaultParams[def.key]}"
            min="${def.min}"
            max="${def.max}"
            step="${def.step}"
          />
        </div>
      </div>`;
  });

  document.getElementById('strategyExplainer').innerHTML = strat.explain;
}

function readParams(stratKey) {
  const strat  = STRATEGIES[stratKey];
  const params = {};
  strat.paramDefs.forEach(def => {
    params[def.key] = parseFloat(document.getElementById(`param-${def.key}`).value);
  });
  return params;
}

function onStrategyChange() {
  const key = document.getElementById('strategySelect').value;
  buildParamPanel(key);
}

// ── Loading ────────────────────────────────────────────────────────

function showLoading(msg) {
  document.getElementById('loadingMsg').textContent = msg || 'Running backtest...';
  document.getElementById('loading').classList.add('active');
}

function hideLoading() {
  document.getElementById('loading').classList.remove('active');
}
