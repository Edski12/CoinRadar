import { getAllTickers, getKlines } from '../shared/api.js';
import { MARKET_CONFIG } from '../shared/config.js';
import { changeClass, formatCurrency, formatNumber, formatPercent } from '../shared/format.js';

const tableBody = document.getElementById('coinsTableBody');
const searchInput = document.getElementById('coinSearch');
const chartInstances = {};
let allCoins = [];

async function fetchChartData(symbol) {
    const klines = await getKlines(symbol, '1h', 24);
    return klines.map(item => ({
        time: new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' }),
        close: item.close
    }));
}

async function renderCharts(symbols) {
    for (const symbol of symbols) {
        try {
            const chartData = await fetchChartData(symbol);
            const canvas = document.getElementById(`chart-${symbol}`);
            if (!canvas) continue;

            const closes = chartData.map(item => item.close);
            const minPrice = Math.min(...closes);
            const maxPrice = Math.max(...closes);
            const isPositive = closes[closes.length - 1] >= closes[0];

            chartInstances[symbol]?.destroy();
            chartInstances[symbol] = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: chartData.map(item => item.time),
                    datasets: [{
                        label: symbol,
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
            // A tiny sparkline should never block the main table.
        }
    }
}

function renderCoins(list) {
    if (!list.length) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No matching coins found.</td></tr>';
        return;
    }

    tableBody.innerHTML = list.slice(0, 80).map(item => `
        <tr class="coin-row" data-symbol="${item.symbol}">
            <td><strong>${item.symbol}</strong></td>
            <td>${formatCurrency(item.lastPrice)}</td>
            <td class="d-none d-md-table-cell ${changeClass(item.priceChangePercent)}">${formatPercent(item.priceChangePercent)}</td>
            <td class="d-none d-md-table-cell">${formatNumber(item.volume)}</td>
            <td class="sparkline-cell"><canvas id="chart-${item.symbol}" height="30"></canvas></td>
        </tr>
    `).join('');

    tableBody.querySelectorAll('.coin-row').forEach(row => {
        row.addEventListener('click', event => {
            if (event.target.closest('canvas')) return;
            window.location.href = `coin-details.html?symbol=${encodeURIComponent(row.dataset.symbol)}`;
        });
    });

    renderCharts(list.slice(0, 20).map(item => item.symbol));
}

async function loadCoins() {
    try {
        allCoins = await getAllTickers();
        renderCoins(allCoins);
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load Binance data.</td></tr>';
    }
}

searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    renderCoins(allCoins.filter(item => item.symbol.toLowerCase().includes(query)));
});

loadCoins();
setInterval(loadCoins, MARKET_CONFIG.refreshMs);
