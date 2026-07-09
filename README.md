# CoinRadar

CoinRadar solves a simple problem: keeping track of multiple forex pairs and crypto assets manually is tedious, and most free tools either show live prices without history or require a paid subscription for alerts. CoinRadar ingests price data on a schedule, stores it as queryable time-series data, and proactively notifies you when something moves rather than requiring you to keep checking.

The system is built and operated end-to-end as a single-developer DevOps project: a Dockerized web dashboard runs on EC2, backed by RDS for persistent price history and watchlist data. A scheduled Lambda function handles price ingestion from public market APIs, and alerting can be routed through SNS/SES or in-app notifications. The deployment pipeline currently lives in GitHub Actions with OIDC-based AWS authentication.

## Current Frontend/Lambda Structure

- `assets/js/shared/` contains reusable browser modules for Binance/backend API calls, formatting, localStorage watchlist persistence, shared nav rendering, and the floating AI companion widget.
- `assets/js/pages/` contains page-specific behavior for the dashboard, coin table, watchlist, chart page, and settings page.
- `lambda/chatCompanion/handler.js` is a thin API Gateway/Lambda handler that assembles holdings, prices, page context, and news before calling an external Ollama server.
- `lambda/newsApi/handler.js`, `lambda/newsPoller/handler.js`, and `lambda/newsSubscriber/handler.js` keep news display, scheduled classification, SNS publishing, and user notification matching deployable independently.

