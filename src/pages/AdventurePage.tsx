import { useEffect, useState, useRef, useCallback } from 'react';
import { Rocket, ArrowRight, Check, X, Lightbulb, Star, Trophy, Home, RotateCcw, Volume2, Play, Pause, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { CHARACTERS } from '@/lib/types';
import type { Child, Lesson, Adventure, Scene, Question, Progress } from '@/lib/types';

interface AdventurePageProps {
  lessonId: string;
  onBack: () => void;
}

type Phase = 'loading' | 'error' | 'intro' | 'scene' | 'question' | 'correct' | 'wrong' | 'hint' | 'complete' | 'result';

export function AdventurePage({ lessonId, onBack }: AdventurePageProps) {
  const [child, setChild] = useState<Child | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [existingProgress, setExistingProgress] = useState<Progress | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const [sceneIndex, setSceneIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load all data
  useEffect(() => {
    (async () => {
      const { data: childData } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!childData) { setPhase('error'); setErrorMsg('لم يتم إعداد ملف الطفل'); return; }
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

      if (!advData) {
        setPhase('error');
        setErrorMsg('المغامرة غير منشأة بعد. يرجى إنشاء المغامرة من لوحة التحكم.');
        return;
      }

      const adv = advData as Adventure;
      setAdventure(adv);

      if (adv.status === 'generating') {
        setPhase('error');
        setErrorMsg('جاري إنشاء المغامرة... يرجى الانتظار ثم المحاولة مرة أخرى.');
        return;
      }

      if (adv.status === 'failed') {
        setPhase('error');
        setErrorMsg(adv.error_message || 'فشل في إنشاء المغامرة. يرجى المحاولة مرة أخرى.');
        return;
      }

      const [scenesRes, questionsRes] = await Promise.all([
        supabase.from('scenes').select('*').eq('adventure_id', adv.id).order('order_index', { ascending: true }),
        supabase.from('questions').select('*').eq('adventure_id', adv.id).order('order_index', { ascending: true }),
      ]);
      const scenesArr = (scenesRes.data ?? []) as Scene[];
      const questionsArr = (questionsRes.data ?? []) as Question[];
      setScenes(scenesArr);
      setQuestions(questionsArr);

      if (scenesArr.length === 0) {
        setPhase('error');
        setErrorMsg('المغامرة لا تحتوي على مشاهد. يرجى إعادة إنشاء المغامرة.');
        return;
      }

      // Load existing progress
      const { data: progData } = await supabase
        .from('progress')
        .select('*')
        .eq('child_id', childData.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (progData) {
        const prog = progData as Progress;
        setExistingProgress(prog);
        setCorrectCount(prog.correct_answers);
        setAnsweredCount(prog.questions_answered);
        // Resume from where they left off
        if (prog.current_scene_index < scenesArr.length && !prog.is_completed) {
          setSceneIndex(prog.current_scene_index);
          setPhase('intro');
        } else {
          setPhase('intro');
        }
      } else {
        setPhase('intro');
      }
    })();
  }, [lessonId]);

  // Scene playback progress animation
  const startScenePlayback = useCallback(() => {
    setIsPlaying(true);
    setSceneProgress(0);
    const currentScene = scenes[sceneIndex];
    if (!currentScene) return;
    const duration = (currentScene.duration_seconds || 15) * 1000;
    const interval = 100;
    const step = (interval / duration) * 100;

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setSceneProgress((prev) => {
        if (prev >= 100) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          setIsPlaying(false);
          return 100;
        }
        return prev + step;
      });
    }, interval);
  }, [scenes, sceneIndex]);

  const pausePlayback = () => {
    setIsPlaying(false);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  const resumePlayback = () => {
    if (sceneProgress < 100) {
      setIsPlaying(true);
      const currentScene = scenes[sceneIndex];
      if (!currentScene) return;
      const remaining = ((currentScene.duration_seconds || 15) * 1000) * (1 - sceneProgress / 100);
      const interval = 100;
      const step = (interval / remaining) * 100;
      progressTimerRef.current = setInterval(() => {
        setSceneProgress((prev) => {
          if (prev >= 100) {
            if (progressTimerRef.current) clearInterval(progressTimerRef.current);
            setIsPlaying(false);
            return 100;
          }
          return prev + step;
        });
      }, interval);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const character = child ? CHARACTERS.find((c) => c.id === child.character) ?? CHARACTERS[0] : CHARACTERS[0];

  const saveProgress = async (completed: boolean) => {
    if (!child || !lesson || !adventure) return;
    const totalQ = questions.length;
    const scenesDone = completed ? scenes.length : sceneIndex;

    const payload = {
      child_id: child.id,
      lesson_id: lesson.id,
      adventure_id: adventure.id,
      current_scene_index: sceneIndex,
      scenes_completed: scenesDone,
      total_scenes: scenes.length,
      questions_answered: answeredCount,
      correct_answers: correctCount,
      total_questions: totalQ,
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (existingProgress) {
      await supabase.from('progress').update(payload).eq('id', existingProgress.id);
    } else {
      await supabase.from('progress').insert(payload);
    }
  };

  // Save progress when leaving
  const handleBack = () => {
    saveProgress(false);
    onBack();
  };

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
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setIsPlaying(false);
    setSceneProgress(0);
    saveProgress(false);

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
    await saveProgress(true);
    await supabase.from('lessons').update({ status: 'completed' }).eq('id', lesson.id);

    if (correctCount >= questions.length * 0.7) {
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

  // ===== Loading =====
  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    );
  }

  // ===== Error =====
  if (phase === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-50 text-error-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="font-display text-xl font-bold text-gray-800 text-center">{errorMsg}</h2>
        <Button variant="primary" className="mt-6" onClick={onBack}>العودة</Button>
      </div>
    );
  }

  // ===== Main render =====
  const currentScene = scenes[sceneIndex];
  const totalSteps = scenes.length + questions.length;
  const currentStep = sceneIndex + answeredCount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-gray-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <button onClick={handleBack} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary-600">
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
            style={{ width: `${Math.min(100, (currentStep / totalSteps) * 100)}%` }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* INTRO */}
        {phase === 'intro' && (
          <div className="text-center animate-bounce-in">
            <div className="mb-6 text-7xl animate-float">{character.emoji}</div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900">{lesson?.name}</h1>
            {adventure?.description && (
              <p className="mt-3 text-lg text-gray-500">{adventure.description}</p>
            )}
            <div className="mx-auto mt-6 max-w-lg rounded-2xl bg-white p-6 card-shadow">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="text-2xl">{character.emoji}</span>
                <span className="font-bold text-gray-700">{character.name} يقول:</span>
              </div>
              <p className="text-lg text-gray-600" style={{ direction: 'rtl' }}>
                "يلا نبدأ مغامرتنا التعليمية ونتعلم حاجات جديدة!"
              </p>
            </div>
            {existingProgress && !existingProgress.is_completed && existingProgress.current_scene_index > 0 && (
              <div className="mx-auto mt-4 max-w-lg rounded-xl bg-warning-50 px-4 py-3 text-sm font-bold text-warning-700 ring-1 ring-warning-200">
                <RotateCcw className="ml-1 inline h-4 w-4" />
                سنتابع من المشهد {existingProgress.current_scene_index + 1}
              </div>
            )}
            <Button size="lg" className="mt-8" onClick={() => { setPhase('scene'); }}>
              <Rocket className="h-5 w-5" />
              ابدأ المغامرة
            </Button>
          </div>
        )}

        {/* SCENE — Visual player */}
        {phase === 'scene' && currentScene && (
          <div className="animate-slide-up">
            <div className="mb-4 text-center">
              <span className="rounded-full bg-primary-50 px-4 py-1 text-sm font-bold text-primary-600">
                المشهد {sceneIndex + 1} من {scenes.length}
              </span>
            </div>

            {/* Visual scene area */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-primary-800 to-accent-900 card-shadow-lg" style={{ aspectRatio: '16/9' }}>
              {/* Animated background stars/particles */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white animate-twinkle"
                    style={{
                      width: `${Math.random() * 4 + 1}px`,
                      height: `${Math.random() * 4 + 1}px`,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                    }}
                  />
                ))}
              </div>

              {/* Central emoji/visual */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="text-8xl animate-float"
                  style={{ animationDelay: `${sceneIndex * 200}ms` }}
                >
                  {currentScene.illustration_emoji || '🌟'}
                </div>
              </div>

              {/* On-screen educational text overlay */}
              {currentScene.on_screen_text && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <div className="mx-auto max-w-lg">
                    <p className="text-lg font-bold leading-relaxed text-white text-center" style={{ direction: 'rtl' }}>
                      {currentScene.on_screen_text}
                    </p>
                  </div>
                </div>
              )}

              {/* Source page indicator */}
              {currentScene.source_page_index !== null && (
                <div className="absolute top-4 right-4 flex items-center gap-1 rounded-lg bg-black/40 px-2.5 py-1 text-xs font-bold text-white/80">
                  <FileText className="h-3 w-3" />
                  صفحة {currentScene.source_page_index + 1}
                </div>
              )}

              {/* Scene progress bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-accent-400 transition-all duration-100"
                  style={{ width: `${sceneProgress}%` }}
                />
              </div>

              {/* Play/Pause control */}
              <button
                onClick={isPlaying ? pausePlayback : resumePlayback}
                className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
            </div>

            {/* Voice/dialogue section */}
            <div className="mt-6 rounded-2xl bg-white p-5 card-shadow">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{character.emoji}</span>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-bold text-gray-500">{character.name} يقول:</p>
                  <p className="text-base text-gray-700" style={{ direction: 'rtl' }}>
                    {currentScene.voice_text || currentScene.dialogue_text}
                  </p>
                </div>
                <button
                  onClick={() => { if (!isPlaying) startScenePlayback(); }}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-colors hover:bg-primary-100"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Next button */}
            <div className="mt-6 text-center">
              <Button
                size="lg"
                onClick={handleNextScene}
              >
                {sceneIndex + 1 < scenes.length ? 'المشهد التالي' : questions.length > 0 ? 'الأسئلة' : 'إنهاء'}
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
              {questions[questionIndex].source_fact && (
                <div className="mb-4 rounded-xl bg-gray-50 px-4 py-2 text-xs text-gray-400 text-center">
                  المصدر: {questions[questionIndex].source_fact}
                </div>
              )}
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
              {scenes.filter(s => s.scene_type === 'scene' || s.scene_type === 'intro').slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-3 card-shadow">
                  <Check className="h-5 w-5 text-success-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{(s.on_screen_text || s.scene_text).slice(0, 70)}</span>
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
