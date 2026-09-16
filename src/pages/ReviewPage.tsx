import { useEffect, useState } from 'react';
import { Rocket, ArrowRight, RotateCcw, Lightbulb, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { CHARACTERS } from '@/lib/types';
import type { Child, Concept, Lesson, Adventure, Scene, Question } from '@/lib/types';

interface ReviewPageProps {
  onBack: () => void;
}

export function ReviewPage({ onBack }: ReviewPageProps) {
  const [child, setChild] = useState<Child | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConcept, setActiveConcept] = useState<Concept | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [phase, setPhase] = useState<'list' | 'scene' | 'question' | 'correct' | 'wrong' | 'done'>('list');
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: childData } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!childData) { setLoading(false); return; }
      setChild(childData as Child);
      const { data: conceptsData } = await supabase
        .from('concepts')
        .select('*')
        .eq('child_id', childData.id)
        .eq('status', 'needs_review');
      setConcepts((conceptsData ?? []) as Concept[]);
      setLoading(false);
    })();
  }, []);

  const startReview = async (concept: Concept) => {
    setActiveConcept(concept);
    setSceneIdx(0);
    setQIdx(0);
    setCorrectCount(0);
    setPhase('scene');

    if (concept.lesson_id) {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', concept.lesson_id)
        .maybeSingle();
      setLesson(lessonData as Lesson);

      const { data: advData } = await supabase
        .from('adventures')
        .select('*')
        .eq('lesson_id', concept.lesson_id)
        .maybeSingle();
      if (advData) {
        const [scenesRes, questionsRes] = await Promise.all([
          supabase.from('scenes').select('*').eq('adventure_id', advData.id).order('order_index', { ascending: true }),
          supabase.from('questions').select('*').eq('adventure_id', advData.id).order('order_index', { ascending: true }),
        ]);
        setScenes((scenesRes.data ?? []) as Scene[]);
        setQuestions((questionsRes.data ?? []) as Question[]);
      }
    }
  };

  const handleAnswer = (answer: string) => {
    const q = questions[qIdx];
    if (!q) return;
    if (answer === q.correct_answer) {
      setCorrectCount((c) => c + 1);
      setPhase('correct');
    } else {
      setPhase('wrong');
    }
  };

  const next = () => {
    if (phase === 'scene') {
      if (sceneIdx + 1 < scenes.length) {
        setSceneIdx((i) => i + 1);
      } else if (questions.length > 0) {
        setPhase('question');
      } else {
        setPhase('done');
      }
    } else if (phase === 'correct' || phase === 'wrong') {
      if (qIdx + 1 < questions.length) {
        setQIdx((i) => i + 1);
        setPhase('question');
      } else {
        setPhase('done');
      }
    }
  };

  const finishReview = async () => {
    if (activeConcept && child && correctCount >= questions.length * 0.7) {
      await supabase
        .from('concepts')
        .update({ status: 'mastered' })
        .eq('id', activeConcept.id);
    }
    setActiveConcept(null);
    setPhase('list');
    // Refresh concepts
    if (child) {
      const { data } = await supabase
        .from('concepts')
        .select('*')
        .eq('child_id', child.id)
        .eq('status', 'needs_review');
      setConcepts((data ?? []) as Concept[]);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    );
  }

  const character = child ? CHARACTERS.find((c) => c.id === child.character) ?? CHARACTERS[0] : CHARACTERS[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 glass border-b border-gray-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning-400 to-primary-500 text-white shadow-lg">
              <RotateCcw className="h-6 w-6" />
            </div>
            <span className="font-display text-lg font-extrabold text-gray-800">المراجعة</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
            العودة
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* LIST PHASE */}
        {phase === 'list' && (
          <div className="animate-slide-up">
            <div className="mb-8 text-center">
              <div className="mb-4 text-6xl animate-float">{character.emoji}</div>
              <h1 className="font-display text-2xl font-extrabold text-gray-900">مفاهيم تحتاج إلى مراجعة</h1>
              <p className="mt-2 text-gray-500">لدينا بعض المفاهيم التي تستحق أن نكتشفها مرة أخرى.</p>
            </div>

            {concepts.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center card-shadow">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 text-success-500">
                  <Check className="h-8 w-8" />
                </div>
                <p className="text-lg font-bold text-gray-700">لا توجد مفاهيم تحتاج مراجعة</p>
                <p className="mt-1 text-sm text-gray-400">طفلك أتقن جميع المفاهيم!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {concepts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => startReview(c)}
                    className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 card-shadow transition-all hover:-translate-y-0.5 hover:card-shadow-lg"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-50 text-warning-600">
                      <Lightbulb className="h-6 w-6" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-bold text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">يحتاج إلى مراجعة</p>
                    </div>
                    <RotateCcw className="h-5 w-5 text-primary-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SCENE PHASE */}
        {phase === 'scene' && activeConcept && scenes[sceneIdx] && (
          <div className="animate-slide-up">
            <div className="mb-4 text-center">
              <span className="rounded-full bg-primary-50 px-4 py-1 text-sm font-bold text-primary-600">
                مراجعة: {activeConcept.name}
              </span>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-warning-50 via-white to-primary-50/30 p-8 card-shadow-lg">
              <div className="mb-6 text-center text-7xl animate-float">
                {scenes[sceneIdx].illustration_emoji || '🌟'}
              </div>
              <div className="mx-auto max-w-lg space-y-4">
                <div className="rounded-2xl bg-white p-5 card-shadow">
                  <p className="text-lg font-bold leading-relaxed text-gray-800">
                    {scenes[sceneIdx].scene_text}
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-primary-50 p-4">
                  <span className="text-2xl">{character.emoji}</span>
                  <p className="flex-1 pt-1 text-base text-gray-700" style={{ direction: 'rtl' }}>
                    {scenes[sceneIdx].dialogue_text}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button size="lg" onClick={next}>
                التالي
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* QUESTION PHASE */}
        {phase === 'question' && activeConcept && questions[qIdx] && (
          <div className="animate-slide-up">
            <div className="mb-4 text-center">
              <span className="rounded-full bg-secondary-50 px-4 py-1 text-sm font-bold text-secondary-600">
                السؤال {qIdx + 1} من {questions.length}
              </span>
            </div>
            <div className="rounded-3xl bg-white p-8 card-shadow-lg">
              <h2 className="mb-6 text-center font-display text-xl font-bold text-gray-900">
                {questions[qIdx].question_text}
              </h2>
              <div className="space-y-3">
                {(['a', 'b', 'c'] as const).map((opt) => {
                  const text = opt === 'a' ? questions[qIdx].option_a : opt === 'b' ? questions[qIdx].option_b : questions[qIdx].option_c;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-6 py-4 text-right transition-all hover:border-primary-400 hover:bg-primary-50 active:scale-[0.98]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-600">
                        {opt === 'a' ? 'أ' : opt === 'b' ? 'ب' : 'ج'}
                      </span>
                      <span className="flex-1 text-gray-700">{text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CORRECT */}
        {phase === 'correct' && (
          <div className="text-center animate-bounce-in">
            <div className="mb-6 text-7xl animate-pop">🌟</div>
            <h2 className="font-display text-3xl font-extrabold text-success-600">أحسنت! إجابة صحيحة.</h2>
            <Button size="lg" variant="success" className="mt-8" onClick={next}>
              متابعة
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* WRONG */}
        {phase === 'wrong' && questions[qIdx] && (
          <div className="text-center animate-slide-up">
            <div className="mb-6 text-6xl">💪</div>
            <h2 className="font-display text-2xl font-extrabold text-warning-600">حاول مرة أخرى.</h2>
            <div className="mx-auto mt-6 max-w-md rounded-2xl bg-warning-50 p-5 ring-1 ring-warning-200">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning-600" />
                <p className="font-bold text-gray-700">{questions[qIdx].hint}</p>
              </div>
            </div>
            <Button size="lg" variant="primary" className="mt-6" onClick={() => setPhase('question')}>
              <RotateCcw className="h-5 w-5" />
              حاول مرة أخرى
            </Button>
          </div>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <div className="text-center animate-bounce-in">
            <div className="mb-6 text-8xl animate-float">🎉</div>
            <h2 className="font-display text-3xl font-extrabold text-gray-900">انتهت المراجعة!</h2>
            <p className="mt-3 text-lg text-gray-500">
              الإجابات الصحيحة: {correctCount} من {questions.length}
            </p>
            {correctCount >= questions.length * 0.7 ? (
              <div className="mx-auto mt-6 max-w-md rounded-2xl bg-success-50 p-5 ring-1 ring-success-200">
                <p className="font-bold text-success-700">أحسنت! لقد أتقنت هذا المفهوم.</p>
              </div>
            ) : null}
            <div className="mt-8 flex justify-center gap-3">
              <Button size="lg" onClick={finishReview}>
                <Check className="h-5 w-5" />
                العودة للمراجعات
              </Button>
              <Button size="lg" variant="outline" onClick={onBack}>
                الرئيسية
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
