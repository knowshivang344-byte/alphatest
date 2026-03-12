/**
 * indicators.js — Technical indicator calculations
 *
 * All indicators operate on arrays of closing prices.
 * They return arrays of the same length, padded with null
 * for the warmup period where the indicator is undefined.
 */

/**
 * Simple Moving Average (SMA)
 *
 * SMA(t) = average of closes over the last `period` days
 *
 * @param {number[]} closes
 * @param {number}   period
 * @returns {(number|null)[]}
 */
function calcSMA(closes, period) {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / period;
  });
}

/**
 * Exponential Moving Average (EMA)
 *
 * EMA(t) = close(t) · k + EMA(t-1) · (1 − k)
 * where k = 2 / (period + 1)
 *
 * @param {number[]} closes
 * @param {number}   period
 * @returns {(number|null)[]}
 */
function calcEMA(closes, period) {
  const k   = 2 / (period + 1);
  const ema = new Array(closes.length).fill(null);

  // Seed with SMA of first `period` values
  if (closes.length < period) return ema;
  ema[period - 1] = closes.slice(0, period).reduce((s, v) => s + v, 0) / period;

  for (let i = period; i < closes.length; i++) {
    ema[i] = closes[i] * k + ema[i - 1] * (1 - k);
  }

  return ema;
}

/**
 * Relative Strength Index (RSI)
 *
 * RSI(t) = 100 − 100 / (1 + RS)
 * RS = avg gain / avg loss over `period` days
 *
 * @param {number[]} closes
 * @param {number}   period  — typically 14
 * @returns {(number|null)[]}
 */
function calcRSI(closes, period) {
  const rsi = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return rsi;

  // Compute daily changes
  const changes = closes.slice(1).map((c, i) => c - closes[i]);

  // Initial avg gain / loss over first `period` changes
  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else                avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs0  = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = 100 - 100 / (1 + rs0);

  // Smoothed RSI (Wilder's method)
  for (let i = period + 1; i < closes.length; i++) {
    const change = changes[i - 1];
    const gain   = change > 0 ? change : 0;
    const loss   = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i]   = 100 - 100 / (1 + rs);
  }

  return rsi;
}

/**
 * Bollinger Bands
 *
 * Middle = SMA(period)
 * Upper  = Middle + k·σ
 * Lower  = Middle − k·σ
 *
 * @param {number[]} closes
 * @param {number}   period  — typically 20
 * @param {number}   k       — std dev multiplier, typically 2
 * @returns {{ upper, middle, lower }} — each an array of (number|null)
 */
function calcBollingerBands(closes, period, k = 2) {
  const middle = calcSMA(closes, period);
  const upper  = new Array(closes.length).fill(null);
  const lower  = new Array(closes.length).fill(null);

  closes.forEach((_, i) => {
    if (i < period - 1) return;
    const slice  = closes.slice(i - period + 1, i + 1);
    const mean   = middle[i];
    const stdDev = Math.sqrt(
      slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period
    );
    upper[i] = mean + k * stdDev;
    lower[i] = mean - k * stdDev;
  });

  return { upper, middle, lower };
}

/**
 * MACD — Moving Average Convergence Divergence
 *
 * MACD line  = EMA(fast) − EMA(slow)
 * Signal     = EMA(MACD line, signal period)
 * Histogram  = MACD − Signal
 *
 * @param {number[]} closes
 * @param {number}   fast    — typically 12
 * @param {number}   slow    — typically 26
 * @param {number}   signal  — typically 9
 * @returns {{ macd, signal, histogram }}
 */
function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);

  const macdLine = closes.map((_, i) => {
    if (emaFast[i] === null || emaSlow[i] === null) return null;
    return emaFast[i] - emaSlow[i];
  });

  // EMA of MACD line (signal line)
  const macdValues    = macdLine.filter(v => v !== null);
  const macdStartIdx  = macdLine.findIndex(v => v !== null);
  const signalRaw     = calcEMA(macdValues, signal);

  const signalLine = new Array(closes.length).fill(null);
  signalRaw.forEach((v, i) => {
    signalLine[macdStartIdx + i] = v;
  });

  const histogram = closes.map((_, i) => {
    if (macdLine[i] === null || signalLine[i] === null) return null;
    return macdLine[i] - signalLine[i];
  });

  return { macd: macdLine, signal: signalLine, histogram };
}
