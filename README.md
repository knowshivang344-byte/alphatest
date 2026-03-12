# AlphaTest — Trading Strategy Backtester

> A fully browser-based backtesting engine that lets you test trading strategies on simulated stock price data. See exactly when your strategy would have bought and sold, how much profit it made, and how it compared to simply holding the stock.

![Status](https://img.shields.io/badge/Status-Active-22c55e?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4-ff6384?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## What it does

AlphaTest simulates what would have happened if you ran a trading strategy on a stock over the past 1–5 years. It shows you:

- **Every trade** the strategy made — entry price, exit price, profit/loss
- **Equity curve** — how your portfolio value grew (or fell) over time vs. just buying and holding
- **Buy/Sell signals** plotted directly on the price chart
- **Key metrics** — total return, win rate, Sharpe ratio, max drawdown

---

## Strategies

| Strategy | Idea |
|----------|------|
| **SMA Crossover** | Buy when the fast moving average crosses above the slow one (Golden Cross). Sell on Death Cross. |
| **RSI Reversal** | Buy when RSI drops below 30 (oversold / too cheap). Sell when RSI rises above 70 (overbought). |
| **Bollinger Bands** | Buy when price bounces off the lower band (unusually cheap). Sell when it touches the upper band. |
| **MACD Signal** | Buy when the MACD line crosses above the signal line (momentum turning positive). Sell when it crosses below. |

---

## Performance Metrics

| Metric | What it means |
|--------|---------------|
| **Total Return** | % gain or loss over the backtest period |
| **Final Value** | Portfolio value at the end |
| **Win Rate** | % of trades that were profitable |
| **Sharpe Ratio** | Return per unit of risk (>1.0 is good) |
| **Max Drawdown** | Largest % drop from a portfolio peak |
| **vs Buy & Hold** | Did the strategy beat simply holding the stock? |

---

## Project Structure

```
alphatest/
├── index.html              # App layout — sidebar + charts
├── assets/
│   ├── css/
│   │   └── styles.css      # Full stylesheet
│   └── js/
│       ├── data.js         # GBM price data generator
│       ├── indicators.js   # SMA, EMA, RSI, Bollinger, MACD
│       ├── strategies.js   # Signal generators for each strategy
│       ├── engine.js       # Backtesting engine + metrics
│       ├── charts.js       # 5 Chart.js visualizations
│       ├── ui.js           # DOM updates, KPI cards, trade table
│       └── app.js          # Entry point
└── README.md
```

---

## How to Run

```bash
git clone https://github.com/yourusername/alphatest.git
cd alphatest
open index.html   # or just drag into a browser
```

No install, no build step, no backend.

---

## Technical Indicators Implemented

All indicators are implemented from scratch:

- **SMA** — Simple Moving Average
- **EMA** — Exponential Moving Average (with Wilder's smoothing for RSI)
- **RSI** — Relative Strength Index
- **Bollinger Bands** — SMA ± k·σ (standard deviation bands)
- **MACD** — EMA(fast) − EMA(slow) with signal line

---

## Backtesting Rules

- Signals execute on the **open of the next day** (realistic — no look-ahead bias)
- Each BUY uses **all available cash** (fully invested)
- Each SELL **closes the entire position**
- **Commission** is deducted on every trade (configurable)
- Open positions at end of period are **closed at last price**

---

## Stack

- **Vanilla JavaScript (ES6+)** — modular, no frameworks
- **Chart.js 4.4** — 5 chart types: line, bar, scatter
- **CSS Custom Properties** — dark theme design system
- **Google Fonts** — Space Grotesk + JetBrains Mono

---

## Disclaimer

Price data is simulated using Geometric Brownian Motion calibrated to historical parameters. This tool is for **educational purposes only** and does not constitute financial advice.

---

*Built to demonstrate applied algorithmic trading, technical analysis, and financial data visualization.*
