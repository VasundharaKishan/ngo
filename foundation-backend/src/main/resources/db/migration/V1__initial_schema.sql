-- V1: Initial schema - core domain tables
-- Creates: admin_users, categories, campaigns, donations

-- ─── Admin Users ─────────────────────────────────────────────────────────────

CREATE TABLE admin_users (
    id         VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username   VARCHAR(255) NOT NULL UNIQUE,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    full_name  VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMP,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Categories ──────────────────────────────────────────────────────────────

CREATE TABLE categories (
    id            VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name          VARCHAR(255) NOT NULL UNIQUE,
    slug          VARCHAR(255) NOT NULL UNIQUE,
    description   VARCHAR(500),
    icon          VARCHAR(255) NOT NULL,
    color         VARCHAR(255) NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Campaigns ───────────────────────────────────────────────────────────────

CREATE TABLE campaigns (
    id                 VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title              VARCHAR(255) NOT NULL,
    slug               VARCHAR(255) NOT NULL UNIQUE,
    short_description  VARCHAR(255),
    description        TEXT,
    category_id        VARCHAR(255) REFERENCES categories(id),
    target_amount      BIGINT       NOT NULL,
    current_amount     BIGINT,
    currency           VARCHAR(3)   NOT NULL,
    image_url          VARCHAR(255),
    location           VARCHAR(255),
    beneficiaries_count INTEGER,
    active             BOOLEAN      NOT NULL DEFAULT TRUE,
    featured           BOOLEAN,
    urgent             BOOLEAN,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Donations ───────────────────────────────────────────────────────────────

CREATE TABLE donations (
    id                       VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    donor_name               VARCHAR(255),
    donor_email              VARCHAR(255),
    amount                   BIGINT       NOT NULL,
    currency                 VARCHAR(3)   NOT NULL,
    status                   VARCHAR(50)  NOT NULL,
    campaign_id              VARCHAR(255) NOT NULL REFERENCES campaigns(id),
    stripe_session_id        VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
