# CoinRadar

CoinRadar solves a simple problem: keeping track of multiple forex pairs and crypto assets manually is tedious, and most free tools either show live prices without history or require a paid subscription for alerts. CoinRadar ingests price data on a schedule, stores it as queryable time-series data, and proactively notifies you when something moves rather than requiring you to keep checking.

The system is built and operated end-to-end as a single-developer DevOps project: a Dockerized web dashboard runs on EC2, backed by RDS for persistent price history and watchlist data. A scheduled Lambda function handles price ingestion from public market APIs, and alerting can be routed through SNS/SES or in-app notifications. The deployment pipeline currently lives in GitHub Actions with OIDC-based AWS authentication.

## Current Frontend/Lambda Structure

- `assets/js/shared/` contains reusable browser modules for Binance/backend API calls, formatting, localStorage watchlist persistence, shared nav rendering, and the floating AI companion widget.
- `assets/js/pages/` contains page-specific behavior for the dashboard, coin table, watchlist, chart page, and settings page.
- `lambda/chatCompanion/handler.js` is a thin API Gateway/Lambda handler that assembles holdings, prices, page context, and news before calling an external Ollama server.
- `lambda/newsApi/handler.js`, `lambda/newsPoller/handler.js`, and `lambda/newsSubscriber/handler.js` keep news display, scheduled classification, SNS publishing, and user notification matching deployable independently.

Ollama should run on a persistent backend host such as EC2 or ECS/Fargate, not inside Lambda. Lambda remains the orchestration layer. News is wired to cryptocurrency.cv's unauthenticated API through `lambda/shared/api.js`, so there is no API key or Secrets Manager setup for this provider. During sandbox testing on July 9, 2026, cryptocurrency.cv returned `402 Payment Required` for `/api/news?limit=2` and `/api/openapi.json`; verify availability from production before depending on it. Email notifications through SES also require verified identities and may require moving the AWS account out of the SES sandbox.
