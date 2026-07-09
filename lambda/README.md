# CoinRadar Lambda Notes

## Chat Companion

`chatCompanion/handler.js` is intentionally thin. It assembles localStorage/RDS-style holdings, live Binance prices, and recent news, then forwards the prompt to an Ollama endpoint.

Ollama should run on EC2, ECS/Fargate, or another persistent host. Lambda is a poor fit for hosting Ollama itself because model files, warm runtime, CPU/GPU needs, and long-lived server behavior do not match Lambda well.

## News Alerts

`newsPoller/handler.js` is designed for an EventBridge schedule and publishes major headlines to SNS. `newsSubscriber/handler.js` consumes those SNS messages and is the place to match affected users from RDS and write in-app notifications or send SES email.

The default news source is `https://cryptocurrency.cv/api`. It is intended to be unauthenticated, so this integration has no Secrets Manager or API-key overhead. During sandbox testing on July 9, 2026, direct requests to `/api/news?limit=2` and `/api/openapi.json` returned `402 Payment Required`, so verify access from the deployment network before relying on the feed in production.

## AWS Resources Needed

- API Gateway routes for `POST /chat` and `GET /news` (`newsApi/handler.js`).
- Lambda functions for chat companion, news polling, and news subscription.
- SNS topic for market-news alerts.
- EventBridge scheduled rule for the poller.
- RDS tables or columns for persisted user watchlists and notification flags.
- SES verified identities if email delivery is enabled.
- Optional Lambda layer for `lambda/shared`.
