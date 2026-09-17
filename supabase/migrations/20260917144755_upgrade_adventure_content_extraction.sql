/*
# Adventure Content Extraction & Visual Scenes Schema

This migration upgrades the adventure platform to support real AI-based content
extraction from uploaded lesson page images, and visual scene-based adventures
instead of text-only cards.

## Changes

1. **adventures table** — Add columns:
   - `extracted_content` (jsonb): Raw text/content extracted from lesson page images via OCR/AI
   - `concepts` (jsonb): Array of {name, description, source_page} concept objects
   - `error_message` (text): Error message if generation failed
   - `updated_at` (timestamptz): Last update timestamp

2. **scenes table** — Add columns for visual scene data:
   - `visual_description` (text): AI-generated description of the visual scene
   - `on_screen_text` (text): Educational text displayed on screen (formal Arabic)
   - `voice_text` (text): Character voice dialogue (Egyptian Arabic)
   - `duration_seconds` (integer): Estimated scene duration
   - `concept_id` (text): Concept this scene teaches
   - `source_page_index` (integer): Which lesson page this scene is derived from
   - `scene_type` (text): 'scene' | 'question' | 'intro' | 'outro'
   - `visual_url` (text): URL to generated visual/image (when available)

3. **questions table** — Add columns:
   - `source_fact` (text): The fact from the textbook this question is based on
   - `source_page_index` (integer): Which lesson page the answer comes from

4. **progress table** — Add columns:
   - `current_scene_index` (integer): Which scene the child is currently on
   - `adventure_id` (uuid): Link to the specific adventure

5. **adventure_status enum** — adventures.status now supports: not_created, generating, ready, failed

All new columns are nullable or have safe defaults so existing data is preserved.
RLS policies are unchanged — existing policies already cover all CRUD operations.
*/

-- ============================================================
-- ADVENTURES: Add content extraction columns
-- ============================================================
ALTER TABLE adventures
  ADD COLUMN IF NOT EXISTS extracted_content jsonb,
  ADD COLUMN IF NOT EXISTS concepts jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS error_message text DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update existing adventures with new default status values
UPDATE adventures SET status = 'ready' WHERE status = 'pending';

-- ============================================================
-- SCENES: Add visual scene columns
-- ============================================================
ALTER TABLE scenes
  ADD COLUMN IF NOT EXISTS visual_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS on_screen_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS voice_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS concept_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_page_index integer,
  ADD COLUMN IF NOT EXISTS scene_type text DEFAULT 'scene',
  ADD COLUMN IF NOT EXISTS visual_url text DEFAULT '';

-- Backfill voice_text and on_screen_text from existing columns for old data
UPDATE scenes
  SET on_screen_text = scene_text,
      voice_text = dialogue_text
  WHERE on_screen_text = '' AND scene_text != '';

-- ============================================================
-- QUESTIONS: Add source tracking columns
-- ============================================================
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS source_fact text DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_page_index integer;

-- ============================================================
-- PROGRESS: Add scene tracking columns
-- ============================================================
ALTER TABLE progress
  ADD COLUMN IF NOT EXISTS current_scene_index integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adventure_id uuid REFERENCES adventures(id) ON DELETE SET NULL;

-- ============================================================
-- Indexes for new columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_adventures_status ON adventures(status);
CREATE INDEX IF NOT EXISTS idx_scenes_scene_type ON scenes(scene_type);
