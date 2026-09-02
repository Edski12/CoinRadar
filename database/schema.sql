CREATE DATABASE IF NOT EXISTS coinradar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coinradar;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    google_id VARCHAR(255) NULL UNIQUE,
    avatar_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE watchlist_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    symbol VARCHAR(30) NOT NULL,
    amount DECIMAL(30, 12) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY user_symbol (user_id, symbol),
    CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE chat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY chat_user_created (user_id, created_at, id),
    CONSTRAINT fk_chat_message_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Time-series candles persisted by your scheduled market-data importer.
CREATE TABLE price_candles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(30) NOT NULL,
    interval_code VARCHAR(10) NOT NULL,
    open_time DATETIME NOT NULL,
    open_price DECIMAL(30, 12) NOT NULL,
    high_price DECIMAL(30, 12) NOT NULL,
    low_price DECIMAL(30, 12) NOT NULL,
    close_price DECIMAL(30, 12) NOT NULL,
    volume DECIMAL(30, 12) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY candle_lookup (symbol, interval_code, open_time),
    KEY candle_symbol_time (symbol, open_time)
) ENGINE=InnoDB;
