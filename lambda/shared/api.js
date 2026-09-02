const { normalizeSymbol } = require('./format');

const BINANCE_BASE_URL = process.env.BINANCE_BASE_URL || 'https://api.binance.com/api/v3';
const CRYPTO_NEWS_BASE_URL = 'https://cryptocurrency.cv/api';
const COINGECKO_BASE_URL = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
}

function withQuery(path, params = {}) {
    const url = new URL(`${CRYPTO_NEWS_BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    });
    return url.toString();
}

async function cryptoNewsRequest(path, params = {}) {
    return requestJson(withQuery(path, params));
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

function unwrapItems(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.news)) return data.news;
    if (Array.isArray(data?.articles)) return data.articles;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function timestampFrom(item) {
    const value = item.publishedAt || item.published_at || item.published || item.date || item.createdAt || item.time;
    if (!value) return new Date().toISOString();
    if (typeof value === 'number') return new Date(value > 100000000000 ? value : value * 1000).toISOString();
    return new Date(value).toString() === 'Invalid Date' ? new Date().toISOString() : new Date(value).toISOString();
}

function normalizeNewsItem(item, symbols = []) {
    const title = item.title || item.headline || item.name || '';
    const body = item.description || item.summary || item.body || item.content || '';
    const symbol = item.symbol || item.asset || matchTrackedSymbol(`${title} ${body}`, symbols) || classifyAsset(`${title} ${body}`);

    return {
        id: String(item.id || item.guid || item.slug || item.url || title),
        title,
        summary: body,
        url: item.url || item.link || '#',
        source: item.source?.name || item.source || item.publisher || 'cryptocurrency.cv',
        symbol,
        severity: item.severity || severityFromSentiment(item.sentiment) || classifySeverity(`${title} ${body}`),
        sentiment: item.sentiment || item.sentimentLabel || item.score || null,
        publishedAt: timestampFrom(item)
    };
}

function normalizeNewsResponse(data, symbols = []) {
    return {
        source: 'cryptocurrency.cv',
        items: unwrapItems(data).map(item => normalizeNewsItem(item, symbols))
    };
}

async function getLatestNews(options = {}) {
    const data = await cryptoNewsRequest('/news', {
        limit: options.limit,
        source: options.source,
        page: options.page
    });
    return normalizeNewsResponse(data, options.symbols || []);
}

async function getBreakingNews(options = {}) {
    const data = await cryptoNewsRequest('/breaking', { limit: options.limit });
    return normalizeNewsResponse(data, options.symbols || []);
}

async function searchNews(query, options = {}) {
    if (!query) return { source: 'cryptocurrency.cv', items: [] };
    const data = await cryptoNewsRequest('/search', { q: query, limit: options.limit, page: options.page });
    return normalizeNewsResponse(data, options.symbols || [query]);
}

async function getTrendingTopics() {
    try {
        const data = await requestJson(`${COINGECKO_BASE_URL}/search/trending`);
        const trending = (Array.isArray(data?.coins) ? data.coins : [])
            .map(entry => entry?.item)
            .filter(Boolean)
            .slice(0, 8)
            .map(item => ({
                id: item.id,
                name: item.name,
                symbol: String(item.symbol || '').toUpperCase(),
                marketCapRank: item.market_cap_rank ?? null,
                score: item.score ?? null
            }));

        if (trending.length) {
            return {
                source: 'coingecko',
                timeWindow: '24h',
                trending
            };
        }
    } catch (error) {
        // Fall through to the existing news provider when CoinGecko is
        // unavailable or temporarily rate limited.
    }

    return cryptoNewsRequest('/trending');
}

async function getFearGreedIndex() {
    return cryptoNewsRequest('/fear-greed');
}

async function getSentiment() {
    return cryptoNewsRequest('/sentiment');
}

async function askCryptoNews(question) {
    if (!question) return null;
    return cryptoNewsRequest('/ask', { q: question });
}

function matchTrackedSymbol(text, symbols = []) {
    const upper = String(text || '').toUpperCase();
    return symbols
        .map(symbol => normalizeSymbol(symbol).replace('USDT', ''))
        .find(symbol => upper.includes(symbol));
}

function severityFromSentiment(sentiment) {
    if (sentiment === undefined || sentiment === null) return null;
    const raw = typeof sentiment === 'object'
        ? sentiment.label || sentiment.sentiment || sentiment.score
        : sentiment;
    const value = String(raw).toLowerCase();

    if (value.includes('very negative') || value.includes('bearish') || Number(raw) <= -0.5) return 'high';
    if (value.includes('negative') || Number(raw) < 0) return 'medium';
    return null;
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
    askCryptoNews,
    getBreakingNews,
    getFearGreedIndex,
    getLatestNews,
    getSentiment,
    getTrendingTopics,
    getTicker,
    getTickersForHoldings,
    searchNews,
    classifySeverity
};
