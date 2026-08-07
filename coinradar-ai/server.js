require('dotenv').config();
const express = require('express');
const chatCompanion = require('../lambda/chatCompanion/handler');
const newsApi = require('../lambda/newsApi/handler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

function sendLambdaResponse(res, lambdaResponse) {
    Object.entries(lambdaResponse.headers || {}).forEach(([key, value]) => res.header(key, value));
    res.status(lambdaResponse.statusCode || 200).send(lambdaResponse.body || '');
}

function toLambdaEvent(req) {
    return {
        body: JSON.stringify(req.body || {}),
        queryStringParameters: req.query || {},
        httpMethod: req.method,
        requestContext: {
            http: {
                method: req.method
            }
        }
    };
}

app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'coinradar-ai' });
});

app.get('/news', async (req, res) => {
    const result = await newsApi.handler(toLambdaEvent(req));
    sendLambdaResponse(res, result);
});

app.post('/chat', async (req, res) => {
    // The PHP session API, not the browser, supplies database-backed holdings.
    // Ignore a client-provided user id even if this service is exposed accidentally.
    delete req.body.userId;
    const result = await chatCompanion.handler(toLambdaEvent(req));
    sendLambdaResponse(res, result);
});

app.listen(PORT, () => {
    console.log(`Coin Radar AI listening on http://localhost:${PORT}`);
});
