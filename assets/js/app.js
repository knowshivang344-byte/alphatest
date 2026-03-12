/**
 * app.js — Main application entry point
 *
 * NOTE: UI handler is `runBacktestUI` to avoid clashing with
 *       `runBacktestEngine` defined in engine.js.
 *       The HTML button calls `runBacktestUI`.
 */

async function runBacktestUI() {
  const ticker     = document.getElementById('stockSelect').value;
  const stratKey   = document.getElementById('strategySelect').value;
  const years      = parseInt(document.getElementById('periodSelect').value);
  const capital    = parseFloat(document.getElementById('capitalInput').value) || 10000;
  const commission = parseFloat(document.getElementById('commissionInput').value) || 0;

  showLoading('Generating price data...');
  await new Promise(r => setTimeout(r, 30));

  try {
    // 1. Generate simulated price data
    const data = generatePriceData(ticker, years);

    showLoading('Computing indicators & signals...');
    await new Promise(r => setTimeout(r, 30));

    // 2. Run signal generation
    const params      = readParams(stratKey);
    const strategy    = STRATEGIES[stratKey];
    const stratResult = strategy.fn(data, params);

    const buyCount = stratResult.signals.filter(s => s === 'BUY').length;
    if (buyCount === 0) {
      console.warn('No BUY signals generated. Try relaxing the strategy parameters.');
    }

    showLoading('Simulating trades...');
    await new Promise(r => setTimeout(r, 30));

    // 3. Run backtest engine
    const result = runBacktestEngine(data, stratResult.signals, capital, commission);

    // 4. Update all UI
    updateTopBar(ticker, strategy.label, years);
    updateKPIs(result.metrics, capital);
    updateTradeTable(result.trades);
    renderAllCharts(data, stratResult.signals, stratResult, result);

  } catch (err) {
    console.error('Backtest error:', err);
    alert('Error: ' + err.message);
  } finally {
    hideLoading();
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  buildParamPanel('sma_cross');
  setTimeout(runBacktestUI, 200);
});
