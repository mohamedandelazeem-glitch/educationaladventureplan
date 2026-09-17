-- Create storage bucket for lesson page images
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-pages', 'lesson-pages', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only authenticated users can manage their own lesson pages
-- Paths are structured as: {child_id}/{lesson_id}/{filename}
DROP POLICY IF EXISTS "lesson_pages_upload_own" ON storage.objects;
CREATE POLICY "lesson_pages_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-pages'
    AND EXISTS (
      SELECT 1 FROM children c
      WHERE c.user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.id::text
    )
  );

DROP POLICY IF EXISTS "lesson_pages_read_own" ON storage.objects;
CREATE POLICY "lesson_pages_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'lesson-pages'
    AND EXISTS (
      SELECT 1 FROM children c
      WHERE c.user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.id::text
    )
  );

DROP POLICY IF EXISTS "lesson_pages_update_own" ON storage.objects;
CREATE POLICY "lesson_pages_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'lesson-pages'
    AND EXISTS (
      SELECT 1 FROM children c
      WHERE c.user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.id::text
    )
  );

DROP POLICY IF EXISTS "lesson_pages_delete_own" ON storage.objects;
CREATE POLICY "lesson_pages_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'lesson-pages'
    AND EXISTS (
      SELECT 1 FROM children c
      WHERE c.user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.id::text
    )
  );
