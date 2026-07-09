import { getFearGreedIndex, getLatestNews, getMarketPulse, getTrendingTopics } from '../shared/api.js';
import { MARKET_CONFIG } from '../shared/config.js';
import { changeClass, formatCurrency, formatPercent } from '../shared/format.js';

const pulseGrid = document.getElementById('marketPulseGrid');
const newsList = document.getElementById('marketNewsList');
const trendingTopics = document.getElementById('trendingTopics');
const fearGreedValue = document.getElementById('fearGreedValue');

function renderPulse(items) {
    pulseGrid.innerHTML = items.map(item => `
        <div class="col-12 col-sm-6">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start gap-3">
                        <div>
                            <div class="text-muted small">${item.symbol}</div>
                            <div class="h4 mb-0">${formatCurrency(item.price)}</div>
                        </div>
                        <span class="${changeClass(item.changePercent)} fw-semibold">${formatPercent(item.changePercent)}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderTrending(payload) {
    const rawTopics = payload?.topics?.topics || payload?.topics?.items || payload?.topics || [];
    const topics = Array.isArray(rawTopics) ? rawTopics.slice(0, 8) : [];

    trendingTopics.innerHTML = topics.length
        ? topics.map(topic => `<span class="badge text-bg-light">${topic.name || topic.topic || topic.title || topic}</span>`).join('')
        : '<span class="text-muted">No trending topics available.</span>';
}

function renderFearGreed(payload) {
    const index = payload?.index?.value ?? payload?.index?.score ?? payload?.index?.data?.value ?? payload?.index;
    const label = payload?.index?.classification || payload?.index?.label || payload?.index?.data?.classification || '';
    fearGreedValue.textContent = index ? `${index}${label ? ' - ' + label : ''}` : 'Unavailable';
}

function renderNews(items) {
    if (!items.length) {
        newsList.innerHTML = '<div class="text-muted">No major headlines found.</div>';
        return;
    }

    newsList.innerHTML = items.map(item => `
        <a href="${item.url || '#'}" class="list-group-item list-group-item-action" ${item.url && item.url !== '#' ? 'target="_blank" rel="noopener"' : ''}>
            <div class="d-flex justify-content-between gap-3">
                <strong>${item.title}</strong>
                <span class="badge text-bg-light">${item.severity || 'watch'}</span>
            </div>
            <div class="small text-muted mt-1">${item.symbol || 'Market'} ${item.publishedAt ? '&middot; ' + new Date(item.publishedAt).toLocaleString() : ''}</div>
        </a>
    `).join('');
}

async function loadDashboard() {
    try {
        const [pulse, news] = await Promise.all([
            getMarketPulse(MARKET_CONFIG.defaultSymbols),
            getLatestNews({ limit: 12, symbols: MARKET_CONFIG.defaultSymbols })
        ]);
        renderPulse(pulse);
        renderNews(news.items || []);

        Promise.all([getTrendingTopics(), getFearGreedIndex()])
            .then(([trending, fearGreed]) => {
                renderTrending(trending);
                renderFearGreed(fearGreed);
            })
            .catch(() => {
                trendingTopics.innerHTML = '<span class="text-muted">Unavailable</span>';
                fearGreedValue.textContent = 'Unavailable';
            });
    } catch (error) {
        pulseGrid.innerHTML = '<div class="col-12 text-danger">Unable to load market pulse.</div>';
        newsList.innerHTML = '<div class="text-danger">Unable to load news.</div>';
    }
}

loadDashboard();
setInterval(loadDashboard, MARKET_CONFIG.refreshMs);
