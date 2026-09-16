import { useMemo, useEffect, useState } from 'react';
import { Rocket, BookOpen, TrendingUp, Award, AlertCircle, Play, LogOut, ClipboardList, BarChart3, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { CHARACTERS } from '@/lib/types';
import type { Child, Unit, Lesson, Progress, Concept } from '@/lib/types';

interface ParentDashboardProps {
  onManageCurriculum: () => void;
  onStartAdventure: (lessonId: string) => void;
  onReview: () => void;
  onSignOut: () => void;
}

function ProgressRing({ percent, size = 120 }: { percent: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-ring__circle">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#fef7ee" strokeWidth="12" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ec6f2a"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-2xl font-extrabold text-gray-800">{percent}%</span>
      </div>
    </div>
  );
}

export function ParentDashboard({ onManageCurriculum, onStartAdventure, onReview, onSignOut }: ParentDashboardProps) {
  const { user } = useAuth();
  const [child, setChild] = useState<Child | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: childData } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!childData) {
        setLoading(false);
        return;
      }
      setChild(childData as Child);

      const { data: unitsData } = await supabase
        .from('units')
        .select('*')
        .eq('child_id', childData.id)
        .order('order_index', { ascending: true });
      const unitsArr = (unitsData ?? []) as Unit[];
      setUnits(unitsArr);

      if (unitsArr.length > 0) {
        const unitIds = unitsArr.map((u) => u.id);
        const [lessonsRes, progressRes, conceptsRes] = await Promise.all([
          supabase.from('lessons').select('*').in('unit_id', unitIds).order('order_index', { ascending: true }),
          supabase.from('progress').select('*').eq('child_id', childData.id),
          supabase.from('concepts').select('*').eq('child_id', childData.id),
        ]);
        setLessons((lessonsRes.data ?? []) as Lesson[]);
        setProgress((progressRes.data ?? []) as Progress[]);
        setConcepts((conceptsRes.data ?? []) as Concept[]);
      }

      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const completedLessons = lessons.filter((l) => l.status === 'completed').length;
    const totalLessons = lessons.length;
    const totalCorrect = progress.reduce((sum, p) => sum + p.correct_answers, 0);
    const totalAnswered = progress.reduce((sum, p) => sum + p.questions_answered, 0);
    const avgCorrect = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const masteredConcepts = concepts.filter((c) => c.status === 'mastered').length;
    const reviewConcepts = concepts.filter((c) => c.status === 'needs_review');
    const overallPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { completedLessons, totalLessons, avgCorrect, masteredConcepts, reviewConcepts, overallPercent };
  }, [lessons, progress, concepts]);

  const nextLesson = useMemo(() => {
    return lessons.find((l) => l.status === 'in_progress') ?? lessons.find((l) => l.status === 'not_started');
  }, [lessons]);

  const lessonsByUnit = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const unit of units) {
      map.set(unit.id, lessons.filter((l) => l.unit_id === unit.id));
    }
    return map;
  }, [units, lessons]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md text-center">
          <p className="mb-4 text-lg text-gray-600">لم يتم إعداد ملف الطفل بعد</p>
          <Button onClick={() => window.location.reload()}>إعادة تحميل</Button>
        </div>
      </div>
    );
  }

  const character = CHARACTERS.find((c) => c.id === child.character) ?? CHARACTERS[0];

  const statusConfig = {
    completed: { label: 'مكتمل', color: 'bg-success-100 text-success-700', dot: 'bg-success-500' },
    in_progress: { label: 'قيد التعلم', color: 'bg-warning-100 text-warning-700', dot: 'bg-warning-500' },
    not_started: { label: 'لم يبدأ', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 glass border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 text-white shadow-lg">
              <Rocket className="h-6 w-6" />
            </div>
            <span className="font-display text-lg font-extrabold text-gray-800">مغامرات تعليمية</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onManageCurriculum}>
              <ClipboardList className="h-4 w-4" />
              إدارة المنهج
            </Button>
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-gray-900">
            مرحبًا بكِ، {user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'أم'} 👋
          </h1>
          <p className="mt-1 text-gray-500">
            رحلة {child.name} التعليمية — العلوم، الترم الأول
          </p>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 card-shadow animate-slide-up">
            <h2 className="mb-4 font-display text-lg font-bold text-gray-800">تقدم الطفل</h2>
            <div className="flex flex-col items-center">
              <ProgressRing percent={stats.overallPercent} />
              <p className="mt-3 text-sm font-bold text-gray-600">
                {stats.completedLessons} من {stats.totalLessons} درسًا مكتملًا
              </p>
            </div>
            <div className="mt-6 space-y-3 border-t border-gray-100 pt-4">
              <StatRow icon={BookOpen} label="الدروس المكتملة" value={`${stats.completedLessons}`} color="text-success-600" />
              <StatRow icon={TrendingUp} label="متوسط الإجابات الصحيحة" value={`${stats.avgCorrect}%`} color="text-secondary-600" />
              <StatRow icon={Award} label="المفاهيم المتقنة" value={`${stats.masteredConcepts}`} color="text-primary-600" />
              <StatRow icon={AlertCircle} label="مفاهيم تحتاج مراجعة" value={`${stats.reviewConcepts.length}`} color="text-warning-600" />
            </div>
          </div>

          <div className="lg:col-span-2">
            {nextLesson ? (
              <div className="flex h-full flex-col justify-between rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 p-8 text-white card-shadow-lg animate-slide-up">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur">
                    <Play className="h-4 w-4" />
                    المغامرة التالية
                  </div>
                  <h2 className="font-display text-3xl font-extrabold">{nextLesson.name}</h2>
                  <p className="mt-3 text-lg text-white/80">استعد لاكتشاف مغامرة جديدة ومثيرة!</p>
                </div>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl backdrop-blur">
                    {character.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/70">رفيق الطفل</p>
                    <p className="font-bold">{character.name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => onStartAdventure(nextLesson.id)}
                    className="bg-white text-primary-600 hover:bg-white/90"
                  >
                    ابدأ المغامرة
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-white p-8 card-shadow">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-500">
                  <ClipboardList className="h-8 w-8" />
                </div>
                <h2 className="font-display text-xl font-bold text-gray-800">لا توجد دروس بعد</h2>
                <p className="mt-2 text-center text-gray-500">ابدئي بإضافة دروس العلوم لطفلك من قسم إدارة المنهج</p>
                <Button variant="primary" size="md" onClick={onManageCurriculum} className="mt-6">
                  <ClipboardList className="h-4 w-4" />
                  إدارة المنهج
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 card-shadow animate-slide-up">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-gray-800">خطة العلوم — الترم الأول</h2>
            <Button variant="outline" size="sm" onClick={onManageCurriculum}>
              <ClipboardList className="h-4 w-4" />
              إدارة المنهج
            </Button>
          </div>

          {units.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400">لم يتم إضافة أي وحدات بعد</p>
            </div>
          ) : (
            <div className="space-y-6">
              {units.map((unit, unitIdx) => {
                const unitLessons = lessonsByUnit.get(unit.id) ?? [];
                return (
                  <div key={unit.id}>
                    <h3 className="mb-3 font-display text-base font-bold text-gray-700">
                      الوحدة {unitIdx + 1}: {unit.name}
                    </h3>
                    <div className="space-y-2">
                      {unitLessons.length === 0 ? (
                        <p className="py-2 text-sm text-gray-400">لا توجد دروس في هذه الوحدة</p>
                      ) : (
                        unitLessons.map((lesson, lessonIdx) => {
                          const status = statusConfig[lesson.status];
                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
                            >
                              <div className={`h-3 w-3 rounded-full ${status.dot}`} />
                              <span className="flex-1 text-sm font-medium text-gray-700">
                                الدرس {lessonIdx + 1}: {lesson.name}
                              </span>
                              <span className={`rounded-lg px-3 py-1 text-xs font-bold ${status.color}`}>
                                {status.label}
                              </span>
                              {lesson.status !== 'not_started' && (
                                <button
                                  onClick={() => onStartAdventure(lesson.id)}
                                  className="text-primary-500 hover:text-primary-700"
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {stats.reviewConcepts.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 card-shadow animate-slide-up">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-50 text-warning-600">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-gray-800">مفاهيم تحتاج إلى مراجعة</h2>
                <p className="text-sm text-gray-500">لدينا بعض المفاهيم التي تستحق أن نكتشفها مرة أخرى.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.reviewConcepts.map((c) => (
                <span key={c.id} className="rounded-lg bg-warning-50 px-4 py-2 text-sm font-bold text-warning-700 ring-1 ring-warning-200">
                  {c.name}
                </span>
              ))}
            </div>
            <Button variant="success" size="md" onClick={onReview} className="mt-4">
              ابدأ المراجعة
            </Button>
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-white p-6 card-shadow animate-slide-up">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-gray-800">
            <BarChart3 className="h-5 w-5 text-secondary-500" />
            آخر نشاط
          </h2>
          {progress.filter((p) => p.is_completed).length > 0 ? (
            <div className="space-y-3">
              {progress
                .filter((p) => p.is_completed)
                .slice(-3)
                .reverse()
                .map((p) => {
                  const lesson = lessons.find((l) => l.id === p.lesson_id);
                  if (!lesson) return null;
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-100 text-success-600">
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-700">أكمل طفلك مغامرة "{lesson.name}"</p>
                        <p className="text-xs text-gray-400">
                          أجاب عن {p.correct_answers} من {p.total_questions} أسئلة بشكل صحيح
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="py-4 text-sm text-gray-400">لا يوجد نشاط بعد. ابدئي أول مغامرة!</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="font-bold text-gray-800">{value}</span>
    </div>
  );
}
