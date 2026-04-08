-- Migration: store Google Calendar OAuth2 tokens per user (encrypted at rest)

CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  user_id           UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  access_token_enc  TEXT        NOT NULL,
  refresh_token_enc TEXT        NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  scope             TEXT        NOT NULL DEFAULT '',
  calendar_id       TEXT        NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
