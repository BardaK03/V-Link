-- Migration: add registration deadline and status to events
-- Run this on your Supabase/Postgres database

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS registration_status   TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (registration_status IN ('OPEN', 'CLOSED'));

CREATE INDEX IF NOT EXISTS idx_events_registration_closing
  ON events (registration_status, registration_deadline)
  WHERE registration_status = 'OPEN';
