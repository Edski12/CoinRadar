const {
    askCryptoNews,
    getBreakingNews,
    getFearGreedIndex,
    getLatestNews,
    getSentiment,
    getTrendingTopics,
    searchNews
} = require('../shared/api');

function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': process.env.ALLOWED_ORIGIN || '*',
            'access-control-allow-headers': 'content-type',
            'access-control-allow-methods': 'OPTIONS,GET'
        },
        body: JSON.stringify(body)
    };
}

exports.handler = async event => {
    if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
        return response(200, { ok: true });
    }

    try {
        const query = event.queryStringParameters || {};
        const symbols = String(query.symbols || '')
            .split(',')
            .map(symbol => symbol.trim())
            .filter(Boolean);
        const limit = query.limit ? Number(query.limit) : undefined;
        const page = query.page ? Number(query.page) : undefined;

        if (query.feed === 'breaking') {
            return response(200, await getBreakingNews({ limit, symbols }));
        }

        if (query.feed === 'search') {
            return response(200, await searchNews(query.q || symbols.join(' '), { limit, page, symbols }));
        }

        if (query.feed === 'trending') {
            return response(200, { source: 'cryptocurrency.cv', topics: await getTrendingTopics() });
        }

        if (query.feed === 'fear-greed') {
            return response(200, { source: 'cryptocurrency.cv', index: await getFearGreedIndex() });
        }

        if (query.feed === 'sentiment') {
            return response(200, { source: 'cryptocurrency.cv', sentiment: await getSentiment() });
        }

        if (query.feed === 'ask') {
            return response(200, { source: 'cryptocurrency.cv', answer: await askCryptoNews(query.q || '') });
        }

        return response(200, await getLatestNews({ limit: limit || 12, page, source: query.source, symbols }));
    } catch (error) {
        return response(500, { error: error.message, items: [] });
    }
};
