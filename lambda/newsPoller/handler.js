const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { classifySeverity, getBreakingNews, getSentiment } = require('../shared/api');

const sns = new SNSClient({});
const TRACKED_SYMBOLS = (process.env.TRACKED_SYMBOLS || 'BTC,ETH,BNB,SOL,XRP,ADA,DOGE')
    .split(',')
    .map(symbol => symbol.trim())
    .filter(Boolean);

exports.handler = async () => {
    const [breakingNews, sentimentResult] = await Promise.allSettled([
        getBreakingNews({ limit: 30, symbols: TRACKED_SYMBOLS }),
        getSentiment()
    ]);
    const items = breakingNews.status === 'fulfilled' ? breakingNews.value.items : [];
    const sentiment = sentimentResult.status === 'fulfilled' ? sentimentResult.value : null;
    const majorItems = items
        .map(item => ({ ...item, severity: severityForAlert(item, sentiment) }))
        .filter(item => item.severity === 'high' || item.severity === 'medium')
        .slice(0, 10);

    for (const item of majorItems) {
        await sns.send(new PublishCommand({
            TopicArn: process.env.NEWS_ALERT_TOPIC_ARN,
            Subject: `CoinRadar ${item.severity} alert: ${item.symbol}`,
            Message: JSON.stringify(item),
            MessageAttributes: {
                symbol: { DataType: 'String', StringValue: item.symbol || 'MARKET' },
                severity: { DataType: 'String', StringValue: item.severity || 'low' }
            }
        }));
    }

    return {
        checked: items.length,
        published: majorItems.length,
        sentimentAvailable: Boolean(sentiment)
    };
};

function severityForAlert(item, sentiment) {
    const sentimentSeverity = severityFromProviderSentiment(item, sentiment);
    if (sentimentSeverity) return sentimentSeverity;
    return item.severity || classifySeverity(`${item.title || ''} ${item.summary || ''}`);
}

function severityFromProviderSentiment(item, sentiment) {
    const raw = item.sentiment || sentiment?.sentiment || sentiment?.marketSentiment || sentiment?.score;
    if (raw === undefined || raw === null) return null;
    const value = typeof raw === 'object' ? raw.score ?? raw.value ?? raw.label : raw;
    const text = String(value).toLowerCase();

    if (text.includes('very negative') || text.includes('bearish') || Number(value) <= -0.5) return 'high';
    if (text.includes('negative') || Number(value) < 0) return 'medium';
    return null;
}
