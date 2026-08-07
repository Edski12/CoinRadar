import { getKlines, getTicker } from "../shared/api.js";
import { MARKET_CONFIG } from "../shared/config.js";
import { formatCurrency, formatPercent } from "../shared/format.js";

const params = new URLSearchParams(window.location.search);
const symbol = params.get("symbol") || "BTCUSDT";
const title = document.getElementById("coinTitle");
const priceText = document.getElementById("coinPrice");
const timeframeButtons = document.querySelectorAll(".timeframe-btn");
const toolButtons = document.querySelectorAll(".tool-btn");
let currentInterval = "1m";

const chart = klinecharts.init("priceChart");
chart.setStyles({
  candle: {
    bar: {
      upColor: "#16a34a",
      downColor: "#dc2626",
      upBorderColor: "#16a34a",
      downBorderColor: "#dc2626",
      upWickColor: "#16a34a",
      downWickColor: "#dc2626",
    },
  },
});

async function fetchChartData(interval = "1m") {
  return getKlines(symbol, interval, 1000);
}

async function loadCoinData() {
  try {
    const [ticker, klines] = await Promise.all([
      getTicker(symbol),
      fetchChartData(currentInterval),
    ]);

    title.textContent = symbol;
    priceText.textContent = `${formatCurrency(ticker.lastPrice)} - ${formatPercent(ticker.priceChangePercent)} (24h)`;
    chart.applyNewData(klines);
    chart.resize();
  } catch (error) {
    title.textContent = symbol;
    priceText.textContent = "Unable to load chart data.";
  }
}

timeframeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    currentInterval = button.dataset.interval;
    timeframeButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    chart.applyNewData(await fetchChartData(currentInterval));
    chart.resize();
  });
});

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tool = button.dataset.tool;

    if (tool === "clear") {
      chart.removeOverlay();
      return;
    }

    toolButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (tool !== "cursor") chart.createOverlay(tool);
  });
});

document.getElementById("backButton").addEventListener("click", (event) => {
  event.preventDefault();
  if (document.referrer) {
    window.history.back();
  } else {
    window.location.href = "coins.php";
  }
});

window.addEventListener("resize", () => chart.resize());
screen.orientation?.addEventListener?.("change", () =>
  setTimeout(() => chart.resize(), 150),
);

loadCoinData();
setInterval(loadCoinData, MARKET_CONFIG.chartRefreshMs);
