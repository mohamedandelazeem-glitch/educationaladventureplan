import { useEffect, useState } from 'react';
import { Rocket, ArrowRight, Check, X, Lightbulb, Star, Trophy, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { CHARACTERS } from '@/lib/types';
import type { Child, Lesson, Adventure, Scene, Question } from '@/lib/types';

interface AdventurePageProps {
  lessonId: string;
  onBack: () => void;
}

type Phase = 'intro' | 'scene' | 'question' | 'correct' | 'wrong' | 'hint' | 'complete' | 'result';

export function AdventurePage({ lessonId, onBack }: AdventurePageProps) {
  const [child, setChild] = useState<Child | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [phase, setPhase] = useState<Phase>('intro');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [scenesCompleted, setScenesCompleted] = useState(0);

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

      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();
      setLesson(lessonData as Lesson);

      const { data: advData } = await supabase
        .from('adventures')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();
      setAdventure(advData as Adventure);

      if (advData) {
        const [scenesRes, questionsRes] = await Promise.all([
          supabase.from('scenes').select('*').eq('adventure_id', advData.id).order('order_index', { ascending: true }),
          supabase.from('questions').select('*').eq('adventure_id', advData.id).order('order_index', { ascending: true }),
        ]);
        setScenes((scenesRes.data ?? []) as Scene[]);
        setQuestions((questionsRes.data ?? []) as Question[]);
      }
      setLoading(false);
    })();
  }, [lessonId]);

  const character = child ? CHARACTERS.find((c) => c.id === child.character) ?? CHARACTERS[0] : CHARACTERS[0];

  const handleAnswer = (answer: string) => {
    const currentQ = questions[questionIndex];
    if (!currentQ) return;
    setSelectedAnswer(answer);
    setAnsweredCount((c) => c + 1);
    if (answer === currentQ.correct_answer) {
      setCorrectCount((c) => c + 1);
      setPhase('correct');
    } else {
      setPhase('wrong');
    }
  };

  const nextAfterQuestion = () => {
    setSelectedAnswer(null);
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex((i) => i + 1);
      setPhase('question');
    } else {
      setPhase('complete');
    }
  };

  const handleNextScene = () => {
    setScenesCompleted((c) => c + 1);
    if (sceneIndex + 1 < scenes.length) {
      setSceneIndex((i) => i + 1);
      setPhase('scene');
    } else if (questions.length > 0) {
      setPhase('question');
    } else {
      setPhase('complete');
    }
  };

  const handleComplete = async () => {
    if (!child || !lesson) return;

    // Save/update progress
    const { data: existingProg } = await supabase
      .from('progress')
      .select('*')
      .eq('child_id', child.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle();

    const totalQ = questions.length;
    if (existingProg) {
      await supabase
        .from('progress')
        .update({
          scenes_completed: scenes.length,
          total_scenes: scenes.length,
          questions_answered: answeredCount,
          correct_answers: correctCount,
          total_questions: totalQ,
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProg.id);
    } else {
      await supabase.from('progress').insert({
        child_id: child.id,
        lesson_id: lesson.id,
        scenes_completed: scenes.length,
        total_scenes: scenes.length,
        questions_answered: answeredCount,
        correct_answers: correctCount,
        total_questions: totalQ,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    // Update lesson status to completed
    await supabase.from('lessons').update({ status: 'completed' }).eq('id', lesson.id);

    // Add concepts
    if (correctCount >= totalQ * 0.7) {
      await supabase.from('concepts').upsert({
        child_id: child.id,
        lesson_id: lesson.id,
        name: lesson.name,
        status: 'mastered',
      }, { onConflict: 'child_id,lesson_id,name' });
    } else {
      await supabase.from('concepts').upsert({
        child_id: child.id,
        lesson_id: lesson.id,
        name: lesson.name,
        status: 'needs_review',
      }, { onConflict: 'child_id,lesson_id,name' });
    }

    setPhase('result');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    );
  }

  if (!adventure || scenes.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-50 text-warning-500">
          <Lightbulb className="h-8 w-8" />
        </div>
        <h2 className="font-display text-xl font-bold text-gray-800">المغامرة غير جاهزة بعد</h2>
        <p className="mt-2 text-center text-gray-500">يرجى رفع صفحات الدرس وإنشاء المغامرة أولًا.</p>
        <Button variant="primary" className="mt-6" onClick={onBack}>العودة</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-gray-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary-600">
            <ArrowRight className="h-4 w-4" />
            العودة
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 text-white">
              <Rocket className="h-5 w-5" />
            </div>
            <span className="font-display text-sm font-extrabold text-gray-800">{lesson?.name}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-accent-500 transition-all duration-500"
            style={{
              width: `${Math.min(100, ((scenesCompleted + answeredCount) / (scenes.length + questions.length)) * 100)}%`,
            }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* INTRO */}
        {phase === 'intro' && (
          <div className="text-center animate-bounce-in">
            <div className="mb-6 text-7xl animate-float">{character.emoji}</div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900">{lesson?.name}</h1>
            <div className="mx-auto mt-6 max-w-lg rounded-2xl bg-white p-6 card-shadow">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="text-2xl">{character.emoji}</span>
                <span className="font-bold text-gray-700">{character.name} يقول:</span>
              </div>
              <p className="text-lg text-gray-600" style={{ direction: 'rtl' }}>
                "مستعد نكتشف إزاي النبات بيبدأ حياته وبيكبر؟ يلا بينا!"
              </p>
            </div>
            <p className="mt-6 text-lg font-bold text-gray-700">هيا نكتشف مراحل {lesson?.name}.</p>
            <Button size="lg" className="mt-8" onClick={() => setPhase('scene')}>
              <Rocket className="h-5 w-5" />
              ابدأ المغامرة
            </Button>
          </div>
        )}

        {/* SCENE */}
        {phase === 'scene' && scenes[sceneIndex] && (
          <div className="animate-slide-up">
            <div className="mb-4 text-center">
              <span className="rounded-full bg-primary-50 px-4 py-1 text-sm font-bold text-primary-600">
                المشهد {sceneIndex + 1} من {scenes.length}
              </span>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-blue-50 via-white to-primary-50/30 p-8 card-shadow-lg">
              <div className="mb-6 text-center">
                <div className="text-7xl animate-float" style={{ animationDelay: `${sceneIndex * 200}ms` }}>
                  {scenes[sceneIndex].illustration_emoji || '🌟'}
                </div>
              </div>
              <div className="mx-auto max-w-lg space-y-4">
                <div className="rounded-2xl bg-white p-5 card-shadow">
                  <p className="text-lg font-bold leading-relaxed text-gray-800">
                    {scenes[sceneIndex].scene_text}
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-primary-50 p-4">
                  <span className="text-2xl">{character.emoji}</span>
                  <p className="flex-1 pt-1 text-base text-gray-700" style={{ direction: 'rtl' }}>
                    {scenes[sceneIndex].dialogue_text}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button size="lg" onClick={handleNextScene}>
                {sceneIndex + 1 < scenes.length ? 'المشهد التالي' : 'الأسئلة'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* QUESTION */}
        {phase === 'question' && questions[questionIndex] && (
          <div className="animate-slide-up">
            <div className="mb-4 text-center">
              <span className="rounded-full bg-secondary-50 px-4 py-1 text-sm font-bold text-secondary-600">
                السؤال {questionIndex + 1} من {questions.length}
              </span>
            </div>
            <div className="rounded-3xl bg-white p-8 card-shadow-lg">
              <h2 className="mb-6 text-center font-display text-xl font-bold text-gray-900">
                {questions[questionIndex].question_text}
              </h2>
              <div className="space-y-3">
                {(['a', 'b', 'c'] as const).map((opt) => {
                  const text = opt === 'a' ? questions[questionIndex].option_a
                    : opt === 'b' ? questions[questionIndex].option_b
                    : questions[questionIndex].option_c;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-6 py-4 text-right transition-all hover:border-primary-400 hover:bg-primary-50 active:scale-[0.98]"
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-600">
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
            <div className="mx-auto mt-6 max-w-md rounded-2xl bg-primary-50 p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{character.emoji}</span>
                <p className="flex-1 text-gray-700" style={{ direction: 'rtl' }}>
                  "برافو! إجابتك صح. يلا نكمل!"
                </p>
              </div>
            </div>
            <Button size="lg" variant="success" className="mt-8" onClick={nextAfterQuestion}>
              متابعة
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* WRONG */}
        {phase === 'wrong' && (
          <div className="text-center animate-slide-up">
            <div className="mb-6 text-6xl">💪</div>
            <h2 className="font-display text-2xl font-extrabold text-warning-600">حاول مرة أخرى.</h2>
            <div className="mx-auto mt-6 max-w-md rounded-2xl bg-primary-50 p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{character.emoji}</span>
                <p className="flex-1 text-gray-700" style={{ direction: 'rtl' }}>
                  "قريب! افتكر اللي شفناه في المشهد."
                </p>
              </div>
            </div>
            <Button size="lg" variant="outline" className="mt-6" onClick={() => setPhase('hint')}>
              <Lightbulb className="h-5 w-5" />
              تلميح
            </Button>
            <Button size="lg" variant="primary" className="mt-6 mr-3" onClick={() => { setSelectedAnswer(null); setPhase('question'); }}>
              <RotateCcw className="h-5 w-5" />
              حاول مرة أخرى
            </Button>
          </div>
        )}

        {/* HINT */}
        {phase === 'hint' && questions[questionIndex] && (
          <div className="text-center animate-slide-up">
            <div className="mx-auto max-w-md rounded-2xl bg-warning-50 p-6 ring-1 ring-warning-200">
              <div className="mb-3 flex items-center justify-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning-600" />
                <span className="font-bold text-warning-700">تلميح</span>
              </div>
              <p className="text-lg font-bold text-gray-700">{questions[questionIndex].hint}</p>
            </div>
            <Button size="lg" variant="primary" className="mt-6" onClick={() => { setSelectedAnswer(null); setPhase('question'); }}>
              <RotateCcw className="h-5 w-5" />
              حاول مرة أخرى
            </Button>
          </div>
        )}

        {/* COMPLETE */}
        {phase === 'complete' && (
          <div className="text-center animate-bounce-in">
            <div className="mb-6 text-8xl animate-float">🎉</div>
            <h2 className="font-display text-3xl font-extrabold text-gray-900">أحسنت! لقد أكملت المغامرة!</h2>
            <p className="mt-3 text-lg text-gray-500">لقد اكتشفت اليوم:</p>
            <div className="mx-auto mt-6 max-w-md space-y-2 text-right">
              {scenes.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-3 card-shadow">
                  <Check className="h-5 w-5 text-success-500" />
                  <span className="text-sm text-gray-700">{s.scene_text.slice(0, 60)}...</span>
                </div>
              ))}
            </div>
            <Button size="lg" className="mt-8" onClick={handleComplete}>
              <Trophy className="h-5 w-5" />
              تحدي النهاية
            </Button>
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <div className="text-center animate-bounce-in">
            <div className="mb-6 text-8xl animate-float">🌟</div>
            <h2 className="font-display text-3xl font-extrabold text-gray-900">مغامرة رائعة!</h2>
            <div className="mx-auto mt-6 max-w-md rounded-3xl bg-white p-8 card-shadow-lg">
              <p className="text-lg text-gray-600">الإجابات الصحيحة:</p>
              <p className="mt-2 font-display text-5xl font-extrabold text-primary-600">
                {correctCount} من {questions.length}
              </p>

              <div className="mt-8 space-y-3 text-right">
                <div>
                  <p className="mb-2 font-bold text-gray-700">المفاهيم التي أتقنتها</p>
                  {correctCount >= questions.length * 0.7 ? (
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg bg-success-50 px-3 py-1.5 text-sm font-bold text-success-700">
                        ✓ {lesson?.name}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">أكمل التحدي لتحقيق الإتقان</p>
                  )}
                </div>
                {correctCount < questions.length * 0.7 && (
                  <div>
                    <p className="mb-2 font-bold text-gray-700">مفهوم يحتاج إلى مراجعة</p>
                    <div className="flex items-center gap-2 rounded-lg bg-warning-50 px-3 py-1.5 text-sm font-bold text-warning-700">
                      ○ {lesson?.name}
                    </div>
                    <Button variant="outline" size="sm" className="mt-3">
                      <RotateCcw className="h-4 w-4" />
                      مراجعة المفهوم
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <Button size="lg" className="mt-8" onClick={onBack}>
              <Home className="h-5 w-5" />
              العودة للرئيسية
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
