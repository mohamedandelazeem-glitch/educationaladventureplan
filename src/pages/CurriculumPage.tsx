import { useEffect, useState } from 'react';
import { Rocket, ArrowRight, Trash2, Image as ImageIcon, Sparkles, Check, Loader2, ChevronDown, ChevronLeft, Pencil, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import type { Child, Unit, Lesson, LessonPage, Adventure } from '@/lib/types';

interface CurriculumPageProps {
  onBack: () => void;
}

type UploadStage = 'idle' | 'uploading' | 'uploaded' | 'generating' | 'generated';

export function CurriculumPage({ onBack }: CurriculumPageProps) {
  const [child, setChild] = useState<Child | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [uploadLesson, setUploadLesson] = useState<Lesson | null>(null);
  const [pages, setPages] = useState<LessonPage[]>([]);
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [adventure, setAdventure] = useState<Adventure | null>(null);

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
      setUnits((unitsData ?? []) as Unit[]);
      setLoading(false);
    })();
  }, []);

  const refreshUnits = async () => {
    if (!child) return;
    const { data } = await supabase
      .from('units')
      .select('*')
      .eq('child_id', child.id)
      .order('order_index', { ascending: true });
    setUnits(data ?? []);
  };

  const handleRenameLesson = async (lessonId: string, newName: string) => {
    await supabase.from('lessons').update({ name: newName }).eq('id', lessonId);
  };

  const handleRenameUnit = async (unitId: string, newName: string) => {
    await supabase.from('units').update({ name: newName }).eq('id', unitId);
    await refreshUnits();
  };

  const handleDeleteUnit = async (unitId: string) => {
    await supabase.from('units').delete().eq('id', unitId);
    await refreshUnits();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    await supabase.from('lessons').delete().eq('id', lessonId);
  };

  const openUpload = async (lesson: Lesson) => {
    setUploadLesson(lesson);
    setUploadStage('idle');
    setAdventure(null);
    const { data } = await supabase
      .from('lesson_pages')
      .select('*')
      .eq('lesson_id', lesson.id)
      .order('order_index', { ascending: true });
    setPages((data ?? []) as LessonPage[]);
  };

  const handleFileUpload = async (files: FileList) => {
    if (!uploadLesson || !child || files.length === 0) return;
    setUploadStage('uploading');

    const uploaded: LessonPage[] = [...pages];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop();
      const fileName = `${child.id}/${uploadLesson.id}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('lesson-pages')
        .upload(fileName, file);
      if (upErr) continue;
      const { data: urlData } = supabase.storage.from('lesson-pages').getPublicUrl(fileName);
      const { data: pageData } = await supabase
        .from('lesson_pages')
        .insert({
          lesson_id: uploadLesson.id,
          image_url: urlData.publicUrl,
          order_index: uploaded.length,
        })
        .select('*')
        .single();
      if (pageData) uploaded.push(pageData as LessonPage);
    }
    setPages(uploaded);
    setUploadStage('uploaded');
  };

  const handleGenerateAdventure = async () => {
    if (!uploadLesson || pages.length === 0) return;
    setUploadStage('generating');

    const { data: existing } = await supabase
      .from('adventures')
      .select('*')
      .eq('lesson_id', uploadLesson.id)
      .maybeSingle();

    let adv: Adventure | null = null;

    if (existing) {
      adv = existing as Adventure;
    } else {
      const { data: newAdv } = await supabase
        .from('adventures')
        .insert({
          lesson_id: uploadLesson.id,
          title: uploadLesson.name,
          description: `مغامرة تعليمية عن ${uploadLesson.name}`,
          status: 'ready',
        })
        .select('*')
        .single();
      adv = (newAdv as Adventure) ?? null;
    }

    if (adv) {
      const { data: existingScenes } = await supabase
        .from('scenes')
        .select('*')
        .eq('adventure_id', adv.id);

      if (!existingScenes || existingScenes.length === 0) {
        const scenesData = generateScenesForLesson(uploadLesson.name);
        const scenesToInsert = scenesData.map((s, i) => ({
          adventure_id: adv.id,
          order_index: i,
          scene_text: s.scene_text,
          dialogue_text: s.dialogue_text,
          illustration_emoji: s.illustration_emoji,
        }));
        await supabase.from('scenes').insert(scenesToInsert);

        const questionsData = generateQuestionsForLesson(uploadLesson.name);
        const questionsToInsert = questionsData.map((q, i) => ({
          adventure_id: adv.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          correct_answer: q.correct_answer,
          hint: q.hint,
          order_index: i,
        }));
        await supabase.from('questions').insert(questionsToInsert);
      }

      if (uploadLesson.status === 'not_started') {
        await supabase
          .from('lessons')
          .update({ status: 'in_progress' })
          .eq('id', uploadLesson.id);
      }
    }

    setAdventure(adv);
    setUploadStage('generated');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    );
  }

  if (uploadLesson) {
    return (
      <UploadModal
        lesson={uploadLesson}
        pages={pages}
        stage={uploadStage}
        adventure={adventure}
        onUpload={handleFileUpload}
        onGenerate={handleGenerateAdventure}
        onClose={() => {
          setUploadLesson(null);
          setPages([]);
          setUploadStage('idle');
          setAdventure(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 glass border-b border-gray-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 text-white shadow-lg">
              <Rocket className="h-6 w-6" />
            </div>
            <span className="font-display text-lg font-extrabold text-gray-800">إدارة المنهج</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
            العودة للرئيسية
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 p-6 text-white card-shadow-lg">
          <h1 className="font-display text-2xl font-extrabold">قائمة الدروس</h1>
          <p className="mt-2 text-white/80">الدروس التي تم إضافتها لطفلك خلال الترم.</p>
        </div>

        {units.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center card-shadow">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
              <ImageIcon className="h-8 w-8" />
            </div>
            <p className="text-gray-400">لم يتم إضافة أي دروس بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {units.map((unit, idx) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                index={idx}
                onDeleteUnit={() => handleDeleteUnit(unit.id)}
                onRenameUnit={handleRenameUnit}
                onUploadPages={openUpload}
                onDeleteLesson={handleDeleteLesson}
                onRenameLesson={handleRenameLesson}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Unit Card — list of lessons (names only, with edit pencil)
// ============================================================
interface UnitCardProps {
  unit: Unit;
  index: number;
  onDeleteUnit: () => void;
  onRenameUnit: (unitId: string, newName: string) => void;
  onUploadPages: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onRenameLesson: (lessonId: string, newName: string) => void;
}

function UnitCard(props: UnitCardProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [editingUnitName, setEditingUnitName] = useState(false);
  const [unitNameVal, setUnitNameVal] = useState(props.unit.name);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonNameVal, setLessonNameVal] = useState('');

  const refreshLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('unit_id', props.unit.id)
      .order('order_index', { ascending: true });
    setLessons((data ?? []) as Lesson[]);
  };

  useEffect(() => {
    refreshLessons();
  }, [props.unit.id]);

  const saveUnitName = () => {
    if (unitNameVal.trim() && unitNameVal !== props.unit.name) {
      props.onRenameUnit(props.unit.id, unitNameVal.trim());
    } else {
      setUnitNameVal(props.unit.name);
    }
    setEditingUnitName(false);
  };

  const saveLessonName = (lessonId: string) => {
    if (lessonNameVal.trim()) {
      props.onRenameLesson(lessonId, lessonNameVal.trim());
      refreshLessons();
    }
    setEditingLessonId(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white card-shadow">
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronLeft className="h-5 w-5 text-gray-400" />}
          {editingUnitName ? (
            <input
              type="text"
              value={unitNameVal}
              onChange={(e) => setUnitNameVal(e.target.value)}
              onBlur={saveUnitName}
              onKeyDown={(e) => e.key === 'Enter' && saveUnitName()}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="rounded-lg border-2 border-primary-300 px-2 py-1 font-display text-lg font-bold text-gray-800 focus:outline-none"
            />
          ) : (
            <h3 className="font-display text-lg font-bold text-gray-800">
              الوحدة {props.index + 1}: {props.unit.name}
            </h3>
          )}
          {lessons.length > 0 && (
            <span className="rounded-lg bg-primary-50 px-3 py-1 text-xs font-bold text-primary-600">
              {lessons.length} دروس
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingUnitName(true); setUnitNameVal(props.unit.name); }}
            className="text-gray-300 transition-colors hover:text-primary-500"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); props.onDeleteUnit(); }}
            className="text-gray-300 transition-colors hover:text-error-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-6 py-4">
          {lessons.length === 0 ? (
            <p className="py-2 text-sm text-gray-400">لا توجد دروس في هذه الوحدة</p>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson, lIdx) => (
                <div key={lesson.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-600">
                    {lIdx + 1}
                  </div>
                  {editingLessonId === lesson.id ? (
                    <input
                      type="text"
                      value={lessonNameVal}
                      onChange={(e) => setLessonNameVal(e.target.value)}
                      onBlur={() => saveLessonName(lesson.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveLessonName(lesson.id)}
                      autoFocus
                      className="flex-1 rounded-lg border-2 border-primary-300 px-2 py-1 text-sm font-medium text-gray-800 focus:outline-none"
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium text-gray-700">{lesson.name}</span>
                  )}
                  {editingLessonId !== lesson.id && (
                    <button
                      onClick={() => { setEditingLessonId(lesson.id); setLessonNameVal(lesson.name); }}
                      className="text-gray-300 transition-colors hover:text-primary-500"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => props.onUploadPages(lesson)}
                    className="flex items-center gap-1 rounded-lg bg-secondary-50 px-3 py-1.5 text-xs font-bold text-secondary-600 transition-colors hover:bg-secondary-100"
                  >
                    <Upload className="h-3 w-3" />
                    رفع الصور
                  </button>
                  <button
                    onClick={() => props.onDeleteLesson(lesson.id)}
                    className="text-gray-300 transition-colors hover:text-error-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Upload Modal
// ============================================================
interface UploadModalProps {
  lesson: Lesson;
  pages: LessonPage[];
  stage: UploadStage;
  adventure: Adventure | null;
  onUpload: (files: FileList) => void;
  onGenerate: () => void;
  onClose: () => void;
}

function UploadModal({ lesson, pages, stage, adventure, onUpload, onGenerate, onClose }: UploadModalProps) {
  const generationSteps = [
    'قراءة محتوى الدرس',
    'تحديد المفاهيم الأساسية',
    'بناء المغامرة',
    'إنشاء المشاهد',
    'إعداد الأسئلة',
    'مراجعة المحتوى',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 animate-fade-in">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 animate-slide-up">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold text-gray-900">إضافة محتوى الدرس</h2>
            <p className="mt-1 text-sm text-gray-500">اسم الدرس: {lesson.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <ChevronDown className="h-6 w-6" />
          </button>
        </div>

        <p className="mb-6 text-sm text-gray-500">ارفعي صور جميع صفحات هذا الدرس بوضوح.</p>

        {stage === 'idle' && (
          <div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-12 transition-colors hover:border-primary-400 hover:bg-primary-50">
              <Upload className="mb-3 h-10 w-10 text-gray-300" />
              <span className="font-bold text-gray-600">+ إضافة صورة</span>
              <span className="mt-1 text-xs text-gray-400">يمكنك رفع أكثر من صورة دفعة واحدة</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && onUpload(e.target.files)}
              />
            </label>
            {pages.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-bold text-gray-600">الصفحات المرفوعة: {pages.length}</p>
                <div className="grid grid-cols-4 gap-2">
                  {pages.map((p) => (
                    <div key={p.id} className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                      <img src={p.image_url} alt="صفحة الدرس" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {stage === 'uploading' && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
            <p className="mt-4 font-bold text-gray-600">جاري رفع الصور...</p>
          </div>
        )}

        {stage === 'uploaded' && (
          <div>
            <div className="mb-6 rounded-xl bg-success-50 px-4 py-3 text-sm font-bold text-success-700 ring-1 ring-success-200">
              تم رفع صفحات الدرس بنجاح ✓
            </div>
            <div className="grid grid-cols-4 gap-2">
              {pages.map((p) => (
                <div key={p.id} className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                  <img src={p.image_url} alt="صفحة الدرس" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <Button size="lg" className="mt-6 w-full" onClick={onGenerate}>
              <Sparkles className="h-5 w-5" />
              إنشاء المغامرة
            </Button>
          </div>
        )}

        {stage === 'generating' && (
          <div className="py-8">
            <h3 className="mb-6 text-center font-display text-lg font-bold text-gray-800">نُحضّر مغامرة طفلك...</h3>
            <div className="space-y-3">
              {generationSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 animate-slide-in"
                  style={{ animationDelay: `${i * 300}ms` }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100 text-success-600">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          </div>
        )}

        {stage === 'generated' && adventure && (
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-3xl animate-bounce-in">
              🎉
            </div>
            <h3 className="font-display text-2xl font-extrabold text-gray-900">مغامرتك جاهزة!</h3>
            <p className="mt-2 text-gray-500">
              أصبح درس "{lesson.name}" جاهزًا لرحلة التعلم.
            </p>
            <Button size="lg" className="mt-6 w-full" onClick={onClose}>
              <Check className="h-5 w-5" />
              معاينة المغامرة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Scene/Question generators
// ============================================================
function generateScenesForLesson(lessonName: string) {
  return [
    {
      scene_text: `تبدأ درس ${lessonName} بمقدمة بسيطة ومشوقة.`,
      dialogue_text: 'هيا نبدأ مغامرتنا ونكتشف شيء جديد!',
      illustration_emoji: '🌟',
    },
    {
      scene_text: `نتعرف في هذا المشهد على المفهوم الأساسي لـ ${lessonName}.`,
      dialogue_text: 'بص! ده أهم جزء، ركز معايا كويس.',
      illustration_emoji: '🔬',
    },
    {
      scene_text: `نطبق ما تعلمناه في ${lessonName} بمثال عملي.`,
      dialogue_text: 'تعالى نشوف إزاي نستخدم اللي اتعلمناه!',
      illustration_emoji: '🧪',
    },
    {
      scene_text: `نراجع ما تعلمناه في ${lessonName}.`,
      dialogue_text: 'خلصنا المغامرة! شوف إنت تعلمت إيه النهارده.',
      illustration_emoji: '✨',
    },
  ];
}

function generateQuestionsForLesson(lessonName: string) {
  return [
    {
      question_text: `ما هو الموضوع الرئيسي في درس ${lessonName}؟`,
      option_a: lessonName,
      option_b: 'درس آخر غير مرتبط',
      option_c: 'لا شيء',
      correct_answer: 'a' as const,
      hint: `الموضوع الرئيسي هو ${lessonName}.`,
    },
    {
      question_text: 'ماذا تعلمنا في المشهد الأول؟',
      option_a: 'لا شيء',
      option_b: 'مقدمة عن الدرس',
      option_c: 'أسئلة صعبة',
      correct_answer: 'b' as const,
      hint: 'في المشهد الأول تعرفنا على مقدمة الدرس.',
    },
    {
      question_text: 'كيف نطبق ما تعلمناه؟',
      option_a: 'بالأمثلة العملية',
      option_b: 'بالنسيان',
      option_c: 'بالتجاهل',
      correct_answer: 'a' as const,
      hint: 'نطبق ما تعلمناه بالأمثلة العملية.',
    },
  ];
}
