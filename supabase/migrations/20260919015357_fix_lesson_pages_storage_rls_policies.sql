-- ============================================================
-- Fix: Storage RLS policies for lesson-pages bucket were
-- checking storage.foldername(c.name) (child display name)
-- instead of storage.foldername(name) (the storage.objects
-- name column = the file path). The upload path format is
-- {child_id}/{lesson_id}/{filename}, so the first folder
-- segment is the child's UUID. The old policy compared the
-- child's display name against the child's UUID, which never
-- matched, so every upload was rejected with:
--   "new row violates row-level security policy"
-- ============================================================

-- Drop the broken policies
DROP POLICY IF EXISTS lesson_pages_upload_own ON storage.objects;
DROP POLICY IF EXISTS lesson_pages_read_own ON storage.objects;
DROP POLICY IF EXISTS lesson_pages_update_own ON storage.objects;
DROP POLICY IF EXISTS lesson_pages_delete_own ON storage.objects;

-- Recreate with correct column reference.
-- Upload path format: {child_id}/{lesson_id}/{filename}
-- split_part(name, '/', 1) extracts the first folder = child_id,
-- which we match against children.id for the authenticated user.

CREATE POLICY lesson_pages_upload_own
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-pages'
    AND EXISTS (
      SELECT 1
      FROM children c
      WHERE c.user_id = auth.uid()
        AND split_part(name, '/', 1) = c.id::text
    )
  );

CREATE POLICY lesson_pages_read_own
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lesson-pages'
    AND EXISTS (
      SELECT 1
      FROM children c
      WHERE c.user_id = auth.uid()
        AND split_part(name, '/', 1) = c.id::text
    )
  );

CREATE POLICY lesson_pages_update_own
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lesson-pages'
    AND EXISTS (
      SELECT 1
      FROM children c
      WHERE c.user_id = auth.uid()
        AND split_part(name, '/', 1) = c.id::text
    )
  )
  WITH CHECK (
    bucket_id = 'lesson-pages'
    AND EXISTS (
      SELECT 1
      FROM children c
      WHERE c.user_id = auth.uid()
        AND split_part(name, '/', 1) = c.id::text
    )
  );

CREATE POLICY lesson_pages_delete_own
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lesson-pages'
    AND EXISTS (
      SELECT 1
      FROM children c
      WHERE c.user_id = auth.uid()
        AND split_part(name, '/', 1) = c.id::text
    )
  );
