-- V26: donation_presets
--
-- Ordered list of quick-select amounts shown on the donation form. Values are stored
-- in the currency's minor unit (paise for INR) to match Stripe's contract and the
-- frontend's existing math — the UI divides by 100 for display.
--
-- At most one row should have is_default = TRUE. The service layer enforces this;
-- we do not add a partial-unique index here to keep migrations portable.
--
-- Seeded with the current hardcoded defaults in frontend/src/config/constants.ts
-- (PRESET_AMOUNTS: [500, 1000, 2500, 5000, 10000] paise, DEFAULT_AMOUNT: 1000 paise).
CREATE TABLE donation_presets (
    id                   BIGSERIAL    PRIMARY KEY,
    amount_minor_units   INTEGER      NOT NULL CHECK (amount_minor_units > 0),
    label                VARCHAR(40),
    enabled              BOOLEAN      NOT NULL DEFAULT TRUE,
    is_default           BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order           INTEGER      NOT NULL DEFAULT 0,
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by           VARCHAR(120)
);

CREATE INDEX idx_donation_presets_sort ON donation_presets (sort_order, id);

INSERT INTO donation_presets (amount_minor_units, label, enabled, is_default, sort_order, updated_by)
VALUES
    (500,   NULL, TRUE, FALSE, 10, 'system'),
    (1000,  NULL, TRUE, TRUE,  20, 'system'),
    (2500,  NULL, TRUE, FALSE, 30, 'system'),
    (5000,  NULL, TRUE, FALSE, 40, 'system'),
    (10000, NULL, TRUE, FALSE, 50, 'system');
