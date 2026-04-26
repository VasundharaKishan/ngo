-- V30: faqs
--
-- Frequently-asked questions. Unlike stories or money_allocations, FAQs are NOT
-- registration-gated: an unregistered foundation should still be able to publish
-- "Who are we?", "What programs are you running?", "How can I volunteer?". Donor-
-- and tax-related questions ("Is my donation tax-deductible under 80G?") should
-- only be enabled by the admin once the corresponding registrations are in place,
-- but that's an editorial decision per-row, not a database-level gate.
--
-- Each FAQ has an optional free-text `category` for client-side grouping (e.g.
-- "Donations", "Programs", "About us"). Categories are not normalized into a
-- separate table — admins can rename or invent categories freely without a
-- migration, and the public page just groups whatever shows up.
CREATE TABLE faqs (
    id              BIGSERIAL    PRIMARY KEY,
    question        VARCHAR(500) NOT NULL,
    answer          TEXT         NOT NULL,
    category        VARCHAR(80),
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by      VARCHAR(120)
);

CREATE INDEX idx_faqs_sort ON faqs (sort_order, id);
CREATE INDEX idx_faqs_enabled ON faqs (enabled) WHERE enabled = TRUE;

-- Six seed FAQs covering the questions a donor or volunteer would typically have
-- for a small Indian NGO. Most are ENABLED so the FAQ page is useful from day one;
-- the 80G/tax question is DISABLED because that claim is registration-dependent
-- and the admin must consciously turn it on once the certification arrives.
INSERT INTO faqs
    (question, answer, category, enabled, sort_order, updated_by)
VALUES
    ('Who are you and what does the foundation do?',
     'We are a small charitable foundation working in education, healthcare, and community support in our local area. Our work is run by volunteers and supported by individual donors. Specific programmes vary by season and need — see the Campaigns page for what is currently active.',
     'About us',
     TRUE,
     10,
     'system'),
    ('Is the foundation officially registered?',
     'The foundation is being formally established. Until our registration is complete, we do not claim tax-deductibility or any government recognition. We will update this answer the moment our status changes, and we publish all such updates on the Transparency page.',
     'About us',
     TRUE,
     20,
     'system'),
    ('How are donations used?',
     'Every donation is allocated across a small number of programmes (for example: education, healthcare, administration). The current breakdown is shown on the home page under "Where your money goes". We publish actual spend at the end of each financial year.',
     'Donations',
     TRUE,
     30,
     'system'),
    ('Are donations tax-deductible under 80G?',
     'Not yet. Section 80G certification is granted by the Income Tax Department after registration is complete. Until that certificate is issued and visible on this site, please do not claim a deduction for donations made to us.',
     'Donations',
     FALSE,
     40,
     'system'),
    ('How can I volunteer?',
     'We welcome volunteers for tutoring, health-camp logistics, fundraising, and back-office work. Reach out via the Contact page with a short note about your interests and availability — we will get back to you within a week.',
     'Get involved',
     TRUE,
     50,
     'system'),
    ('Where can I see your accounts and reports?',
     'Annual reports, financial summaries, and registration documents are linked from the Transparency page. If something you need is not listed there, contact us and we will share it directly.',
     'Transparency',
     TRUE,
     60,
     'system');

-- Seed the home_sections row so admin can toggle a small "FAQ teaser" on the
-- home page without another migration. Disabled by default — the FAQ has its
-- own page at /faq and not every site wants it duplicated on home.
INSERT INTO home_sections (id, type, enabled, sort_order, config_json, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'faq',
    FALSE,
    80, -- between stories (70) and campaign_carousel (typical 80+)
    '{"title":"Frequently asked questions","subtitle":"Short answers to the most common questions. Full list on the FAQ page.","limit":5,"category":null}',
    NOW(),
    NOW()
);
