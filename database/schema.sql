-- WorldProject initial PostgreSQL schema
-- Basis fuer Accounts, Firmen, Coins, Coinmarkt, Gilden und Sicherheitspruefungen.

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    username VARCHAR(40) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'verification_pending',
    country_code VARCHAR(2),
    language_code VARCHAR(10) NOT NULL DEFAULT 'de',
    email_verified_at TIMESTAMPTZ,
    terms_accepted_at TIMESTAMPTZ NOT NULL,
    privacy_accepted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    industry VARCHAR(80),
    company_type VARCHAR(80),
    money NUMERIC(18,2) NOT NULL DEFAULT 50000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coin_wallets (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coin_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coin_market_orders (
    id BIGSERIAL PRIMARY KEY,
    seller_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_amount BIGINT NOT NULL CHECK (original_amount > 0),
    remaining_amount BIGINT NOT NULL CHECK (remaining_amount >= 0),
    price_per_coin NUMERIC(18,2) NOT NULL CHECK (price_per_coin > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS coin_market_trades (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES coin_market_orders(id),
    seller_user_id BIGINT NOT NULL REFERENCES users(id),
    buyer_user_id BIGINT NOT NULL REFERENCES users(id),
    amount BIGINT NOT NULL CHECK (amount > 0),
    price_per_coin NUMERIC(18,2) NOT NULL,
    total_game_money NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guilds (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    language_code VARCHAR(10),
    country_code VARCHAR(2),
    owner_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guild_members (
    guild_id BIGINT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS login_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ip_hash VARCHAR(128),
    device_hash VARCHAR(128),
    successful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS household_declarations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'declared',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS abuse_risk_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_type VARCHAR(60) NOT NULL,
    score NUMERIC(8,2) NOT NULL DEFAULT 0,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_orders_status_price ON coin_market_orders(status, price_per_coin);
CREATE INDEX IF NOT EXISTS idx_coin_trades_created ON coin_market_trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_user_created ON login_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_risk_user_created ON abuse_risk_events(user_id, created_at DESC);
