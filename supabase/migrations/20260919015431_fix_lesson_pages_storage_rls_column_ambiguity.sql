-- ============================================================
-- Fix: The previous migration still had a column ambiguity bug.
-- Inside the EXISTS subquery, "name" resolved to children.name
-- (the child's display name) instead of storage.objects.name
-- (the file path). We restructure using IN subqueries so that
-- split_part(name, '/', 1) is evaluated on the outer
-- storage.objects row, not the inner children row.
--
-- Upload path format: {child_id}/{lesson_id}/{filename}
-- so split_part(name, '/', 1) = child_id.
-- ============================================================

DROP POLICY IF EXISTS lesson_pages_upload_own ON storage.objects;
DROP POLICY IF EXISTS lesson_pages_read_own ON storage.objects;
DROP POLICY IF EXISTS lesson_pages_update_own ON storage.objects;
DROP POLICY IF EXISTS lesson_pages_delete_own ON storage.objects;

CREATE POLICY lesson_pages_upload_own
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-pages'
    AND split_part(name, '/', 1) IN (
      SELECT c.id::text FROM children c WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY lesson_pages_read_own
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lesson-pages'
    AND split_part(name, '/', 1) IN (
      SELECT c.id::text FROM children c WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY lesson_pages_update_own
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lesson-pages'
    AND split_part(name, '/', 1) IN (
      SELECT c.id::text FROM children c WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'lesson-pages'
    AND split_part(name, '/', 1) IN (
      SELECT c.id::text FROM children c WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY lesson_pages_delete_own
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lesson-pages'
    AND split_part(name, '/', 1) IN (
      SELECT c.id::text FROM children c WHERE c.user_id = auth.uid()
    )
  );
