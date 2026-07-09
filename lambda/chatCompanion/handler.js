const { askCryptoNews, getLatestNews, getTickersForHoldings, searchNews } = require('../shared/api');
const { formatCurrency, formatPercent } = require('../shared/format');

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': process.env.ALLOWED_ORIGIN || '*',
            'access-control-allow-headers': 'content-type',
            'access-control-allow-methods': 'OPTIONS,POST'
        },
        body: JSON.stringify(body)
    };
}

function parseBody(event) {
    if (!event.body) return {};
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
}

function marketSummary(marketData) {
    return marketData.map(item => {
        if (item.error) return `${item.symbol}: unavailable (${item.error})`;
        const value = item.price * item.amount;
        return `${item.symbol}: amount ${item.amount}, price ${formatCurrency(item.price)}, value ${formatCurrency(value)}, 24h ${formatPercent(item.changePercent)}, high ${formatCurrency(item.high)}, low ${formatCurrency(item.low)}`;
    }).join('\n');
}

function wantsCurrentEvents(message) {
    const lower = String(message || '').toLowerCase();
    return ['news', 'happen', 'happening', 'headline', 'event', 'regulation', 'hack', 'ban', 'why', 'today'].some(keyword => lower.includes(keyword));
}

function compactAskAnswer(answer) {
    if (!answer) return '';
    if (typeof answer === 'string') return answer;
    return answer.answer || answer.response || answer.text || answer.summary || JSON.stringify(answer).slice(0, 1000);
}

async function askOllama(messages) {
    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: false,
            messages
        })
    });

    if (!ollamaResponse.ok) {
        throw new Error(`Ollama request failed: ${ollamaResponse.status}`);
    }

    const data = await ollamaResponse.json();
    return data.message?.content || 'No response returned.';
}

exports.handler = async event => {
    if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
        return response(200, { ok: true });
    }

    try {
        const body = parseBody(event);
        const holdings = Array.isArray(body.holdings) ? body.holdings : [];
        const symbols = [...new Set([
            ...holdings.map(item => item.symbol),
            body.pageContext?.symbol
        ].filter(Boolean))];
        const marketData = await getTickersForHoldings(holdings);
        const newsQuery = symbols.length ? symbols.map(symbol => symbol.replace(/USDT$/i, '')).join(' OR ') : body.message;
        const shouldSearchNews = wantsCurrentEvents(body.message) || Boolean(body.pageContext?.symbol);
        const [newsResult, askResult] = await Promise.allSettled([
            shouldSearchNews ? searchNews(newsQuery, { limit: 8, symbols }) : getLatestNews({ limit: 6, symbols }),
            shouldSearchNews ? askCryptoNews(body.message) : Promise.resolve(null)
        ]);
        const news = newsResult.status === 'fulfilled' ? newsResult.value.items || [] : [];
        const cryptoNewsAnswer = askResult.status === 'fulfilled' ? compactAskAnswer(askResult.value) : '';

        const messages = [
            {
                role: 'system',
                content: [
                    'You are Coin Radar AI, a calm portfolio companion for crypto and forex tracking.',
                    'Use only the provided market/news context for current facts.',
                    'Do not give direct buy, sell, or hold advice. Explain risk, movements, and context clearly.'
                ].join(' ')
            },
            {
                role: 'user',
                content: [
                    `Question: ${body.message || ''}`,
                    `Page context: ${JSON.stringify(body.pageContext || {})}`,
                    'Portfolio context:',
                    marketSummary(marketData) || 'No holdings supplied.',
                    'Relevant news:',
                    news.slice(0, 6).map(item => `${item.symbol || 'MARKET'} [${item.severity}]: ${item.title}`).join('\n') || 'No news supplied.',
                    'cryptocurrency.cv direct answer:',
                    cryptoNewsAnswer || 'No direct answer supplied.'
                ].join('\n')
            }
        ];

        const reply = await askOllama(messages);
        return response(200, { reply, marketData, news: news.slice(0, 6), cryptoNewsAnswer });
    } catch (error) {
        return response(500, { error: error.message });
    }
};
