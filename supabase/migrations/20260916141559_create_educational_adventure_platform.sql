/*
# Educational Adventure Platform Schema

This migration creates the full database schema for an Arabic educational platform
where mothers set up curriculum terms, upload lesson pages, and children learn
through interactive adventures with scenes and questions.

## Tables

1. **children** — One child profile per parent (auth user). Stores name, age, grade,
   and selected companion character.
2. **units** — Curriculum units within a term (e.g. "Unit 1"), owned by the parent.
3. **lessons** — Individual lessons within a unit, with order and status tracking.
4. **lesson_pages** — Images uploaded for each lesson (page images of the textbook).
5. **adventures** — Generated adventure for a lesson, with scenes and questions.
6. **scenes** — Individual cartoon scenes within an adventure (text + dialogue).
7. **questions** — Multiple-choice questions within an adventure.
8. **progress** — Per-lesson progress for the child (scenes completed, correct answers, etc.).
9. **concepts** — Concepts mastered or needing review, tracked per child.

## Security

- All tables are owner-scoped to the authenticated parent via user_id or through
  parent-owned relationships.
- RLS enabled on every table.
- 4 CRUD policies per table (select/insert/update/delete), scoped to authenticated
  users who own the data.
- children.user_id defaults to auth.uid() so inserts without explicit user_id succeed.
- Child tables (units→lessons→pages, adventures→scenes/questions, progress, concepts)
  are scoped through their parent chain back to the owning user.
*/

-- ============================================================
-- CHILDREN
-- ============================================================
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  age integer NOT NULL DEFAULT 8,
  grade text NOT NULL DEFAULT '',
  character text NOT NULL DEFAULT 'fox',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_children" ON children;
CREATE POLICY "select_own_children" ON children FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_children" ON children;
CREATE POLICY "insert_own_children" ON children FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_children" ON children;
CREATE POLICY "update_own_children" ON children FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_children" ON children;
CREATE POLICY "delete_own_children" ON children FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- UNITS
-- ============================================================
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL DEFAULT 'العلوم',
  term text NOT NULL DEFAULT 'الترم الأول',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_units" ON units;
CREATE POLICY "select_own_units" ON units FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_units" ON units;
CREATE POLICY "insert_own_units" ON units FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_units" ON units;
CREATE POLICY "update_own_units" ON units FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_units" ON units;
CREATE POLICY "delete_own_units" ON units FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- LESSONS
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'not_started',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lessons" ON lessons;
CREATE POLICY "select_own_lessons" ON lessons FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM units WHERE units.id = lessons.unit_id AND units.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_lessons" ON lessons;
CREATE POLICY "insert_own_lessons" ON lessons FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM units WHERE units.id = lessons.unit_id AND units.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_lessons" ON lessons;
CREATE POLICY "update_own_lessons" ON lessons FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM units WHERE units.id = lessons.unit_id AND units.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM units WHERE units.id = lessons.unit_id AND units.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_lessons" ON lessons;
CREATE POLICY "delete_own_lessons" ON lessons FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM units WHERE units.id = lessons.unit_id AND units.user_id = auth.uid())
  );

-- ============================================================
-- LESSON_PAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lesson_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lesson_pages" ON lesson_pages;
CREATE POLICY "select_own_lesson_pages" ON lesson_pages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN units u ON u.id = l.unit_id
      WHERE l.id = lesson_pages.lesson_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_lesson_pages" ON lesson_pages;
CREATE POLICY "insert_own_lesson_pages" ON lesson_pages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN units u ON u.id = l.unit_id
      WHERE l.id = lesson_pages.lesson_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_lesson_pages" ON lesson_pages;
CREATE POLICY "update_own_lesson_pages" ON lesson_pages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN units u ON u.id = l.unit_id
      WHERE l.id = lesson_pages.lesson_id AND u.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN units u ON u.id = l.unit_id
      WHERE l.id = lesson_pages.lesson_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_lesson_pages" ON lesson_pages;
CREATE POLICY "delete_own_lesson_pages" ON lesson_pages FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN units u ON u.id = l.unit_id
      WHERE l.id = lesson_pages.lesson_id AND u.user_id = auth.uid()
    )
  );

-- ============================================================
-- ADVENTURES
-- ============================================================
CREATE TABLE IF NOT EXISTS adventures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_adventures" ON adventures;
CREATE POLICY "select_own_adventures" ON adventures FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN units u ON u.id = l.unit_id
      WHERE l.id = adventures.lesson_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_adventures" ON adventures;
CREATE POLICY "insert_own_adventures" ON adventures FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN units u ON u.id = l.unit_id
      WHERE l.id = adventures.lesson_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_adventures" ON adventures;
CREATE POLICY "update_own_adventures" ON adventures FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN units u ON u.id = l.unit_id
      WHERE l.id = adventures.lesson_id AND u.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN units u ON u.id = l.unit_id
      WHERE l.id = adventures.lesson_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_adventures" ON adventures;
CREATE POLICY "delete_own_adventures" ON adventures FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN units u ON u.id = l.unit_id
      WHERE l.id = adventures.lesson_id AND u.user_id = auth.uid()
    )
  );

