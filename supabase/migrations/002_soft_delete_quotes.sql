-- Soft delete for quotes: instead of hard DELETE, set deleted_at timestamp.
-- Records with deleted_at IS NOT NULL are hidden from all list queries.
-- Can be recovered via SQL: UPDATE quotes SET deleted_at = NULL WHERE id = '...';

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
