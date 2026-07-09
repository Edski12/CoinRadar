import { MARKET_CONFIG } from './config.js';
import { normalizeSymbol } from './format.js';

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
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

export async function getMarketNews(symbols = []) {
    const params = symbols.length ? `?symbols=${encodeURIComponent(symbols.join(','))}` : '';

    try {
        return await requestJson(`${MARKET_CONFIG.backendBaseUrl}/news${params}`);
    } catch (error) {
        return {
            source: 'local-fallback',
            items: [
                {
                    id: 'fallback-btc-regulation',
                    symbol: 'BTC',
                    severity: 'medium',
                    title: 'BTC regulation and exchange-security headlines are being monitored.',
                    url: '#',
                    publishedAt: new Date().toISOString()
                },
                {
                    id: 'fallback-eth-network',
                    symbol: 'ETH',
                    severity: 'low',
                    title: 'ETH network and ETF-related headlines will appear here when the backend news feed is connected.',
                    url: '#',
                    publishedAt: new Date().toISOString()
                }
            ]
        };
    }
}

export async function askCompanion(payload) {
    return requestJson(`${MARKET_CONFIG.backendBaseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}