-- ============================================================
-- SCENES
-- ============================================================
CREATE TABLE IF NOT EXISTS scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id uuid NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  scene_text text NOT NULL,
  dialogue_text text NOT NULL DEFAULT '',
  illustration_emoji text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scenes" ON scenes;
CREATE POLICY "select_own_scenes" ON scenes FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM adventures a
      JOIN lessons l ON l.id = a.lesson_id
      JOIN units u ON u.id = l.unit_id
      WHERE a.id = scenes.adventure_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_scenes" ON scenes;
CREATE POLICY "insert_own_scenes" ON scenes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM adventures a
      JOIN lessons l ON l.id = a.lesson_id
      JOIN units u ON u.id = l.unit_id
      WHERE a.id = scenes.adventure_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_scenes" ON scenes;
CREATE POLICY "update_own_scenes" ON scenes FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM adventures a
      JOIN lessons l ON l.id = a.lesson_id
      JOIN units u ON u.id = l.unit_id
      WHERE a.id = scenes.adventure_id AND u.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM adventures a
      JOIN lessons l ON l.id = a.lesson_id
      JOIN units u ON u.id = l.unit_id
      WHERE a.id = scenes.adventure_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_scenes" ON scenes;
CREATE POLICY "delete_own_scenes" ON scenes FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM adventures a
      JOIN lessons l ON l.id = a.lesson_id
      JOIN units u ON u.id = l.unit_id
      WHERE a.id = scenes.adventure_id AND u.user_id = auth.uid()
    )
  );

-- ============================================================
-- QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id uuid NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  scene_id uuid REFERENCES scenes(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  correct_answer text NOT NULL DEFAULT 'a',
  hint text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_questions" ON questions;
CREATE POLICY "select_own_questions" ON questions FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM adventures a
      JOIN lessons l ON l.id = a.lesson_id
      JOIN units u ON u.id = l.unit_id
      WHERE a.id = questions.adventure_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_questions" ON questions;
CREATE POLICY "insert_own_questions" ON questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM adventures a
      JOIN lessons l ON l.id = a.lesson_id
      JOIN units u ON u.id = l.unit_id
      WHERE a.id = questions.adventure_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_questions" ON questions;
CREATE POLICY "update_own_questions" ON questions FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM adventures a
      JOIN lessons l ON l.id = a.lesson_id
      JOIN units u ON u.id = l.unit_id
      WHERE a.id = questions.adventure_id AND u.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM adventures a
      JOIN lessons l ON l.id = a.lesson_id
      JOIN units u ON u.id = l.unit_id
      WHERE a.id = questions.adventure_id AND u.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_questions" ON questions;
CREATE POLICY "delete_own_questions" ON questions FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM adventures a
      JOIN lessons l ON l.id = a.lesson_id
      JOIN units u ON u.id = l.unit_id
      WHERE a.id = questions.adventure_id AND u.user_id = auth.uid()
    )
  );

-- ============================================================
-- PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  scenes_completed integer NOT NULL DEFAULT 0,
  total_scenes integer NOT NULL DEFAULT 0,
  questions_answered integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_progress" ON progress;
CREATE POLICY "select_own_progress" ON progress FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = progress.child_id AND children.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_progress" ON progress;
CREATE POLICY "insert_own_progress" ON progress FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM children WHERE children.id = progress.child_id AND children.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_progress" ON progress;
CREATE POLICY "update_own_progress" ON progress FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = progress.child_id AND children.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM children WHERE children.id = progress.child_id AND children.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_progress" ON progress;
CREATE POLICY "delete_own_progress" ON progress FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = progress.child_id AND children.user_id = auth.uid())
  );

-- ============================================================
-- CONCEPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'needs_review',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_concepts" ON concepts;
CREATE POLICY "select_own_concepts" ON concepts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = concepts.child_id AND children.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_concepts" ON concepts;
CREATE POLICY "insert_own_concepts" ON concepts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM children WHERE children.id = concepts.child_id AND children.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_concepts" ON concepts;
CREATE POLICY "update_own_concepts" ON concepts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = concepts.child_id AND children.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM children WHERE children.id = concepts.child_id AND children.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_concepts" ON concepts;
CREATE POLICY "delete_own_concepts" ON concepts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = concepts.child_id AND children.user_id = auth.uid())
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_units_child_id ON units(child_id);
CREATE INDEX IF NOT EXISTS idx_units_user_id ON units(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_unit_id ON lessons(unit_id);
CREATE INDEX IF NOT EXISTS idx_lesson_pages_lesson_id ON lesson_pages(lesson_id);
CREATE INDEX IF NOT EXISTS idx_adventures_lesson_id ON adventures(lesson_id);
CREATE INDEX IF NOT EXISTS idx_scenes_adventure_id ON scenes(adventure_id);
CREATE INDEX IF NOT EXISTS idx_questions_adventure_id ON questions(adventure_id);
CREATE INDEX IF NOT EXISTS idx_progress_child_id ON progress(child_id);
CREATE INDEX IF NOT EXISTS idx_concepts_child_id ON concepts(child_id);
