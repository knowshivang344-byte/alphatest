/**
 * strategies.js — Trading strategy signal generators
 *
 * Each strategy takes price data and parameters,
 * and returns an array of signals: 'BUY', 'SELL', or null.
 *
 * Signal on day i means: "act on the OPEN of day i+1"
 * (realistic — you can't trade on the same candle that triggered the signal)
 */

/**
 * SMA Crossover Strategy
 *
 * Idea: When the short-term average crosses above the long-term average,
 *       the stock is gaining momentum → BUY.
 *       When it crosses below → SELL.
 *
 * BUY  when fastSMA crosses ABOVE slowSMA (Golden Cross)
 * SELL when fastSMA crosses BELOW slowSMA (Death Cross)
 *
 * @param {DayData[]} data
 * @param {{ fast: number, slow: number }} params
 * @returns {SignalResult}
 */
function smaCrossover(data, params) {
  const closes = data.map(d => d.close);
  const fast   = calcSMA(closes, params.fast);
  const slow   = calcSMA(closes, params.slow);

  const signals = closes.map((_, i) => {
    if (i === 0 || fast[i] === null || fast[i-1] === null ||
        slow[i] === null || slow[i-1] === null) return null;

    const crossedAbove = fast[i-1] <= slow[i-1] && fast[i] > slow[i];
    const crossedBelow = fast[i-1] >= slow[i-1] && fast[i] < slow[i];

    if (crossedAbove) return 'BUY';
    if (crossedBelow) return 'SELL';
    return null;
  });

  return {
    signals,
    indicators: { fast, slow },
    indicatorNames: [`SMA ${params.fast}`, `SMA ${params.slow}`],
    indicatorColors: ['#6c63ff', '#f59e0b'],
  };
}

/**
 * RSI Reversal Strategy
 *
 * Idea: RSI measures momentum on a 0–100 scale.
 *       When RSI is very LOW (oversold), the stock has been beaten down
 *       too much and is likely to bounce → BUY.
 *       When RSI is very HIGH (overbought) → SELL.
 *
 * BUY  when RSI crosses above oversold threshold (e.g. 30)
 * SELL when RSI crosses below overbought threshold (e.g. 70)
 *
 * @param {DayData[]} data
 * @param {{ period: number, oversold: number, overbought: number }} params
 * @returns {SignalResult}
 */
function rsiReversal(data, params) {
  const closes = data.map(d => d.close);
  const rsi    = calcRSI(closes, params.period);

  const signals = rsi.map((r, i) => {
    if (i === 0 || r === null || rsi[i-1] === null) return null;

    const crossedAboveOversold    = rsi[i-1] <= params.oversold   && r > params.oversold;
    const crossedBelowOverbought  = rsi[i-1] >= params.overbought && r < params.overbought;

    if (crossedAboveOversold)   return 'BUY';
    if (crossedBelowOverbought) return 'SELL';
    return null;
  });

  return {
    signals,
    indicators: { rsi },
    indicatorNames: [`RSI ${params.period}`],
    indicatorColors: ['#22c55e'],
    overlayLines: [
      { value: params.oversold,   color: 'rgba(34,197,94,0.5)',   label: `Oversold ${params.oversold}` },
      { value: params.overbought, color: 'rgba(239,68,68,0.5)',   label: `Overbought ${params.overbought}` },
    ],
  };
}

/**
 * Bollinger Bands Strategy
 *
 * Idea: Bollinger Bands define a "normal" price range using
 *       standard deviation. Price touching the lower band means
 *       it's unusually cheap → BUY.
 *       Price touching the upper band → SELL.
 *
 * BUY  when price crosses back above lower band
 * SELL when price crosses back below upper band
 *
 * @param {DayData[]} data
 * @param {{ period: number, stdDev: number }} params
 * @returns {SignalResult}
 */
function bollingerBands(data, params) {
  const closes = data.map(d => d.close);
  const bands  = calcBollingerBands(closes, params.period, params.stdDev);
  const { upper, middle, lower } = bands;

  const signals = closes.map((c, i) => {
    if (i === 0 || lower[i] === null || lower[i-1] === null) return null;

    const bouncedOffLower = closes[i-1] <= lower[i-1] && c > lower[i];
    const rejectedAtUpper = closes[i-1] >= upper[i-1] && c < upper[i];

    if (bouncedOffLower) return 'BUY';
    if (rejectedAtUpper) return 'SELL';
    return null;
  });

  return {
    signals,
    indicators: { upper, middle, lower },
    indicatorNames: ['BB Upper', 'BB Middle', 'BB Lower'],
    indicatorColors: ['rgba(108,99,255,0.4)', 'rgba(108,99,255,0.8)', 'rgba(108,99,255,0.4)'],
  };
}

