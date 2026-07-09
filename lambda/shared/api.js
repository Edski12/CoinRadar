const { normalizeSymbol } = require('./format');

const BINANCE_BASE_URL = process.env.BINANCE_BASE_URL || 'https://api.binance.com/api/v3';
const NEWS_FEED_URL = process.env.NEWS_FEED_URL || 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN';

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
}

async function getTicker(symbol) {
    const normalized = normalizeSymbol(symbol);
    return requestJson(`${BINANCE_BASE_URL}/ticker/24hr?symbol=${encodeURIComponent(normalized)}`);
}

async function getTickersForHoldings(holdings) {
    const selectedHoldings = Array.isArray(holdings) ? holdings : [];
    return Promise.all(selectedHoldings.map(async holding => {
        try {
            const ticker = await getTicker(holding.symbol);
            return {
                symbol: normalizeSymbol(holding.symbol),
                amount: Number(holding.amount || 0),
                price: Number(ticker.lastPrice),
                changePercent: Number(ticker.priceChangePercent),
                high: Number(ticker.highPrice),
                low: Number(ticker.lowPrice),
                volume: Number(ticker.volume)
            };
        } catch (error) {
            return {
                symbol: normalizeSymbol(holding.symbol),
                amount: Number(holding.amount || 0),
                error: error.message
            };
        }
    }));
}

async function getNewsItems(symbols = []) {
    const data = await requestJson(NEWS_FEED_URL);
    const rawItems = Array.isArray(data.Data) ? data.Data : [];
    const symbolSet = new Set(symbols.map(symbol => normalizeSymbol(symbol).replace('USDT', '')));

    return rawItems.slice(0, 30).map(item => {
        const title = item.title || '';
        const body = item.body || '';
        const matchedSymbol = [...symbolSet].find(symbol => title.includes(symbol) || body.includes(symbol));
        return {
            id: String(item.id || item.guid || item.url),
            title,
            url: item.url,
            source: item.source,
            symbol: matchedSymbol || classifyAsset(title),
            severity: classifySeverity(`${title} ${body}`),
            publishedAt: item.published_on ? new Date(item.published_on * 1000).toISOString() : new Date().toISOString()
        };
    });
}

function classifyAsset(text) {
    const upper = String(text || '').toUpperCase();
    const assets = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE'];
    return assets.find(asset => upper.includes(asset)) || 'MARKET';
}

function classifySeverity(text) {
    const lower = String(text || '').toLowerCase();
    const high = ['ban', 'bans', 'hack', 'exploit', 'lawsuit', 'etf approval', 'sec approves', 'insolvent'];
    const medium = ['regulation', 'restrict', 'outage', 'investigation', 'fine', 'settlement'];

    if (high.some(keyword => lower.includes(keyword))) return 'high';
    if (medium.some(keyword => lower.includes(keyword))) return 'medium';
    return 'low';
}

module.exports = {
    getNewsItems,
    getTicker,
    getTickersForHoldings,
    classifySeverity
};
