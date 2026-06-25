-- =============================================================================
-- V-Link — Reference / seed data (0002_seed)
-- =============================================================================
-- Optional but recommended. Populates the reference tables the app reads from.
--
--  * badges            — REQUIRED for the badge system to award anything. The
--                        action_trigger values below are the exact strings the
--                        gamification service checks (see gamification.service.ts).
--  * skills            — sample skill catalog; edit freely.
--  * marketplace_items — sample cosmetic/perk catalog; edit freely.
--
-- Idempotent: ON CONFLICT DO NOTHING on the natural unique keys.
-- Run AFTER 0001_init.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Badges (action_trigger MUST match the values handled in the backend)
-- -----------------------------------------------------------------------------
INSERT INTO badges (name, description, action_trigger) VALUES
  ('First Steps',  'Completed your first volunteering event.', 'FIRST_EVENT'),
  ('Regular',      'Completed five volunteering events.',       'FIVE_EVENTS'),
  ('Ten Hours',    'Logged ten hours of volunteering.',         'TEN_HOURS')
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Skills (sample catalog — customize as needed)
-- -----------------------------------------------------------------------------
INSERT INTO skills (name) VALUES
  ('First Aid'),
  ('Cooking'),
  ('Driving'),
  ('Teaching'),
  ('Event Planning'),
  ('Photography'),
  ('Social Media'),
  ('Translation'),
  ('Fundraising'),
  ('Carpentry')
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Marketplace items (sample catalog — customize as needed)
-- category is one of:
--   COSMETIC_NAME_COLOR | COSMETIC_NAME_ANIMATION | COSMETIC_AVATAR_FRAME |
--   COSMETIC_GLOW | PERK
-- -----------------------------------------------------------------------------
INSERT INTO marketplace_items (slug, name, description, point_cost, category, payload, is_active, stock) VALUES
  ('name-color-gold',    'Gold Name Color',     'Display your name in gold.',         100, 'COSMETIC_NAME_COLOR',     '{"color": "#FFD700"}',      true, NULL),
  ('name-color-cyan',    'Cyan Name Color',     'Display your name in cyan.',         100, 'COSMETIC_NAME_COLOR',     '{"color": "#00BCD4"}',      true, NULL),
  ('name-anim-rainbow',  'Rainbow Name',        'Animate your name with a rainbow.',  300, 'COSMETIC_NAME_ANIMATION', '{"animation": "rainbow"}',  true, NULL),
  ('frame-bronze',       'Bronze Avatar Frame', 'A bronze frame around your avatar.', 150, 'COSMETIC_AVATAR_FRAME',   '{"frame": "bronze"}',       true, NULL),
  ('glow-blue',          'Blue Glow',           'A soft blue glow effect.',           200, 'COSMETIC_GLOW',           '{"glow": "#2196F3"}',       true, NULL)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- End of 0002_seed
-- =============================================================================