/**
 * MACD Signal Strategy
 *
 * Idea: MACD measures the difference between two EMAs.
 *       When MACD line crosses above the signal line, momentum is
 *       turning positive → BUY.
 *       When it crosses below → SELL.
 *
 * BUY  when MACD crosses above signal line
 * SELL when MACD crosses below signal line
 *
 * @param {DayData[]} data
 * @param {{ fast: number, slow: number, signal: number }} params
 * @returns {SignalResult}
 */
function macdSignal(data, params) {
  const closes      = data.map(d => d.close);
  const macdResult  = calcMACD(closes, params.fast, params.slow, params.signal);
  const { macd, signal: signalLine } = macdResult;

  const signals = closes.map((_, i) => {
    if (i === 0 || macd[i] === null || macd[i-1] === null ||
        signalLine[i] === null || signalLine[i-1] === null) return null;

    const crossedAbove = macd[i-1] <= signalLine[i-1] && macd[i] > signalLine[i];
    const crossedBelow = macd[i-1] >= signalLine[i-1] && macd[i] < signalLine[i];

    if (crossedAbove) return 'BUY';
    if (crossedBelow) return 'SELL';
    return null;
  });

  return {
    signals,
    indicators: { macd, signal: signalLine },
    indicatorNames: [`MACD(${params.fast},${params.slow})`, `Signal(${params.signal})`],
    indicatorColors: ['#6c63ff', '#f59e0b'],
  };
}

// ── Strategy registry ──────────────────────────────────────────────

const STRATEGIES = {
  sma_cross: {
    fn: smaCrossover,
    label: 'SMA Crossover',
    defaultParams: { fast: 20, slow: 50 },
    paramDefs: [
      { key: 'fast', label: 'Fast SMA Period', min: 5,  max: 50,  step: 1 },
      { key: 'slow', label: 'Slow SMA Period', min: 20, max: 200, step: 5 },
    ],
    explain: `<strong>SMA Crossover</strong><br>
      Buy when the fast moving average crosses <em>above</em> the slow one (momentum up).
      Sell when it crosses <em>below</em> (momentum fading).`,
  },
  rsi: {
    fn: rsiReversal,
    label: 'RSI Reversal',
    defaultParams: { period: 14, oversold: 40, overbought: 60 },
    paramDefs: [
      { key: 'period',     label: 'RSI Period',      min: 5,  max: 30, step: 1 },
      { key: 'oversold',   label: 'Oversold Level',  min: 20, max: 50, step: 5 },
      { key: 'overbought', label: 'Overbought Level', min: 50, max: 80, step: 5 },
    ],
    explain: `<strong>RSI Reversal</strong><br>
      RSI below <em>40</em> = stock losing momentum (oversold) → Buy.
      RSI above <em>60</em> = stock overextended (overbought) → Sell.`,
  },
  bollinger: {
    fn: bollingerBands,
    label: 'Bollinger Bands',
    defaultParams: { period: 20, stdDev: 2 },
    paramDefs: [
      { key: 'period', label: 'Period',          min: 10, max: 50,  step: 5   },
      { key: 'stdDev', label: 'Std Dev (k)',      min: 1,  max: 3,   step: 0.5 },
    ],
    explain: `<strong>Bollinger Bands</strong><br>
      Price touching the <em>lower</em> band = unusually cheap → Buy.
      Price touching the <em>upper</em> band = unusually expensive → Sell.`,
  },
  macd: {
    fn: macdSignal,
    label: 'MACD Signal',
    defaultParams: { fast: 12, slow: 26, signal: 9 },
    paramDefs: [
      { key: 'fast',   label: 'Fast EMA',    min: 5,  max: 20, step: 1 },
      { key: 'slow',   label: 'Slow EMA',    min: 15, max: 50, step: 1 },
      { key: 'signal', label: 'Signal EMA',  min: 5,  max: 15, step: 1 },
    ],
    explain: `<strong>MACD Signal</strong><br>
      MACD line crossing <em>above</em> signal = positive momentum → Buy.
      Crossing <em>below</em> = momentum fading → Sell.`,
  },
};
