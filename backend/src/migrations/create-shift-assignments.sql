-- Migration: shift assignments for volunteer scheduling across event days

CREATE TABLE IF NOT EXISTS shift_assignments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID       NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  role_id       UUID        NOT NULL REFERENCES event_roles(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id      UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  shift_date    DATE        NOT NULL,
  start_time    TIME        NOT NULL DEFAULT '09:00',
  end_time      TIME        NOT NULL DEFAULT '17:00',
  hours         NUMERIC(5,2) NOT NULL,
  google_event_id TEXT      NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_shift_app_date_start
  ON shift_assignments (application_id, shift_date, start_time);

CREATE INDEX IF NOT EXISTS idx_shift_user_date
  ON shift_assignments (user_id, shift_date);

CREATE INDEX IF NOT EXISTS idx_shift_event
  ON shift_assignments (event_id);
