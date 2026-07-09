export const MARKET_CONFIG = {
    binanceBaseUrl: 'https://api.binance.com/api/v3',
    backendBaseUrl: window.COINRADAR_API_BASE_URL || localStorage.getItem('coinRadarApiBaseUrl') || 'http://localhost:3000',
    refreshMs: 60000,
    chartRefreshMs: 30000,
    defaultSymbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'],
    stableQuote: 'USDT'
};

export const PAGE_PATHS = {
    home: '../index.html',
    coins: 'coins.html',
    watchlist: 'watchlist.html',
    settings: 'settings.html'
};
