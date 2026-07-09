const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { getNewsItems } = require('../shared/api');

const sns = new SNSClient({});
const TRACKED_SYMBOLS = (process.env.TRACKED_SYMBOLS || 'BTC,ETH,BNB,SOL,XRP,ADA,DOGE')
    .split(',')
    .map(symbol => symbol.trim())
    .filter(Boolean);

exports.handler = async () => {
    const items = await getNewsItems(TRACKED_SYMBOLS);
    const majorItems = items.filter(item => item.severity === 'high' || item.severity === 'medium').slice(0, 10);

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
        published: majorItems.length
    };
};
