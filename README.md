# CoinRadar

CoinRadar is a crypto and forex tracking platform that ingests price data on a schedule, stores it as queryable time-series data, and proactively notifies you when something moves — instead of requiring you to keep checking manually.

The system is built and operated as a single-developer DevOps project: a Dockerized web dashboard runs on EC2, backed by RDS for persistent price history and watchlist data, with a scheduled Lambda function handling price ingestion and alerting routed through SNS/SES or in-app notifications.

## Main Folders

### `assets/js/shared/`
Reusable browser modules used across the frontend.

- Handles Binance/backend API calls, formatting, and localStorage watchlist persistence.
- Renders shared navigation and the floating AI companion widget.

### `assets/js/pages/`
Page-specific frontend behavior.

- Covers the dashboard, coin table, watchlist, chart page, and settings page.

### `lambda/chatCompanion/`
API Gateway/Lambda handler for the AI chat widget.

- Assembles holdings, prices, page context, and news before calling the AI service.

### `lambda/newsApi/`, `lambda/newsPoller/`, `lambda/newsSubscriber/`
Independently deployable Lambda functions for news.

- Handle news display, scheduled classification, SNS publishing, and user notification matching.
