exports.handler = async event => {
    const records = event.Records || [];
    const notifications = records.map(record => {
        const message = JSON.parse(record.Sns.Message);

        return {
            symbol: message.symbol,
            severity: message.severity,
            title: message.title,
            url: message.url,
            status: 'pending-user-match'
        };
    });

    /*
      Production hook:
      1. Query RDS for users whose watchlist/portfolio contains message.symbol.
      2. Insert an in-app notification row, send SES email, or both.
      3. Keep SES sandbox/verified identity limits in mind until the account is moved out of sandbox.
    */

    return {
        received: records.length,
        notifications
    };
};
