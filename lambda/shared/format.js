function formatCurrency(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '$0.00';
    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatPercent(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '-';
    return `${amount.toFixed(2)}%`;
}

function normalizeSymbol(symbol, quote = 'USDT') {
    const cleaned = String(symbol || '').trim().toUpperCase();
    if (!cleaned) return '';
    return cleaned.endsWith(quote) ? cleaned : `${cleaned}${quote}`;
}

module.exports = {
    formatCurrency,
    formatPercent,
    normalizeSymbol
};
