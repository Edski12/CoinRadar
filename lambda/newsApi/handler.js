const { getNewsItems } = require('../shared/api');

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
        const symbols = String(event.queryStringParameters?.symbols || '')
            .split(',')
            .map(symbol => symbol.trim())
            .filter(Boolean);
        const items = await getNewsItems(symbols);
        return response(200, { source: process.env.NEWS_FEED_URL || 'cryptocompare', items: items.slice(0, 12) });
    } catch (error) {
        return response(500, { error: error.message, items: [] });
    }
};
