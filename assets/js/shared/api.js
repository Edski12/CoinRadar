import { MARKET_CONFIG } from './config.js';
import { normalizeSymbol } from './format.js';

const CRYPTO_NEWS_API_BASE_URL = 'https://cryptocurrency.cv/api';

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
}

function buildBackendNewsUrl(feed, params = {}) {
    const url = new URL(`${MARKET_CONFIG.backendBaseUrl}/news`);
    if (feed) url.searchParams.set('feed', feed);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
        }
    });
    return url.toString();
}

async function requestNews(feed, params = {}, fallback = {}) {
    try {
        return await requestJson(buildBackendNewsUrl(feed, params));
    } catch (error) {
        return {
            source: 'local-fallback',
            error: error.message,
            ...fallback
        };
    }
}

export async function getAllTickers() {
    const data = await requestJson(`${MARKET_CONFIG.binanceBaseUrl}/ticker/24hr`);
    return data
        .filter(item => item.symbol.endsWith(MARKET_CONFIG.stableQuote))
        .filter(item => !item.symbol.includes('UP') && !item.symbol.includes('DOWN'))
        .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume));
}

export async function getTicker(symbol) {
    const normalized = normalizeSymbol(symbol, MARKET_CONFIG.stableQuote);
    return requestJson(`${MARKET_CONFIG.binanceBaseUrl}/ticker/24hr?symbol=${encodeURIComponent(normalized)}`);
}

export async function getKlines(symbol, interval = '1h', limit = 24) {
    const normalized = normalizeSymbol(symbol, MARKET_CONFIG.stableQuote);
    const params = new URLSearchParams({ symbol: normalized, interval, limit: String(limit) });
    const data = await requestJson(`${MARKET_CONFIG.binanceBaseUrl}/klines?${params}`);

    return data.map(item => ({
        timestamp: item[0],
        open: Number(item[1]),
        high: Number(item[2]),
        low: Number(item[3]),
        close: Number(item[4]),
        volume: Number(item[5])
    }));
}

export async function getMarketPulse(symbols = MARKET_CONFIG.defaultSymbols) {
    const tickers = await Promise.all(symbols.map(symbol => getTicker(symbol)));
    return tickers.map(item => ({
        symbol: item.symbol,
        price: Number(item.lastPrice),
        changePercent: Number(item.priceChangePercent),
        quoteVolume: Number(item.quoteVolume)
    }));
}

export async function getLatestNews(options = {}) {
    return requestNews('', options, { items: fallbackNews() });
}

export async function getBreakingNews(options = {}) {
    return requestNews('breaking', options, { items: [] });
}

export async function searchNews(query, options = {}) {
    return requestNews('search', { ...options, q: query }, { items: [] });
}

export async function getTrendingTopics() {
    return requestNews('trending', {}, { topics: [] });
}

export async function getFearGreedIndex() {
    return requestNews('fear-greed', {}, { index: null });
}

export async function getSentiment() {
    return requestNews('sentiment', {}, { sentiment: null });
}

export async function askCryptoNews(question) {
    return requestNews('ask', { q: question }, { answer: null });
}

export async function getMarketNews(symbols = []) {
    return getLatestNews({ symbols });
}

export async function askCompanion(payload) {
    return requestJson(`${MARKET_CONFIG.backendBaseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

function fallbackNews() {
    return [
        {
            id: 'fallback-provider-unavailable',
            symbol: 'MARKET',
            severity: 'watch',
            title: `cryptocurrency.cv news is configured through CoinRadar's Lambda layer (${CRYPTO_NEWS_API_BASE_URL}), but the backend feed is not reachable right now.`,
            url: '#',
            publishedAt: new Date().toISOString()
        }
    ];
}
