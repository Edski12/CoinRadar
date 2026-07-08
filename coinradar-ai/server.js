require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

function normalizeSymbol(symbol) {
  const cleaned = String(symbol || '').trim().toUpperCase();
  if (!cleaned) return 'BTCUSDT';
  return cleaned.endsWith('USDT') ? cleaned : `${cleaned}USDT`;
}

async function fetchBinance24hr(symbol) {
  const normalized = normalizeSymbol(symbol);
  const response = await global.fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${normalized}`);
  if (!response.ok) {
    throw new Error(`Binance request failed for ${normalized}`);
  }
  const data = await response.json();
  return {
    symbol: normalized,
    price: Number(data.lastPrice),
    changePercent: Number(data.priceChangePercent),
    high: Number(data.highPrice),
    low: Number(data.lowPrice),
    volume: Number(data.volume),
    quoteVolume: Number(data.quoteVolume)
  };
}

async function askModel(systemPrompt, userMessage, marketContext) {
  const ollamaUrl = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const rawModel = (process.env.OLLAMA_MODEL || 'llama3.2').trim();
  const model = rawModel.includes(':') ? rawModel : `${rawModel}:latest`;

  try {
    console.log('Ollama request', { ollamaUrl, model });
    const response = await global.fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });

    console.log('Ollama response status', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama response error', errorText);
      throw new Error(`Ollama request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Ollama response payload', JSON.stringify(data).slice(0, 400));
    const text = data.message?.content || 'No response returned.';

    return {
      mode: 'ollama',
      text
    };
  } catch (error) {
    console.error('Ollama request failed:', error);
    return {
      mode: 'local-fallback',
      text: `I’m running in local fallback mode because Ollama is not available yet. ${marketContext}\n\nYou asked: "${userMessage}". I can summarize your holdings, explain recent moves, and keep the conversation grounded in live Binance data.\n\nError: ${error.message}`
    };
  }
}

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'coinradar-ai' });
});

app.post('/chat', async (req, res) => {
  try {
    const { message = '', holdings = [] } = req.body || {};
    const selectedHoldings = Array.isArray(holdings) && holdings.length
      ? holdings
      : [{ symbol: 'BTC', amount: 0.5 }];

    const marketData = [];
    for (const holding of selectedHoldings) {
      try {
        const data = await fetchBinance24hr(holding.symbol);
        marketData.push({
          symbol: holding.symbol,
          amount: Number(holding.amount || 0),
          price: data.price,
          changePercent: data.changePercent,
          high: data.high,
          low: data.low,
          volume: data.volume
        });
      } catch (error) {
        marketData.push({
          symbol: holding.symbol,
          amount: Number(holding.amount || 0),
          error: error.message
        });
      }
    }

    const summary = marketData.map((item) => {
      if (item.error) return `${item.symbol}: unavailable (${item.error})`;
      return `${item.symbol} | amount ${item.amount} | price $${item.price.toFixed(2)} | 24h ${item.changePercent.toFixed(2)}% | high $${item.high.toFixed(2)} | low $${item.low.toFixed(2)}`;
    }).join('\n');

    const systemPrompt = [
      'You are Coin Radar AI, a calm portfolio companion for crypto investors.',
      'Use the live market context provided by the user and never give direct buy/sell/hold advice.',
      'Focus on explanation, summaries, and safe guidance. Cite real numbers from the market context when available.',
      'If the user asks for personal investment advice, redirect them toward general education and risk awareness.'
    ].join(' ');

    const userPrompt = [
      `User question: ${message}`,
      'Market context:',
      summary
    ].join('\n');

    const aiResponse = await askModel(systemPrompt, userPrompt, summary);

    res.json({
      reply: aiResponse.text,
      mode: aiResponse.mode,
      marketData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Coin Radar AI listening on http://localhost:${PORT}`);
});
