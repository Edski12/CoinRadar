import { getAllTickers, getKlines } from "../shared/api.js";
import { MARKET_CONFIG } from "../shared/config.js";
import {
  changeClass,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../shared/format.js";

const tableBody = document.getElementById("coinsTableBody");
const searchInput = document.getElementById("coinSearch");
const changeSortButton = document.getElementById("changeSortButton");
const changeSortHeader = document.getElementById("changeSortHeader");
const changeSortIcon = document.getElementById("changeSortIcon");
const chartInstances = {};
let allCoins = [];
let movementSort = null;
let renderVersion = 0;

async function fetchChartData(symbol) {
  const klines = await getKlines(symbol, "1h", 24);
  return klines.map((item) => ({
    time: new Date(item.timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
    }),
    close: item.close,
  }));
}

async function renderCharts(symbols, version) {
  const batchSize = 8;

  for (let index = 0; index < symbols.length; index += batchSize) {
    if (version !== renderVersion) return;
    const batch = symbols.slice(index, index + batchSize);
    await Promise.all(
      batch.map(async (symbol) => {
        try {
          const chartData = await fetchChartData(symbol);
          if (version !== renderVersion) return;
          const canvas = document.getElementById(`chart-${symbol}`);
          if (!canvas) return;

          const closes = chartData.map((item) => item.close);
          const minPrice = Math.min(...closes);
          const maxPrice = Math.max(...closes);
          const isPositive = closes[closes.length - 1] >= closes[0];

          chartInstances[symbol]?.destroy();
          chartInstances[symbol] = new Chart(canvas, {
            type: "line",
            data: {
              labels: chartData.map((item) => item.time),
              datasets: [
                {
                  label: symbol,
                  data: closes,
                  borderColor: isPositive ? "#16a34a" : "#dc2626",
                  borderWidth: 2,
                  fill: true,
                  backgroundColor: isPositive
                    ? "rgba(22, 163, 74, 0.1)"
                    : "rgba(220, 38, 38, 0.1)",
                  tension: 0.3,
                  pointRadius: 0,
                  pointHoverRadius: 0,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  min: minPrice * 0.999,
                  max: maxPrice * 1.001,
                  display: false,
                },
                x: { display: false },
              },
            },
          });
        } catch (error) {
        }
      }),
    );
  }
}

function renderCoins(list) {
  const version = ++renderVersion;
  Object.keys(chartInstances).forEach((symbol) => {
    chartInstances[symbol].destroy();
    delete chartInstances[symbol];
  });
  if (!list.length) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted">No matching coins found.</td></tr>';
    return;
  }

  const displayedCoins = list.slice(0, 80);

  tableBody.innerHTML = displayedCoins
    .map(
      (item) => `
        <tr class="coin-row" data-symbol="${item.symbol}">
            <td><strong>${item.symbol}</strong></td>
            <td>${formatCurrency(item.lastPrice)}</td>
            <td class="${changeClass(item.priceChangePercent)}">${formatPercent(item.priceChangePercent)}</td>
            <td class="d-none d-md-table-cell">${formatNumber(item.volume)}</td>
            <td class="sparkline-cell"><canvas id="chart-${item.symbol}" height="30"></canvas></td>
        </tr>
    `,
    )
    .join("");

  tableBody.querySelectorAll(".coin-row").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("canvas")) return;
      window.location.href = `coin-details.php?symbol=${encodeURIComponent(row.dataset.symbol)}`;
    });
  });

  renderCharts(displayedCoins.map((item) => item.symbol), version);
}

function renderFilteredCoins() {
  const query = searchInput.value.trim().toLowerCase();
  const coins = allCoins.filter((item) => item.symbol.toLowerCase().includes(query));
  if (movementSort) {
    const direction = movementSort === "descending" ? -1 : 1;
    coins.sort((a, b) => {
      const aMovement = Number(a.priceChangePercent);
      const bMovement = Number(b.priceChangePercent);
      // Missing changes stay at the bottom in either direction.
      if (!Number.isFinite(aMovement)) return Number.isFinite(bMovement) ? 1 : a.symbol.localeCompare(b.symbol);
      if (!Number.isFinite(bMovement)) return -1;
      return direction * (aMovement - bMovement) || a.symbol.localeCompare(b.symbol);
    });
  }
  // Rank all matching coins before applying the 80-row display limit.
  renderCoins(coins);
}

async function loadCoins() {
  try {
    allCoins = await getAllTickers();
    renderFilteredCoins();
  } catch (error) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-danger">Failed to load Binance data.</td></tr>';
  }
}

searchInput.addEventListener("input", renderFilteredCoins);

changeSortButton.addEventListener("click", () => {
  movementSort = movementSort === null ? "descending"
    : movementSort === "descending" ? "ascending" : null;
  const label = movementSort === "descending"
    ? "Gainers first. Click for losers first."
    : movementSort === "ascending"
      ? "Losers first. Click for default order."
      : "Default order. Click for gainers first.";
  changeSortHeader.setAttribute("aria-sort", movementSort || "none");
  changeSortIcon.textContent = movementSort === "descending" ? "↓ Gainers"
    : movementSort === "ascending" ? "↑ Losers" : "↕";
  changeSortButton.setAttribute("aria-label", `24h Change: ${label}`);
  changeSortButton.setAttribute("title", label);
  renderFilteredCoins();
});

loadCoins();
setInterval(loadCoins, MARKET_CONFIG.refreshMs);
