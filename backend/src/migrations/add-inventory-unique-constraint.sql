-- Prevent a user from owning duplicate copies of the same marketplace item.
-- The application layer also checks this, but the DB constraint is the hard stop.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_inventory_user_item_unique'
  ) THEN
    ALTER TABLE user_inventory
      ADD CONSTRAINT user_inventory_user_item_unique
      UNIQUE (user_id, item_id);
  END IF;
END $$;
