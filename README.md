# CoinRadar

CoinRadar solves a simple problem: keeping track of multiple forex pairs and crypto assets manually is tedious, and most free tools either show live prices without history or require a paid subscription for alerts. CoinRadar ingests price data on a schedule, stores it as queryable time-series data, and proactively notifies you when something moves rather than requiring you to keep checking.

The system is built and operated end-to-end as a single-developer DevOps project: a Dockerized web dashboard runs on EC2, backed by RDS for persistent price history and watchlist data. A scheduled Lambda function handles price ingestion from public market APIs, and alerting can be routed through SNS/SES or in-app notifications. The deployment pipeline currently lives in GitHub Actions with OIDC-based AWS authentication.

## Current Frontend/Lambda Structure

- `assets/js/shared/` contains reusable browser modules for Binance/backend API calls, formatting, localStorage watchlist persistence, shared nav rendering, and the floating AI companion widget.
- `assets/js/pages/` contains page-specific behavior for the dashboard, coin table, watchlist, chart page, and settings page.
- `lambda/chatCompanion/handler.js` is a thin API Gateway/Lambda handler that assembles holdings, prices, page context, and news before calling an external Ollama server.
- `lambda/newsApi/handler.js`, `lambda/newsPoller/handler.js`, and `lambda/newsSubscriber/handler.js` keep news display, scheduled classification, SNS publishing, and user notification matching deployable independently.

## Local PHP / MySQL setup

1. Start **Apache** and **MySQL** in XAMPP.
2. Import `database/schema.sql` in phpMyAdmin, or run `mysql -u root < database/schema.sql` from this project folder.
3. Update `config/database.php` when your MySQL username or password differs from XAMPP's defaults.
4. Open `http://localhost/CoinRadar/`. The site now uses `index.php` and the pages in `pages/*.php`.

### Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/), create an OAuth 2.0 **Web application** client.
2. Add this Authorized redirect URI exactly: `http://localhost/CoinRadar/auth/google-callback.php`.
3. Put the client ID and client secret in `config/google.php`.

Do not commit real database or Google credentials. The application stores a password hash (never a plaintext password), uses PHP sessions after sign-in, and keeps each user's watchlist in MySQL. Historical chart data belongs in `price_candles`; the supplied unique index makes scheduled candle imports idempotent.

### AI portfolio context

The chat widget sends only the user's question and the page they are viewing to `api/chat.php`. That authenticated PHP endpoint reads the signed-in user's rows from `watchlist_items`, builds the holdings JSON server-side, and forwards it to the AI service. Set `COINRADAR_AI_URL` in Apache/PHP's environment only when the AI service is not running at `http://127.0.0.1:3000`.

Ollama responses can take longer on CPU-only machines. The proxy waits up to 120 seconds by default; override this with `COINRADAR_AI_TIMEOUT_SECONDS` in Apache/PHP's environment. `OLLAMA_MAX_TOKENS` (default `300`) controls the maximum AI response length.
