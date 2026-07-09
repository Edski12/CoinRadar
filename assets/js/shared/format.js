export function formatCurrency(value, options = {}) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '$0.00';

    return amount.toLocaleString(undefined, {
        style: 'currency',
        currency: options.currency || 'USD',
        minimumFractionDigits: options.minimumFractionDigits ?? 2,
        maximumFractionDigits: options.maximumFractionDigits ?? 2
    });
}

export function formatPercent(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '-';
    return `${amount.toFixed(2)}%`;
}

export function formatNumber(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '0';
    return amount.toLocaleString();
}

export function changeClass(value) {
    return Number(value) >= 0 ? 'text-success' : 'text-danger';
}

export function normalizeSymbol(symbol, quote = 'USDT') {
    const cleaned = String(symbol || '').trim().toUpperCase();
    if (!cleaned) return '';
    return cleaned.endsWith(quote) ? cleaned : `${cleaned}${quote}`;
}
