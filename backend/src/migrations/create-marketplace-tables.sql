-- Migration: marketplace items, user inventory, equipped cosmetics, purchases
-- Drop old stub table (no data, wrong schema) and recreate with full schema
DROP TABLE IF EXISTS marketplace_items CASCADE;

CREATE TABLE IF NOT EXISTS marketplace_items (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  point_cost  INT NOT NULL CHECK (point_cost >= 0),
  category    TEXT NOT NULL CHECK (category IN (
    'COSMETIC_NAME_COLOR',
    'COSMETIC_NAME_ANIMATION',
    'COSMETIC_AVATAR_FRAME',
    'COSMETIC_GLOW',
    'PERK'
  )),
  payload     JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  stock       INT NULL
);

CREATE TABLE IF NOT EXISTS user_inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id     INT NOT NULL REFERENCES marketplace_items(id),
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata    JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON user_inventory (user_id);

CREATE TABLE IF NOT EXISTS user_equipped_cosmetics (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name_color_item_id    INT NULL REFERENCES marketplace_items(id),
  name_animation_item_id INT NULL REFERENCES marketplace_items(id),
  avatar_frame_item_id  INT NULL REFERENCES marketplace_items(id),
  glow_item_id          INT NULL REFERENCES marketplace_items(id)
);

CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id         INT NOT NULL REFERENCES marketplace_items(id),
  point_cost      INT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'COMPLETED',
  redemption_code TEXT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON marketplace_purchases (user_id);

-- ── Seed: 5 name colors ───────────────────────────────────────────────────────
INSERT INTO marketplace_items (slug, name, description, point_cost, category, payload) VALUES
  ('color-orange',  'Portocaliu vibrant',  'Numele tău apare în portocaliu',        200, 'COSMETIC_NAME_COLOR',     '{"cssVar":"--vl-orange","hex":"#FF6B35"}'),
  ('color-purple',  'Violet regal',        'Numele tău apare în violet',             250, 'COSMETIC_NAME_COLOR',     '{"cssVar":"","hex":"#7C3AED"}'),
  ('color-emerald', 'Verde smarald',       'Numele tău apare în verde smarald',      200, 'COSMETIC_NAME_COLOR',     '{"cssVar":"","hex":"#059669"}'),
  ('color-crimson', 'Roșu aprins',         'Numele tău apare în roșu',               200, 'COSMETIC_NAME_COLOR',     '{"cssVar":"","hex":"#DC2626"}'),
  ('color-gold',    'Auriu',               'Numele tău apare în auriu',              300, 'COSMETIC_NAME_COLOR',     '{"cssVar":"","hex":"#D97706"}')
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: 5 name animations ───────────────────────────────────────────────────
INSERT INTO marketplace_items (slug, name, description, point_cost, category, payload) VALUES
  ('anim-pulse',    'Puls',               'Numele tău pulsează subtil',              300, 'COSMETIC_NAME_ANIMATION', '{"animationClass":"vl-anim-pulse"}'),
  ('anim-rainbow',  'Curcubeu',           'Numele tău ciclează culorile curcubeului',500, 'COSMETIC_NAME_ANIMATION', '{"animationClass":"vl-anim-rainbow"}'),
  ('anim-glow',     'Strălucire',         'Numele tău strălucește',                  400, 'COSMETIC_NAME_ANIMATION', '{"animationClass":"vl-anim-glow"}'),
  ('anim-shake',    'Vibrație',           'Numele tău vibrează la hover',            250, 'COSMETIC_NAME_ANIMATION', '{"animationClass":"vl-anim-shake"}'),
  ('anim-float',    'Plutire',            'Numele tău plutește ușor',                350, 'COSMETIC_NAME_ANIMATION', '{"animationClass":"vl-anim-float"}')
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: 5 avatar frames ─────────────────────────────────────────────────────
INSERT INTO marketplace_items (slug, name, description, point_cost, category, payload) VALUES
  ('frame-orange',  'Inel portocaliu',    'Un inel portocaliu în jurul avatarului',  200, 'COSMETIC_AVATAR_FRAME',   '{"frameClass":"vl-frame-orange","borderColor":"#FF6B35"}'),
  ('frame-gold',    'Inel auriu',         'Un inel auriu elegant',                   350, 'COSMETIC_AVATAR_FRAME',   '{"frameClass":"vl-frame-gold","borderColor":"#D97706"}'),
  ('frame-rainbow', 'Inel curcubeu',      'Un inel cu gradient curcubeu',            500, 'COSMETIC_AVATAR_FRAME',   '{"frameClass":"vl-frame-rainbow","borderColor":"rainbow"}'),
  ('frame-neon',    'Neon verde',         'Un inel verde neon pulsant',              400, 'COSMETIC_AVATAR_FRAME',   '{"frameClass":"vl-frame-neon","borderColor":"#22C55E"}'),
  ('frame-fire',    'Foc',                'Un inel cu efect de flăcări',             600, 'COSMETIC_AVATAR_FRAME',   '{"frameClass":"vl-frame-fire","borderColor":"#EF4444"}')
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: 5 glows ─────────────────────────────────────────────────────────────
INSERT INTO marketplace_items (slug, name, description, point_cost, category, payload) VALUES
  ('glow-orange',   'Aură portocalie',    'O aură portocalie în jurul numelui',      300, 'COSMETIC_GLOW',           '{"glowClass":"vl-glow-orange","glowColor":"rgba(255,107,53,0.6)"}'),
  ('glow-purple',   'Aură violet',        'O aură violet misterioasă',               400, 'COSMETIC_GLOW',           '{"glowClass":"vl-glow-purple","glowColor":"rgba(124,58,237,0.6)"}'),
  ('glow-gold',     'Aură aurie',         'O aură aurie regală',                     450, 'COSMETIC_GLOW',           '{"glowClass":"vl-glow-gold","glowColor":"rgba(217,119,6,0.6)"}'),
  ('glow-neon',     'Aură neon verde',    'O aură verde neon',                       400, 'COSMETIC_GLOW',           '{"glowClass":"vl-glow-neon","glowColor":"rgba(34,197,94,0.6)"}'),
  ('glow-white',    'Aură albă',          'O aură albă pură',                        250, 'COSMETIC_GLOW',           '{"glowClass":"vl-glow-white","glowColor":"rgba(255,255,255,0.7)"}')
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: 5 perks ─────────────────────────────────────────────────────────────
INSERT INTO marketplace_items (slug, name, description, point_cost, category, payload) VALUES
  ('perk-ticket-10', '10% discount bilet', 'Reducere 10% la biletul următor',         500, 'PERK', '{"discountPercent":10,"type":"ticket"}'),
  ('perk-ticket-20', '20% discount bilet', 'Reducere 20% la biletul următor',        1000, 'PERK', '{"discountPercent":20,"type":"ticket"}'),
  ('perk-merch-tshirt','Tricou V-Link',    'Tricou oficial V-Link (S-XXL)',           1500, 'PERK', '{"type":"merch","item":"tshirt"}'),
  ('perk-coffee',    'Voucher cafea',      'Un voucher pentru o cafea la partenerul nostru', 300, 'PERK', '{"type":"voucher","item":"coffee"}'),
  ('perk-badge-pin', 'Pin V-Link',        'Un pin metalic colecție V-Link',           800, 'PERK', '{"type":"merch","item":"pin"}')
ON CONFLICT (slug) DO NOTHING;
