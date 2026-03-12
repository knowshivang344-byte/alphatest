/**
 * data.js — Simulated stock price generator
 *
 * Generates realistic OHLCV price data using Geometric Brownian Motion
 * calibrated to each stock's historical characteristics.
 */

// Stock parameters: [annualReturn, annualVolatility, startPrice]
const STOCK_CONFIG = {
  AAPL:  { mu: 0.18, sigma: 0.28, price: 150 },
  MSFT:  { mu: 0.20, sigma: 0.25, price: 280 },
  GOOGL: { mu: 0.16, sigma: 0.30, price: 120 },
  AMZN:  { mu: 0.15, sigma: 0.32, price: 130 },
  NVDA:  { mu: 0.40, sigma: 0.55, price: 200 },
  JPM:   { mu: 0.12, sigma: 0.22, price: 140 },
  TSLA:  { mu: 0.10, sigma: 0.65, price: 200 },
  META:  { mu: 0.22, sigma: 0.38, price: 280 },
};

/**
 * Box-Muller transform — generates a standard normal random variate.
 * @returns {number} N(0,1)
 */
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Generate daily OHLCV price data for a given stock and time period.
 *
 * Uses Geometric Brownian Motion:
 *   S(t+1) = S(t) · exp((μ − σ²/2)·Δt + σ·√Δt·Z)
 *
 * @param {string} ticker  — stock symbol (key in STOCK_CONFIG)
 * @param {number} years   — number of years of data to generate
 * @returns {DayData[]}    — array of { date, open, high, low, close, volume }
 */
function generatePriceData(ticker, years) {
  const config = STOCK_CONFIG[ticker] || { mu: 0.10, sigma: 0.25, price: 100 };
  const { mu, sigma, price: startPrice } = config;

  const totalDays = Math.floor(years * 252);
  const dt        = 1 / 252;
  const drift     = (mu - 0.5 * sigma * sigma) * dt;
  const diffusion = sigma * Math.sqrt(dt);

  const data  = [];
  let   price = startPrice;

  // Start date = today minus `years` years
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - years);

  // Walk forward, skipping weekends
  let current = new Date(startDate);
  let dayCount = 0;

  while (dayCount < totalDays) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      // GBM step
      const logReturn = drift + diffusion * randn();
      const close     = price * Math.exp(logReturn);

      // Intraday range simulation
      const range  = close * sigma * 0.4 * Math.random();
      const open   = price * (1 + (Math.random() - 0.5) * 0.005);
      const high   = Math.max(open, close) + range * Math.random();
      const low    = Math.min(open, close) - range * Math.random();
      const volume = Math.floor(1e7 + Math.random() * 5e7);

      data.push({
        date:   current.toISOString().split('T')[0],
        open:   +open.toFixed(2),
        high:   +high.toFixed(2),
        low:    +Math.max(low, 0.01).toFixed(2),
        close:  +close.toFixed(2),
        volume,
      });

      price = close;
      dayCount++;
    }
    current.setDate(current.getDate() + 1);
  }

  return data;
}
