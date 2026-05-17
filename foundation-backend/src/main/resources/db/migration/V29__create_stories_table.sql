-- V29: stories
--
-- Impact stories — short narratives about actual beneficiaries (a child whose schooling
-- was funded, a family that received medical support, a women's group that started a
-- micro-business). Each story has a quote, attribution, optional image, and optional
-- program/location tags so the public page can group or filter later.
--
-- Public visibility is gated on registration_status = APPROVED. Stories imply that
-- programs are actively running and have produced outcomes; showing fabricated or
-- pre-launch stories from an unregistered NGO would mislead donors. Admins can author
-- and stage stories at any time — only the public endpoint enforces the gate.
--
-- Story records intentionally lack a database FK to specific campaigns: many real
-- stories cut across programs ("Priya is in Class 6 thanks to scholarships AND her
-- family received post-flood healthcare"), and we don't want broken stories when an
-- old campaign is archived. Program affiliation is captured as a free-text tag for
-- display grouping only.
CREATE TABLE stories (
    id              BIGSERIAL    PRIMARY KEY,
    title           VARCHAR(160) NOT NULL,
    quote           TEXT         NOT NULL,
    attribution     VARCHAR(160) NOT NULL,
    image_url       VARCHAR(1000),
    program_tag     VARCHAR(80),
    location        VARCHAR(120),
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by      VARCHAR(120)
);

CREATE INDEX idx_stories_sort ON stories (sort_order, id);
CREATE INDEX idx_stories_enabled ON stories (enabled) WHERE enabled = TRUE;

-- Two seed stories, both DISABLED. They illustrate the field shape so admins have a
-- working example to copy-edit, but they never go live until an admin enables them
-- (and the foundation is APPROVED).
INSERT INTO stories
    (title, quote, attribution, program_tag, location, enabled, sort_order, updated_by)
VALUES
    ('Back to school after the flood',
     'After the floods, we lost everything — books, uniforms, even the school bag I had saved up for. The foundation paid for all of it so I could go back. Now I want to be a doctor.',
     'Priya, age 11 — Class 6 student',
     'Education',
     'Patna district, Bihar',
     FALSE,
     10,
     'system'),
    ('A health camp that found what we missed',
     'My mother had been quietly losing weight for months. We thought it was age. The free camp screened her for diabetes and connected us to a clinic — she is on treatment now.',
     'Ravi, son and caretaker',
     'Healthcare',
     'Sitamarhi block, Bihar',
     FALSE,
     20,
     'system');

-- Seed the home_sections row so admin can toggle it on from the homepage manager
-- without another migration. Disabled by default — admin should enable individual
-- stories AND confirm registration status before turning the section on.
INSERT INTO home_sections (id, type, enabled, sort_order, config_json, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'stories',
    FALSE,
    70, -- between money_allocation (55) and campaign_carousel (typical 80+)
    '{"title":"Voices from the field","subtitle":"Real people, in their own words. Identifying details are shared with consent."}',
    NOW(),
    NOW()
);
