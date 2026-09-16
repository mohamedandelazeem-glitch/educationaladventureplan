export interface Child {
  id: string;
  user_id: string;
  name: string;
  age: number;
  grade: string;
  character: string;
  created_at: string;
}

export interface Unit {
  id: string;
  user_id: string;
  child_id: string;
  name: string;
  subject: string;
  term: string;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  unit_id: string;
  name: string;
  order_index: number;
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
}

export interface LessonPage {
  id: string;
  lesson_id: string;
  image_url: string;
  order_index: number;
  created_at: string;
}

export interface Adventure {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  status: 'pending' | 'ready';
  created_at: string;
}

export interface Scene {
  id: string;
  adventure_id: string;
  order_index: number;
  scene_text: string;
  dialogue_text: string;
  illustration_emoji: string;
  created_at: string;
}

export interface Question {
  id: string;
  adventure_id: string;
  scene_id: string | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_answer: 'a' | 'b' | 'c';
  hint: string;
  order_index: number;
  created_at: string;
}

export interface Progress {
  id: string;
  child_id: string;
  lesson_id: string;
  scenes_completed: number;
  total_scenes: number;
  questions_answered: number;
  correct_answers: number;
  total_questions: number;
  is_completed: boolean;
  completed_at: string | null;
  updated_at: string;
}

export interface Concept {
  id: string;
  child_id: string;
  lesson_id: string | null;
  name: string;
  status: 'mastered' | 'needs_review';
  created_at: string;
}

export type Character = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

export const CHARACTERS: Character[] = [
  { id: 'fox', name: 'الثعلب', emoji: '🦊', color: 'orange' },
  { id: 'panda', name: 'الباندا', emoji: '🐼', color: 'slate' },
  { id: 'robot', name: 'الروبوت', emoji: '🤖', color: 'blue' },
  { id: 'dino', name: 'الديناصور', emoji: '🦖', color: 'emerald' },
  { id: 'explorer', name: 'المستكشف', emoji: '🚀', color: 'violet' },
];
