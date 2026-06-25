-- =============================================================================
-- V-Link — Initial schema (0001_init)
-- =============================================================================
-- Recreates the complete PostgreSQL schema used by the NestJS backend.
-- Derived 1:1 from the TypeORM entities in backend/src/**/entities/*.entity.ts.
--
-- The backend runs with `synchronize: false`, so this script is the source of
-- truth for the database structure. Apply it against a fresh Postgres / Supabase
-- database BEFORE starting the backend. See sql/README.md for instructions.
--
-- Idempotent: safe to re-run (uses IF NOT EXISTS / guarded enum creation).
-- =============================================================================

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE users_role_enum AS ENUM ('VOLUNTEER', 'ORGANIZER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE applications_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- users
-- auth_id holds the Supabase Auth user UID (auth.users.id). Kept as a plain
-- unique column rather than a cross-schema FK so this script is self-contained.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id       varchar         NOT NULL UNIQUE,
  email         varchar         NOT NULL UNIQUE,
  role          users_role_enum NOT NULL DEFAULT 'VOLUNTEER',
  social_links  jsonb           NOT NULL DEFAULT '{}',
  total_points  integer         NOT NULL DEFAULT 0,
  display_name  text,
  company_name  text,
  avatar_url    text,
  created_at    timestamptz     NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- skills (reference data)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id    serial  PRIMARY KEY,
  name  varchar NOT NULL UNIQUE
);

-- -----------------------------------------------------------------------------
-- badges (reference data)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  id              serial  PRIMARY KEY,
  name            varchar NOT NULL UNIQUE,
  description     varchar NOT NULL,
  action_trigger  varchar NOT NULL
);

-- -----------------------------------------------------------------------------
-- marketplace_items (reference data / catalog)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketplace_items (
  id          serial  PRIMARY KEY,
  slug        varchar NOT NULL UNIQUE,
  name        varchar NOT NULL,
  description text,
  point_cost  integer NOT NULL,
  category    text    NOT NULL,
  payload     jsonb   NOT NULL DEFAULT '{}',
  is_active   boolean NOT NULL DEFAULT true,
  stock       integer
);

-- -----------------------------------------------------------------------------
-- events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id           uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                  varchar     NOT NULL,
  description            varchar,
  address                varchar     NOT NULL,
  start_date             timestamptz NOT NULL,
  end_date               timestamptz NOT NULL,
  status                 text        NOT NULL DEFAULT 'ACTIVE',
  registration_deadline  timestamptz,
  registration_status    text        NOT NULL DEFAULT 'OPEN',
  created_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);

-- -----------------------------------------------------------------------------
-- event_roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_roles (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid    NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role_name       varchar NOT NULL,
  description     text,
  slots_needed    integer NOT NULL DEFAULT 1,
  hours_required  integer NOT NULL DEFAULT 0,
  points_reward   integer NOT NULL DEFAULT 0,
  required_skills integer[] DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_event_roles_event_id ON event_roles(event_id);

-- -----------------------------------------------------------------------------
-- applications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id                  uuid                     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id             uuid                     NOT NULL REFERENCES event_roles(id) ON DELETE CASCADE,
  match_score         integer,
  status              applications_status_enum NOT NULL DEFAULT 'PENDING',
  motivation_text     text,
  recommendation_text text,
  created_at          timestamptz              NOT NULL DEFAULT now(),
  CONSTRAINT uq_applications_user_role UNIQUE (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_role_id ON applications(role_id);

-- -----------------------------------------------------------------------------
-- shift_assignments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shift_assignments (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid          NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  role_id        uuid          NOT NULL REFERENCES event_roles(id) ON DELETE CASCADE,
  user_id        uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id       uuid          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  shift_date     date          NOT NULL,
  start_time     time          NOT NULL DEFAULT '09:00',
  end_time       time          NOT NULL DEFAULT '17:00',
  hours          numeric(5, 2) NOT NULL,
  created_at     timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_user_id ON shift_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_event_id ON shift_assignments(event_id);

-- -----------------------------------------------------------------------------
-- volunteer_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteer_logs (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id      uuid          REFERENCES events(id) ON DELETE SET NULL,
  hours_worked  numeric(5, 2) NOT NULL DEFAULT 0,
  points_earned integer       NOT NULL DEFAULT 0,
  completed_at  timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_volunteer_logs_user_id ON volunteer_logs(user_id);

-- -----------------------------------------------------------------------------
-- point_transactions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS point_transactions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      integer     NOT NULL,
  description varchar     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);

-- -----------------------------------------------------------------------------
-- organization_reviews
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_reviews (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id        uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rating          integer     NOT NULL,
  comment         text,
  photo_url       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_org_reviews_reviewer_org_event UNIQUE (reviewer_id, organization_id, event_id)
);

-- -----------------------------------------------------------------------------
-- push_subscriptions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  endpoint   text        NOT NULL UNIQUE,
  keys       jsonb       NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- -----------------------------------------------------------------------------
-- user_skills (junction)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_skills (
  user_id  uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id integer NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
);

-- -----------------------------------------------------------------------------
-- user_badges (junction)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_badges (
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   integer     NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- -----------------------------------------------------------------------------
-- marketplace_purchases
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id         integer     NOT NULL REFERENCES marketplace_items(id),
  point_cost      integer     NOT NULL,
  status          varchar     NOT NULL DEFAULT 'COMPLETED',
  redemption_code text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_user_id ON marketplace_purchases(user_id);

-- -----------------------------------------------------------------------------
-- user_inventory
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_inventory (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id     integer     NOT NULL REFERENCES marketplace_items(id),
  metadata    jsonb       NOT NULL DEFAULT '{}',
  acquired_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);

-- -----------------------------------------------------------------------------
-- user_equipped_cosmetics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_equipped_cosmetics (
  user_id                uuid    PRIMARY KEY,
  name_color_item_id     integer REFERENCES marketplace_items(id),
  name_animation_item_id integer REFERENCES marketplace_items(id),
  avatar_frame_item_id   integer REFERENCES marketplace_items(id),
  glow_item_id           integer REFERENCES marketplace_items(id)
);

-- =============================================================================
-- End of 0001_init
-- =============================================================================
