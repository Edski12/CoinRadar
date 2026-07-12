import { getAllTickers, getKlines } from '../shared/api.js';
import { MARKET_CONFIG } from '../shared/config.js';
import { changeClass, formatCurrency, formatPercent } from '../shared/format.js';
import { readWatchlist, removeHolding, upsertHolding } from '../shared/storage.js';

const tableBody = document.getElementById('watchlistTableBody');
const totalValueEl = document.getElementById('totalValue');
const coinListEl = document.getElementById('modalCoinList');
const searchInput = document.getElementById('modalCoinSearch');
const selectedCoinLabel = document.getElementById('selectedCoinLabel');
const coinAmountInput = document.getElementById('coinAmountInput');
const confirmAddBtn = document.getElementById('confirmAddCoinBtn');
const chartInstances = {};

let availableCoins = [];
let watchlist = readWatchlist();
let selectedSymbol = null;

async function renderCharts(symbols) {
    for (const symbol of symbols) {
        try {
            const closes = (await getKlines(symbol, '1h', 24)).map(item => item.close);
            const canvas = document.getElementById(`chart-${symbol}`);
            if (!canvas) continue;

            const minPrice = Math.min(...closes);
            const maxPrice = Math.max(...closes);
            const isPositive = closes[closes.length - 1] >= closes[0];

            chartInstances[symbol]?.destroy();
            chartInstances[symbol] = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: closes.map((_, index) => index),
                    datasets: [{
                        data: closes,
                        borderColor: isPositive ? '#16a34a' : '#dc2626',
                        borderWidth: 2,
                        fill: true,
                        backgroundColor: isPositive ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        tension: 0.3,
                        pointRadius: 0,
                        pointHoverRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { min: minPrice * 0.999, max: maxPrice * 1.001, display: false },
                        x: { display: false }
                    }
                }
            });
        } catch (error) {
            // Keep portfolio values visible even if a sparkline fails.
        }
    }
}

function renderModalCoinList(filter = '') {
    const query = filter.trim().toLowerCase();
    const filtered = availableCoins.filter(item => item.symbol.toLowerCase().includes(query)).slice(0, 60);

    if (!filtered.length) {
        coinListEl.innerHTML = '<div class="text-center text-muted py-3">No coins match your search.</div>';
        return;
    }

    coinListEl.innerHTML = filtered.map(coin => `
        <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center modal-coin-item" data-symbol="${coin.symbol}">
            <span>${coin.symbol}</span>
            <span class="text-muted small">${formatCurrency(coin.lastPrice)} <span class="${changeClass(coin.priceChangePercent)}">${formatPercent(coin.priceChangePercent)}</span></span>
        </button>
    `).join('');

    coinListEl.querySelectorAll('.modal-coin-item').forEach(button => {
        button.addEventListener('click', () => selectCoinForAdd(button.dataset.symbol));
    });
}

function selectCoinForAdd(symbol) {
    selectedSymbol = symbol;
    selectedCoinLabel.textContent = symbol;
    document.getElementById('coinSelectStep').classList.add('d-none');
    document.getElementById('amountStep').classList.remove('d-none');
    confirmAddBtn.classList.remove('d-none');
    coinAmountInput.value = '';
    coinAmountInput.focus();
}

function resetModalToSearch() {
    selectedSymbol = null;
    document.getElementById('amountStep').classList.add('d-none');
    document.getElementById('coinSelectStep').classList.remove('d-none');
    confirmAddBtn.classList.add('d-none');
    searchInput.value = '';
    renderModalCoinList('');
}

function renderWatchlistTable() {
    if (!watchlist.length) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Your watchlist is empty. Click "+ Add Coin" to get started.</td></tr>';
        totalValueEl.textContent = '$0.00';
        return;
    }

    const tickerMap = new Map(availableCoins.map(item => [item.symbol, item]));
    let totalValue = 0;

    tableBody.innerHTML = watchlist.map(item => {
        const ticker = tickerMap.get(item.symbol);
        const price = ticker ? Number(ticker.lastPrice) : 0;
        const value = price * Number(item.amount || 0);
        totalValue += value;

        return `
            <tr class="coin-row" data-symbol="${item.symbol}">
                <td><strong>${item.symbol}</strong></td>
                <td>${item.amount}</td>
                <td class="d-none d-md-table-cell">${formatCurrency(price)}</td>
                <td>${formatCurrency(value)}</td>
                <td class="d-none d-md-table-cell ${changeClass(ticker?.priceChangePercent)}">${ticker ? formatPercent(ticker.priceChangePercent) : '-'}</td>
                <td class="d-none d-md-table-cell sparkline-cell"><canvas id="chart-${item.symbol}" height="30"></canvas></td>
                <td><button type="button" class="btn btn-sm btn-outline-danger remove-coin-btn" data-symbol="${item.symbol}" title="Remove">&times;</button></td>
            </tr>
        `;
    }).join('');

    totalValueEl.textContent = formatCurrency(totalValue);

    tableBody.querySelectorAll('.remove-coin-btn').forEach(button => {
        button.addEventListener('click', event => {
            event.stopPropagation();
            watchlist = removeHolding(watchlist, button.dataset.symbol);
            renderWatchlistTable();
        });
    });

    tableBody.querySelectorAll('.coin-row').forEach(row => {
        row.addEventListener('click', event => {
            if (event.target.closest('canvas') || event.target.closest('.remove-coin-btn')) return;
            window.location.href = `coin-details.html?symbol=${encodeURIComponent(row.dataset.symbol)}`;
        });
    });

    renderCharts(watchlist.map(item => item.symbol));
}

async function refreshAll() {
    try {
        availableCoins = await getAllTickers();
        renderWatchlistTable();
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Unable to load watchlist prices.</td></tr>';
    }
}

document.getElementById('backToSearchBtn').addEventListener('click', resetModalToSearch);
searchInput.addEventListener('input', () => renderModalCoinList(searchInput.value));
confirmAddBtn.addEventListener('click', () => {
    const amount = parseFloat(coinAmountInput.value);
    if (!selectedSymbol || !Number.isFinite(amount) || amount < 0) return;

    watchlist = upsertHolding(watchlist, selectedSymbol, amount);
    renderWatchlistTable();

    const modal = bootstrap.Modal.getInstance(document.getElementById('addCoinModal'));
    modal?.hide();
});

document.getElementById('addCoinModal').addEventListener('show.bs.modal', async () => {
    resetModalToSearch();
    if (!availableCoins.length) {
        availableCoins = await getAllTickers();
        renderModalCoinList('');
    }
});

refreshAll();
setInterval(refreshAll, MARKET_CONFIG.refreshMs);