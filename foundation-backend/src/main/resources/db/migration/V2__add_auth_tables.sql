-- V2: Auth and supporting tables
-- Creates: security_questions, user_security_answers, otp_tokens,
--          password_setup_tokens, stripe_event_records,
--          contact_settings, site_config, footer_settings

-- ─── Security Questions ──────────────────────────────────────────────────────

CREATE TABLE security_questions (
    id            VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    question      VARCHAR(255) NOT NULL UNIQUE,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order INTEGER,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── User Security Answers ───────────────────────────────────────────────────

CREATE TABLE user_security_answers (
    id          VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id     VARCHAR(255) NOT NULL REFERENCES admin_users(id),
    question_id VARCHAR(255) NOT NULL REFERENCES security_questions(id),
    answer      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── OTP Tokens ──────────────────────────────────────────────────────────────

CREATE TABLE otp_tokens (
    id         VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id    VARCHAR(255) NOT NULL REFERENCES admin_users(id),
    code_hash  VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    attempts   INTEGER      NOT NULL DEFAULT 0,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Password Setup Tokens ───────────────────────────────────────────────────

CREATE TABLE password_setup_tokens (
    id         VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    token      VARCHAR(255) NOT NULL UNIQUE,
    user_id    VARCHAR(255) NOT NULL REFERENCES admin_users(id),
    expires_at TIMESTAMP    NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Stripe Event Records ────────────────────────────────────────────────────

CREATE TABLE stripe_event_records (
    id          VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id    VARCHAR(255) NOT NULL UNIQUE,
    received_at TIMESTAMP    NOT NULL
);

-- ─── Contact Settings ────────────────────────────────────────────────────────

CREATE TABLE contact_settings (
    id              VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email           VARCHAR(255),
    locations_json  TEXT,
    show_in_footer  BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Site Config ─────────────────────────────────────────────────────────────

CREATE TABLE site_config (
    id           VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    config_key   VARCHAR(255) NOT NULL UNIQUE,
    config_value VARCHAR(255) NOT NULL,
    description  VARCHAR(255),
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Footer Settings ─────────────────────────────────────────────────────────

CREATE TABLE footer_settings (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tagline          VARCHAR(500),
    facebook_url     VARCHAR(500),
    twitter_url      VARCHAR(500),
    instagram_url    VARCHAR(500),
    youtube_url      VARCHAR(500),
    linkedin_url     VARCHAR(500),
    show_quick_links BOOLEAN NOT NULL DEFAULT TRUE,
    show_get_involved BOOLEAN NOT NULL DEFAULT TRUE,
    copyright_text   VARCHAR(500),
    disclaimer_text  VARCHAR(1000),
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
