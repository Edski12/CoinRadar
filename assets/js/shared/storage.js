const WATCHLIST_KEY = 'coinRadarWatchlist';

export function readWatchlist() {
    try {
        const raw = localStorage.getItem(WATCHLIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        return [];
    }
}

export function writeWatchlist(watchlist) {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
}

export function upsertHolding(watchlist, symbol, amount) {
    const next = [...watchlist];
    const existing = next.find(item => item.symbol === symbol);

    if (existing) {
        existing.amount = amount;
    } else {
        next.push({ symbol, amount });
    }

    writeWatchlist(next);
    return next;
}

export function removeHolding(watchlist, symbol) {
    const next = watchlist.filter(item => item.symbol !== symbol);
    writeWatchlist(next);
    return next;
}
