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
const pagination = document.getElementById("coinsPagination");
const pageList = document.getElementById("coinsPageList");
const coinsTable = document.getElementById("coinsTable");
const loadError = document.getElementById("coinsLoadError");
const pageSize = 80;
const chartInstances = {};
let allCoins = [];
let movementSort = null;
let renderVersion = 0;
let currentPage = 1;
let totalPages = 0;

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

function renderPagination() {
  pagination.hidden = totalPages === 0;
  const arrow = (page, label, symbol, disabled) => `
    <li class="page-item${disabled ? " disabled" : ""}">
      <button type="button" class="page-link" data-page="${page}" aria-label="${label}"${disabled ? " disabled" : ""}>
        <span aria-hidden="true">${symbol}</span>
      </button>
    </li>`;
  const numbers = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    const active = page === currentPage;
    return `<li class="page-item${active ? " active" : ""}">
      <button type="button" class="page-link" data-page="${page}" aria-label="Page ${page}"${active ? ' aria-current="page"' : ""}>${page}</button>
    </li>`;
  }).join("");
  const markup = arrow(currentPage - 1, "Previous page", "&lsaquo;", currentPage <= 1)
    + numbers + arrow(currentPage + 1, "Next page", "&rsaquo;", currentPage >= totalPages);
  // Keep keyboard focus intact when a price refresh leaves the pages unchanged.
  if (pageList.dataset.markup !== markup) {
    pageList.innerHTML = markup;
    pageList.dataset.markup = markup;
  }
}

function renderCoins(list) {
  const version = ++renderVersion;
  Object.keys(chartInstances).forEach((symbol) => {
    chartInstances[symbol].destroy();
    delete chartInstances[symbol];
  });
  totalPages = Math.ceil(list.length / pageSize);
  currentPage = Math.min(currentPage, Math.max(1, totalPages));
  const start = (currentPage - 1) * pageSize;
  const displayedCoins = list.slice(start, start + pageSize);
  renderPagination();
  if (!list.length) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted">No matching coins found.</td></tr>';
    return;
  }

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
  // Rank all matching coins before selecting the current page.
  renderCoins(coins);
}

async function loadCoins() {
  try {
    allCoins = await getAllTickers();
    loadError.hidden = true;
    renderFilteredCoins();
  } catch (error) {
    loadError.textContent = allCoins.length
      ? "Unable to refresh Binance data. Showing the last loaded prices."
      : "Failed to load Binance data. Retrying automatically.";
    loadError.hidden = false;
    if (!allCoins.length) {
      renderCoins([]);
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No coin data available.</td></tr>';
    }
  }
}

searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderFilteredCoins();
});

function changePage(page) {
  if (!Number.isInteger(page) || page < 1 || page > totalPages || page === currentPage) return;
  currentPage = page;
  renderFilteredCoins();
  coinsTable.scrollIntoView({ block: "start" });
  coinsTable.focus({ preventScroll: true });
}

pageList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-page]");
  if (button && !button.disabled) changePage(Number(button.dataset.page));
});

changeSortButton.addEventListener("click", () => {
  currentPage = 1;
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
