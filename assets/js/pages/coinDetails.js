import { getKlines, getTicker } from "../shared/api.js";
import { MARKET_CONFIG } from "../shared/config.js";
import { formatCurrency, formatPercent, normalizeSymbol } from "../shared/format.js";
import { createDrawingStore } from "../shared/drawings.js";
import { createMeasurementOverlay } from "../shared/measurement.js?v=20260905-2";

const params = new URLSearchParams(window.location.search);
const symbol = normalizeSymbol(params.get("symbol") || "BTCUSDT");
const title = document.getElementById("coinTitle");
const priceText = document.getElementById("coinPrice");
const timeframeButtons = document.querySelectorAll(".timeframe-btn");
const toolButtons = document.querySelectorAll(".tool-btn");
let currentInterval = "1m";

// Rectangle is not included among KLineCharts v9's built-in overlays.
klinecharts.registerOverlay({
  name: "rectangle",
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => coordinates.length === 2 ? [{
    type: "rect",
    attrs: {
      x: Math.min(coordinates[0].x, coordinates[1].x),
      y: Math.min(coordinates[0].y, coordinates[1].y),
      width: Math.abs(coordinates[1].x - coordinates[0].x),
      height: Math.abs(coordinates[1].y - coordinates[0].y),
    },
    styles: { style: "stroke" },
  }] : [],
});
klinecharts.registerOverlay(createMeasurementOverlay());

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

const drawingStatus = document.getElementById("drawingStatus");
const retryDrawings = document.getElementById("retryDrawings");
const drawingStore = createDrawingStore({
  chart,
  symbol,
  user: window.COINRADAR_USER,
  csrf: window.COINRADAR_CSRF,
  onStatus(message, retry) {
    drawingStatus.textContent = message;
    retryDrawings.hidden = !retry;
  },
  onReady(ready) {
    toolButtons.forEach((button) => { button.disabled = !ready && button.dataset.tool !== "cursor"; });
  },
});
retryDrawings.addEventListener("click", () => drawingStore.retry());

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
    await drawingStore.load();
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
      drawingStore.clear();
      return;
    }

    toolButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (tool !== "cursor") drawingStore.create(tool);
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
