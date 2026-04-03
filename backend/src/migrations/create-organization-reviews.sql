-- Run this on Supabase SQL editor before deploying
CREATE TABLE IF NOT EXISTS organization_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reviewer_id, organization_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_org_reviews_organization_id ON organization_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_reviews_reviewer_id ON organization_reviews(reviewer_id);
