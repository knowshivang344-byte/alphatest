/**
 * engine.js — Core backtesting engine
 *
 * Takes price data + signals and simulates a realistic
 * trading portfolio with position tracking, commissions,
 * and full performance metric calculation.
 */

/**
 * Run a full backtest simulation.
 *
 * Rules:
 *  - Start fully in cash
 *  - On BUY signal: invest all available cash (buy as many whole shares as possible)
 *  - On SELL signal: sell entire position
 *  - Execute on OPEN of the day AFTER the signal (realistic)
 *  - Deduct commission on every trade
 *
 * @param {DayData[]}  data        — price data array
 * @param {string[]}   signals     — parallel array of 'BUY'|'SELL'|null
 * @param {number}     capital     — starting capital in $
 * @param {number}     commission  — $ per trade
 * @returns {BacktestResult}
 */
function runBacktestEngine(data, signals, capital, commission) {
  let cash     = capital;
  let shares   = 0;
  let inTrade  = false;
  let entryPrice = 0;
  let entryDate  = '';

  const equityCurve = [];   // portfolio value each day
  const trades      = [];   // closed trade records
  const drawdowns   = [];   // daily drawdown %

  let peakValue = capital;

  data.forEach((day, i) => {
    // Execute signal from PREVIOUS day on today's open
    const signal = i > 0 ? signals[i - 1] : null;
    const execPrice = day.open;

    if (signal === 'BUY' && !inTrade && cash > execPrice) {
      // Buy as many whole shares as possible
      const affordableShares = Math.floor((cash - commission) / execPrice);
      if (affordableShares > 0) {
        shares     = affordableShares;
        cash      -= shares * execPrice + commission;
        inTrade    = true;
        entryPrice = execPrice;
        entryDate  = day.date;
      }
    } else if (signal === 'SELL' && inTrade && shares > 0) {
      // Sell entire position
      const proceeds = shares * execPrice - commission;
      const pnl      = proceeds - (shares * entryPrice);
      const pnlPct   = (pnl / (shares * entryPrice)) * 100;

      trades.push({
        entryDate,
        entryPrice,
        exitDate:  day.date,
        exitPrice: execPrice,
        shares,
        pnl:       +pnl.toFixed(2),
        pnlPct:    +pnlPct.toFixed(2),
        win:       pnl > 0,
      });

      cash    += proceeds;
      shares   = 0;
      inTrade  = false;
    }

    // Portfolio value = cash + current market value of position
    const portfolioValue = cash + shares * day.close;
    equityCurve.push(portfolioValue);

    // Track peak for drawdown
    if (portfolioValue > peakValue) peakValue = portfolioValue;
    drawdowns.push(((portfolioValue - peakValue) / peakValue) * 100);
  });

  // Close any open position at last price
  if (inTrade && shares > 0) {
    const lastPrice = data[data.length - 1].close;
    const proceeds  = shares * lastPrice - commission;
    const pnl       = proceeds - shares * entryPrice;
    const pnlPct    = (pnl / (shares * entryPrice)) * 100;
    trades.push({
      entryDate,
      entryPrice,
      exitDate:  data[data.length - 1].date,
      exitPrice: lastPrice,
      shares,
      pnl:       +pnl.toFixed(2),
      pnlPct:    +pnlPct.toFixed(2),
      win:       pnl > 0,
      open:      true,
    });
  }

  // ── Buy & Hold benchmark ─────────────────────────────────────────
  const bhShares   = Math.floor(capital / data[0].open);
  const bhCurve    = data.map(d => bhShares * d.close + (capital - bhShares * data[0].open));

  // ── Performance metrics ──────────────────────────────────────────
  const finalValue   = equityCurve[equityCurve.length - 1];
  const totalReturn  = ((finalValue - capital) / capital) * 100;
  const bhReturn     = ((bhCurve[bhCurve.length - 1] - capital) / capital) * 100;

  const maxDrawdown  = Math.min(...drawdowns);

  const wins         = trades.filter(t => t.win).length;
  const winRate      = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  // Daily returns for Sharpe
  const dailyReturns = equityCurve.slice(1).map((v, i) =>
    (v - equityCurve[i]) / equityCurve[i]
  );

  const meanReturn = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
  const stdReturn  = Math.sqrt(
    dailyReturns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / dailyReturns.length
  );

  const RF_DAILY   = 0.053 / 252;
  const sharpe     = stdReturn > 0
    ? ((meanReturn - RF_DAILY) / stdReturn) * Math.sqrt(252)
    : 0;

  // Monthly returns
  const monthlyReturns = computeMonthlyReturns(data, equityCurve);

  return {
    equityCurve,
    bhCurve,
    drawdowns,
    trades,
    monthlyReturns,
    metrics: {
      finalValue:  +finalValue.toFixed(2),
      totalReturn: +totalReturn.toFixed(2),
      bhReturn:    +bhReturn.toFixed(2),
      maxDrawdown: +maxDrawdown.toFixed(2),
      winRate:     +winRate.toFixed(1),
      sharpe:      +sharpe.toFixed(2),
      numTrades:   trades.length,
      numWins:     wins,
    },
  };
}

/**
 * Compute strategy monthly return by calendar month.
 *
 * @param {DayData[]} data
 * @param {number[]}  equityCurve
 * @returns {{ label: string, return: number }[]}
 */
function computeMonthlyReturns(data, equityCurve) {
  const months = {};

  data.forEach((day, i) => {
    const key = day.date.substring(0, 7); // "YYYY-MM"
    if (!months[key]) months[key] = { start: equityCurve[i], end: equityCurve[i] };
    months[key].end = equityCurve[i];
  });

  return Object.entries(months).map(([key, { start, end }]) => ({
    label:  key,
    return: +((end - start) / start * 100).toFixed(2),
  }));
}
