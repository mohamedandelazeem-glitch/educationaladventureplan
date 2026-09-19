import { useMemo, useEffect, useState, useCallback } from 'react';
import { Rocket, BookOpen, TrendingUp, Award, AlertCircle, Play, LogOut, ClipboardList, BarChart3, RotateCcw, Check, Plus, Trash2, Pencil, Upload, X, ChevronDown, ChevronLeft, AlertTriangle, Sparkles, Loader2, FileText, Save, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { CHARACTERS } from '@/lib/types';
import type { Child, Unit, Lesson, LessonPage, Adventure, Progress, Concept } from '@/lib/types';
import { LessonImageDropzone } from '@/components/LessonImageDropzone';
import type { DropzoneImage } from '@/components/LessonImageDropzone';
import { SavedAdventuresGrid } from '@/components/SavedAdventuresGrid';
import {
  saveAdventure,
  getAllAdventures,
  deleteAdventure,
  type AdventureRecord,
} from '@/lib/adventureRepository';

const MAX_PAGES = 10;
const GENERATION_TIMEOUT_MS = 120_000; // 2 minutes

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
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [pageCounts, setPageCounts] = useState<Map<string, number>>(new Map());
  const [progress, setProgress] = useState<Progress[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingLessonId, setGeneratingLessonId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string>('');

  // Modal state
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [unitName, setUnitName] = useState('');
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editUnitName, setEditUnitName] = useState('');
  const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null);

  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [lessonName, setLessonName] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingPages, setExistingPages] = useState<LessonPage[]>([]);
  const [lessonImageError, setLessonImageError] = useState('');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);

  // Adventure upload + history state
  const [dropzoneImages, setDropzoneImages] = useState<DropzoneImage[]>([]);
  const [adventureTitle, setAdventureTitle] = useState('');
  const [savedAdventures, setSavedAdventures] = useState<AdventureRecord[]>([]);
  const [isSavingAdventure, setIsSavingAdventure] = useState(false);
  const [adventureSaveError, setAdventureSaveError] = useState('');

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
        const lessonsArr = (lessonsRes.data ?? []) as Lesson[];
        setLessons(lessonsArr);
        setProgress((progressRes.data ?? []) as Progress[]);
        setConcepts((conceptsRes.data ?? []) as Concept[]);

        if (lessonsArr.length > 0) {
          const lessonIds = lessonsArr.map((l) => l.id);
          const [advRes, pagesRes] = await Promise.all([
            supabase.from('adventures').select('*').in('lesson_id', lessonIds),
            supabase.from('lesson_pages').select('lesson_id').in('lesson_id', lessonIds),
          ]);
          setAdventures((advRes.data ?? []) as Adventure[]);
          const counts = new Map<string, number>();
          for (const p of (pagesRes.data ?? []) as { lesson_id: string }[]) {
            counts.set(p.lesson_id, (counts.get(p.lesson_id) ?? 0) + 1);
          }
          setPageCounts(counts);
        }
      }

      setLoading(false);
    })();

    // Load saved adventures from IndexedDB
    getAllAdventures()
      .then(setSavedAdventures)
      .catch(() => {});
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

  const adventuresByLesson = useMemo(() => {
    const map = new Map<string, Adventure>();
    for (const adv of adventures) {
      map.set(adv.lesson_id, adv);
    }
    return map;
  }, [adventures]);

  // ===== Unit handlers =====
  const handleSaveUnit = async () => {
    if (!child || !unitName.trim()) return;
    const { data } = await supabase.from('units').insert({
      user_id: child.user_id,
      child_id: child.id,
      name: unitName.trim(),
      subject: 'science',
      term: 'term1',
      order_index: units.length,
    }).select('*').single();
    if (data) {
      const newUnit = data as Unit;
      setUnits([...units, newUnit]);
      setUnitName('');
      setShowAddUnit(false);
      setActiveUnit(newUnit);
      setShowAddLesson(true);
      setLessonName('');
      setNewFiles([]);
      setExistingPages([]);
      setLessonImageError('');
    }
  };

  const handleSaveEditUnit = async () => {
    if (!editingUnit || !editUnitName.trim()) return;
    await supabase.from('units').update({ name: editUnitName.trim() }).eq('id', editingUnit.id);
    setUnits(units.map(u => u.id === editingUnit.id ? { ...u, name: editUnitName.trim() } : u));
    if (activeUnit?.id === editingUnit.id) {
      setActiveUnit({ ...editingUnit, name: editUnitName.trim() });
    }
    setEditingUnit(null);
    setEditUnitName('');
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnitId || !child) return;
    // Delete images from storage
    const unitLessonIds = lessons.filter(l => l.unit_id === deleteUnitId).map(l => l.id);
    if (unitLessonIds.length > 0) {
      const { data: pages } = await supabase.from('lesson_pages').select('image_url').in('lesson_id', unitLessonIds);
      for (const p of (pages ?? []) as { image_url: string }[]) {
        const path = p.image_url.split('/lesson-pages/')[1];
        if (path) await supabase.storage.from('lesson-pages').remove([path]);
      }
    }
    await supabase.from('units').delete().eq('id', deleteUnitId);
    setUnits(units.filter(u => u.id !== deleteUnitId));
    setLessons(lessons.filter(l => l.unit_id !== deleteUnitId));
    setAdventures(adventures.filter(a => !unitLessonIds.includes(a.lesson_id)));
    if (activeUnit?.id === deleteUnitId) setActiveUnit(null);
    setDeleteUnitId(null);
  };

  // ===== Lesson image handlers =====
  const handleFileSelect = (files: FileList) => {
    const total = existingPages.length + newFiles.length + files.length;
    if (total > MAX_PAGES) {
      setLessonImageError(`يمكن رفع ${MAX_PAGES} صفحات كحد أقصى لكل درس.`);
      return;
    }
    setLessonImageError('');
    setNewFiles([...newFiles, ...Array.from(files)]);
  };

  const handleRemoveNewFile = (idx: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== idx));
  };

  const handleRemoveExistingPage = async (pageId: string, imageUrl: string) => {
    const path = imageUrl.split('/lesson-pages/')[1];
    if (path) await supabase.storage.from('lesson-pages').remove([path]);
    await supabase.from('lesson_pages').delete().eq('id', pageId);
    setExistingPages(existingPages.filter(p => p.id !== pageId));
    setPageCounts(new Map(pageCounts).set(editingLesson?.id ?? '', existingPages.length - 1 + newFiles.length));
  };

  const uploadLessonImages = async (lessonId: string): Promise<{ pages: LessonPage[]; errors: string[] }> => {
    if (!child) return { pages: [], errors: [] };
    const uploadedPages: LessonPage[] = [];
    const errors: string[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fileName = `${child.id}/${lessonId}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from('lesson-pages').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (upErr) {
        errors.push(`فشل رفع الصورة ${i + 1}: ${upErr.message}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from('lesson-pages').getPublicUrl(fileName);
      const { data: pageData, error: insertErr } = await supabase.from('lesson_pages').insert({
        lesson_id: lessonId,
        image_url: urlData.publicUrl,
        order_index: existingPages.length + i,
      }).select('*').single();
      if (insertErr || !pageData) {
        errors.push(`فشل حفظ record الصورة ${i + 1}: ${insertErr?.message ?? 'unknown'}`);
        continue;
      }
      uploadedPages.push(pageData as LessonPage);
    }
    return { pages: uploadedPages, errors };
  };

  const refreshPageCount = async (lessonId: string) => {
    const { count } = await supabase
      .from('lesson_pages')
      .select('*', { count: 'exact', head: true })
      .eq('lesson_id', lessonId);
    setPageCounts(prev => new Map(prev).set(lessonId, count ?? 0));
  };

  // ===== Lesson handlers =====
  const handleSaveLesson = async () => {
    if (!activeUnit || !lessonName.trim()) return;
    const { data: lessonData } = await supabase.from('lessons').insert({
      unit_id: activeUnit.id,
      name: lessonName.trim(),
      order_index: (lessonsByUnit.get(activeUnit.id) ?? []).length,
    }).select('*').single();

    if (lessonData) {
      const newLesson = lessonData as Lesson;
      const { pages: uploaded, errors: uploadErrors } = await uploadLessonImages(newLesson.id);
      setLessons([...lessons, newLesson]);
      await refreshPageCount(newLesson.id);
      if (uploadErrors.length > 0) {
        setLessonImageError(uploadErrors[0]);
      } else {
        setLessonName('');
        setNewFiles([]);
        setExistingPages([]);
        setShowAddLesson(false);
      }
    }
  };

  const handleSaveEditLesson = async () => {
    if (!editingLesson || !lessonName.trim()) return;
    await supabase.from('lessons').update({ name: lessonName.trim() }).eq('id', editingLesson.id);
    setLessons(lessons.map(l => l.id === editingLesson.id ? { ...l, name: lessonName.trim() } : l));

    const { errors: uploadErrors } = await uploadLessonImages(editingLesson.id);
    await refreshPageCount(editingLesson.id);

    if (uploadErrors.length > 0) {
      setLessonImageError(uploadErrors[0]);
    } else {
      setEditingLesson(null);
      setLessonName('');
      setNewFiles([]);
      setExistingPages([]);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteLessonId) return;
    // Delete images from storage
    const { data: pages } = await supabase.from('lesson_pages').select('image_url').eq('lesson_id', deleteLessonId);
    for (const p of (pages ?? []) as { image_url: string }[]) {
      const path = p.image_url.split('/lesson-pages/')[1];
      if (path) await supabase.storage.from('lesson-pages').remove([path]);
    }
    await supabase.from('lessons').delete().eq('id', deleteLessonId);
    setLessons(lessons.filter(l => l.id !== deleteLessonId));
    setAdventures(adventures.filter(a => a.lesson_id !== deleteLessonId));
    const newCounts = new Map(pageCounts);
    newCounts.delete(deleteLessonId);
    setPageCounts(newCounts);
    setDeleteLessonId(null);
  };

  const openEditLesson = async (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonName(lesson.name);
    setNewFiles([]);
    setLessonImageError('');
    const { data } = await supabase.from('lesson_pages').select('*').eq('lesson_id', lesson.id).order('order_index', { ascending: true });
    setExistingPages((data ?? []) as LessonPage[]);
  };

  // ===== Adventure generation — calls edge function =====
  const handleGenerateAdventure = async (lesson: Lesson) => {
    setGenerationError('');

    // VALIDATION 1: Lesson must have a name
    if (!lesson.name?.trim()) {
      setGenerationError('بيانات الدرس غير مكتملة.');
      return;
    }

    // VALIDATION 2: Lesson must have at least 1 persisted image
    const { count: pageCount, error: countErr } = await supabase
      .from('lesson_pages')
      .select('*', { count: 'exact', head: true })
      .eq('lesson_id', lesson.id);

    if (countErr || !pageCount || pageCount === 0) {
      setGenerationError('يجب رفع صورة واحدة على الأقل قبل إنشاء المغامرة.');
      return;
    }

    // VALIDATION 3: Max 10 images
    if (pageCount > MAX_PAGES) {
      setGenerationError(`يمكن رفع ${MAX_PAGES} صفحات كحد أقصى لكل درس.`);
      return;
    }

    // CHECK: Skip regeneration if adventure is already ready
    const existingAdv = adventuresByLesson.get(lesson.id);
    if (existingAdv && existingAdv.status === 'ready') {
      onStartAdventure(lesson.id);
      return;
    }

    setGeneratingLessonId(lesson.id);
    setGenerationError('');

    // Optimistically mark as generating in local state
    setAdventures(prev => {
      const existing = prev.find(a => a.lesson_id === lesson.id);
      if (existing) {
        return prev.map(a => a.lesson_id === lesson.id ? { ...a, status: 'generating' } : a);
      }
      return prev;
    });

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ lessonId: lesson.id }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok || result.error) {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : 'حدث خطأ أثناء إنشاء المغامرة. يرجى المحاولة مرة أخرى.';
        setGenerationError(errorMsg);

        // Refresh adventure status from DB to get the failed status
        const { data: advData } = await supabase
          .from('adventures')
          .select('*')
          .eq('lesson_id', lesson.id)
          .maybeSingle();

        if (advData) {
          const failedAdv = advData as Adventure;
          setAdventures(prev => {
            const existing = prev.find(a => a.lesson_id === lesson.id);
            if (existing) {
              return prev.map(a => a.lesson_id === lesson.id ? failedAdv : a);
            }
            return [...prev, failedAdv];
          });
        }
        setGeneratingLessonId(null);
        return;
      }

      // Success — reload adventures from DB
      const { data: advData } = await supabase
        .from('adventures')
        .select('*')
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      if (advData) {
        const readyAdv = advData as Adventure;
        setAdventures(prev => {
          const existing = prev.find(a => a.lesson_id === lesson.id);
          if (existing) {
            return prev.map(a => a.lesson_id === lesson.id ? readyAdv : a);
          }
          return [...prev, readyAdv];
        });
      }

      // Update lesson status if it was not_started
      if (lesson.status === 'not_started') {
        setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, status: 'in_progress' } : l));
      }
    } catch (err: unknown) {
      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      const errorMsg = isTimeout
        ? 'انتهت مهلة إنشاء المغامرة. يرجى المحاولة مرة أخرى.'
        : 'حدث خطأ أثناء إنشاء المغامرة. يرجى المحاولة مرة أخرى.';
      setGenerationError(errorMsg);

      const { data: advData } = await supabase
        .from('adventures')
        .select('*')
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      if (advData) {
        setAdventures(prev => {
          const existing = prev.find(a => a.lesson_id === lesson.id);
          if (existing) {
            return prev.map(a => a.lesson_id === lesson.id ? (advData as Adventure) : a);
          }
          return [...prev, advData as Adventure];
        });
      } else {
        setAdventures(prev => {
          const existing = prev.find(a => a.lesson_id === lesson.id);
          if (existing) {
            return prev.map(a => a.lesson_id === lesson.id ? { ...a, status: 'failed' as const, error_message: errorMsg } : a);
          }
          return prev;
        });
      }
    }

    setGeneratingLessonId(null);
  };

  // ===== Adventure upload + local persistence =====
  const handleSaveAdventureLocal = async () => {
    if (dropzoneImages.length === 0) {
      setAdventureSaveError('يرجى رفع صور صفحات الدرس أولًا.');
      return;
    }
    if (!adventureTitle.trim()) {
      setAdventureSaveError('يرجى إدخال اسم الدرس.');
      return;
    }

    setIsSavingAdventure(true);
    setAdventureSaveError('');

    try {
      const record: AdventureRecord = {
        id: crypto.randomUUID(),
        imageBase64: dropzoneImages.map((img) => img.dataUrl),
        lessonTitle: adventureTitle.trim(),
        generatedScript: '',
        timestampsData: [],
        createdAt: new Date().toISOString(),
        generationStatus: 'pending',
      };

      await saveAdventure(record);
      const all = await getAllAdventures();
      setSavedAdventures(all);
      setDropzoneImages([]);
      setAdventureTitle('');
    } catch {
      setAdventureSaveError('فشل في حفظ المغامرة. يرجى المحاولة مرة أخرى.');
    }

    setIsSavingAdventure(false);
  };

  const handleReplayAdventure = useCallback((record: AdventureRecord) => {
    // Find matching lesson by title in Supabase, or just start adventure if found
    const matchingLesson = lessons.find(
      (l) => l.name === record.lessonTitle
    );
    if (matchingLesson) {
      onStartAdventure(matchingLesson.id);
    }
  }, [lessons, onStartAdventure]);

  const handleDeleteSavedAdventure = async (id: string) => {
    try {
      await deleteAdventure(id);
      setSavedAdventures((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // Silent fail — UI already removed from state
    }
  };

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

  const renderAdventureButton = (lesson: Lesson) => {
    const adv = adventuresByLesson.get(lesson.id);
    const isGenerating = generatingLessonId === lesson.id;
    const showError = generationError && generatingLessonId === null && (!adv || adv.status === 'failed');

    if (isGenerating) {
      return (
        <span className="flex items-center gap-1.5 rounded-lg bg-warning-50 px-3 py-1.5 text-xs font-bold text-warning-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          جاري الإنشاء...
        </span>
      );
    }

    if (!adv || adv.status === 'failed') {
      return (
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => handleGenerateAdventure(lesson)}
            className="flex items-center gap-1.5 rounded-lg bg-secondary-50 px-3 py-1.5 text-xs font-bold text-secondary-600 transition-colors hover:bg-secondary-100"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {adv?.status === 'failed' ? 'إعادة المحاولة' : 'إنشاء المغامرة'}
          </button>
          {showError && (
            <span className="text-[10px] font-medium text-error-500 max-w-[180px] text-left">
              {generationError}
            </span>
          )}
        </div>
      );
    }

    if (adv.status === 'generating') {
      return (
        <span className="flex items-center gap-1.5 rounded-lg bg-warning-50 px-3 py-1.5 text-xs font-bold text-warning-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          جاري الإنشاء...
        </span>
      );
    }

    // status === 'ready'
    return (
      <button
        onClick={() => onStartAdventure(lesson.id)}
        className="flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-bold text-success-600 transition-colors hover:bg-success-100"
      >
        <Play className="h-3.5 w-3.5" />
        فتح المغامرة
      </button>
    );
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

          {/* ===== Unit management card ===== */}
          <div className="lg:col-span-2">
            <div className="flex h-full flex-col rounded-2xl bg-white p-6 card-shadow animate-slide-up">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-extrabold text-gray-800">وحدات العلوم</h2>
                <Button variant="primary" size="sm" onClick={() => { setShowAddUnit(true); setUnitName(''); }}>
                  <Plus className="h-4 w-4" />
                  إضافة وحدة
                </Button>
              </div>

              {units.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-500">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-gray-800">لا توجد وحدات بعد</h3>
                  <p className="mt-2 max-w-sm text-gray-500">ابدئي بإضافة وحدات العلوم لطفلك، ثم أضيفي الدروس والصور داخل كل وحدة.</p>
                  <Button variant="primary" size="md" className="mt-6" onClick={() => { setShowAddUnit(true); setUnitName(''); }}>
                    <Plus className="h-4 w-4" />
                    إضافة وحدة
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {units.map((unit, unitIdx) => {
                    const unitLessons = lessonsByUnit.get(unit.id) ?? [];
                    const isExpanded = activeUnit?.id === unit.id;
                    return (
                      <div key={unit.id} className="rounded-xl border-2 border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setActiveUnit(isExpanded ? null : unit)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                            </button>
                            <h3 className="font-display text-base font-bold text-gray-800">
                              الوحدة {unitIdx + 1}: {unit.name}
                            </h3>
                            <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-600">
                              {unitLessons.length} دروس
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setEditingUnit(unit); setEditUnitName(unit.name); }}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              تعديل
                            </button>
                            <button
                              onClick={() => setDeleteUnitId(unit.id)}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-error-500 transition-colors hover:bg-error-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              حذف
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-5 py-4">
                            {unitLessons.length === 0 ? (
                              <p className="py-3 text-sm text-gray-400">لا توجد دروس في هذه الوحدة</p>
                            ) : (
                              <div className="space-y-2 mb-3">
                                {unitLessons.map((lesson, lIdx) => {
                                  const pageCount = pageCounts.get(lesson.id) ?? 0;
                                  return (
                                    <div key={lesson.id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-600">
                                          {lIdx + 1}
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-700">{lesson.name}</p>
                                          <div className="mt-0.5 flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                              <FileText className="h-3 w-3" />
                                              {pageCount} صفحات
                                            </span>
                                            {pageCount > 0 && (
                                              <span className="text-xs text-success-500">محفوظة</span>
                                            )}
                                          </div>
                                        </div>
                                        {renderAdventureButton(lesson)}
                                        <button
                                          onClick={() => openEditLesson(lesson)}
                                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-50"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                          تعديل
                                        </button>
                                        <button
                                          onClick={() => setDeleteLessonId(lesson.id)}
                                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-error-500 transition-colors hover:bg-error-50"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          حذف
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <Button variant="outline" size="sm" onClick={() => { setActiveUnit(unit); setShowAddLesson(true); setLessonName(''); setNewFiles([]); setExistingPages([]); setLessonImageError(''); }}>
                              <Plus className="h-4 w-4" />
                              إضافة درس
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== Adventure Upload + History (two-column on desktop) ===== */}
        <div className="mb-8 grid gap-6 lg:grid-cols-5">
          {/* Left: Upload area (60%) */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-white p-6 card-shadow animate-slide-up">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-gray-800">رفع درس جديد</h2>
                  <p className="text-xs text-gray-400">ارفعي صور صفحات الدرس لإنشاء مغامرة</p>
                </div>
              </div>

              <div className="mb-4">
                <Input
                  label="اسم الدرس"
                  type="text"
                  placeholder="مثال: خصائص الكائنات الحية"
                  value={adventureTitle}
                  onChange={(e) => setAdventureTitle(e.target.value)}
                />
              </div>

              <LessonImageDropzone
                images={dropzoneImages}
                onImagesChange={setDropzoneImages}
              />

              {adventureSaveError && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm font-bold text-error-600 ring-1 ring-error-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {adventureSaveError}
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <Button
                  size="md"
                  onClick={handleSaveAdventureLocal}
                  disabled={isSavingAdventure || dropzoneImages.length === 0 || !adventureTitle.trim()}
                >
                  {isSavingAdventure ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...</>
                  ) : (
                    <><Save className="h-4 w-4" /> حفظ المغامرة</>
                  )}
                </Button>
                {(dropzoneImages.length > 0 || adventureTitle) && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => { setDropzoneImages([]); setAdventureTitle(''); setAdventureSaveError(''); }}
                  >
                    مسح
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right: History grid (40%) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 card-shadow animate-slide-up">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-gray-800">المغامرات المحفوظة</h2>
                  <p className="text-xs text-gray-400">{savedAdventures.length} مغامرة محفوظة</p>
                </div>
              </div>

              {savedAdventures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-300">
                    <Clock className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-gray-400">لا توجد مغامرات محفوظة بعد</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {savedAdventures.map((record) => (
                    <div
                      key={record.id}
                      className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    >
                      {/* Thumbnail */}
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                        {record.imageBase64 && record.imageBase64.length > 0 ? (
                          <img src={record.imageBase64[0]} alt={record.lessonTitle} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-700">{record.lessonTitle}</p>
                        <p className="text-xs text-gray-400">
                          {record.imageBase64?.length ?? 0} صور
                        </p>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handleReplayAdventure(record)}
                        className="flex items-center justify-center rounded-lg bg-success-50 p-2 text-success-600 transition-colors hover:bg-success-100"
                        title="إعادة تشغيل المغامرة"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSavedAdventure(record.id)}
                        className="flex items-center justify-center rounded-lg bg-error-50 p-2 text-error-500 transition-colors hover:bg-error-100"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== Saved Adventures Full Grid ===== */}
        {savedAdventures.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 font-display text-xl font-extrabold text-gray-800">سجل المغامرات</h2>
            <SavedAdventuresGrid
              adventures={savedAdventures}
              onReplay={handleReplayAdventure}
              onDelete={handleDeleteSavedAdventure}
            />
          </div>
        )}

        {/* ===== خطة العلوم — الترم الأول (UNCHANGED) ===== */}
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

      {/* ===== Add Unit Modal ===== */}
      {showAddUnit && (
        <Modal title="إضافة وحدة جديدة" onClose={() => setShowAddUnit(false)}>
          <Input
            label="اسم الوحدة"
            type="text"
            placeholder="مثال: الوحدة الأولى — الكائنات الحية"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            autoFocus
          />
          <div className="mt-6 flex gap-3">
            <Button size="md" onClick={handleSaveUnit}>
              <Check className="h-4 w-4" />
              حفظ الوحدة
            </Button>
            <Button variant="ghost" size="md" onClick={() => setShowAddUnit(false)}>
              إلغاء
            </Button>
          </div>
        </Modal>
      )}

      {/* ===== Edit Unit Modal ===== */}
      {editingUnit && (
        <Modal title="تعديل الوحدة" onClose={() => setEditingUnit(null)}>
          <Input
            label="اسم الوحدة"
            type="text"
            value={editUnitName}
            onChange={(e) => setEditUnitName(e.target.value)}
            autoFocus
          />
          <div className="mt-6 flex gap-3">
            <Button size="md" onClick={handleSaveEditUnit}>
              <Check className="h-4 w-4" />
              حفظ التعديلات
            </Button>
            <Button variant="ghost" size="md" onClick={() => setEditingUnit(null)}>
              إلغاء
            </Button>
          </div>
        </Modal>
      )}

      {/* ===== Delete Unit Confirmation ===== */}
      {deleteUnitId && (
        <ConfirmModal
          title="هل أنتِ متأكدة من حذف هذه الوحدة؟"
          message="سيتم حذف الوحدة وجميع الدروس والصور الموجودة بداخلها."
          confirmLabel="حذف الوحدة"
          onConfirm={handleDeleteUnit}
          onCancel={() => setDeleteUnitId(null)}
        />
      )}

      {/* ===== Add Lesson Modal ===== */}
      {showAddLesson && activeUnit && (
        <Modal title="إضافة درس جديد" onClose={() => setShowAddLesson(false)}>
          <p className="mb-4 text-sm font-bold text-gray-600">
            الوحدة: {activeUnit.name}
          </p>
          <Input
            label="اسم الدرس"
            type="text"
            placeholder="مثال: خصائص الكائنات الحية"
            value={lessonName}
            onChange={(e) => setLessonName(e.target.value)}
            autoFocus
          />
          <div className="mt-5">
            <label className="block text-sm font-bold text-gray-700">صور صفحات الدرس</label>
            <p className="mt-1 text-xs text-gray-400">ارفعي صور صفحات الدرس بوضوح، بحد أقصى {MAX_PAGES} صفحات.</p>
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 transition-colors hover:border-primary-400 hover:bg-primary-50">
              <Upload className="mb-2 h-8 w-8 text-gray-300" />
              <span className="text-sm font-bold text-gray-600">رفع الصور</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              />
            </label>
            {lessonImageError && (
              <p className="mt-2 text-sm font-bold text-error-500">{lessonImageError}</p>
            )}
            {(newFiles.length > 0) && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-bold text-gray-600">الصفحات المرفوعة: {newFiles.length}/{MAX_PAGES}</p>
                <div className="grid grid-cols-5 gap-2">
                  {newFiles.map((file, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                      <img src={URL.createObjectURL(file)} alt="صفحة" className="h-full w-full object-cover" />
                      <button
                        onClick={() => handleRemoveNewFile(i)}
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            <Button size="md" onClick={handleSaveLesson}>
              <Check className="h-4 w-4" />
              حفظ الدرس
            </Button>
            <Button variant="ghost" size="md" onClick={() => setShowAddLesson(false)}>
              إلغاء
            </Button>
          </div>
        </Modal>
      )}

      {/* ===== Edit Lesson Modal ===== */}
      {editingLesson && (
        <Modal title="تعديل الدرس" onClose={() => setEditingLesson(null)}>
          <Input
            label="اسم الدرس"
            type="text"
            value={lessonName}
            onChange={(e) => setLessonName(e.target.value)}
            autoFocus
          />
          <div className="mt-5">
            <label className="block text-sm font-bold text-gray-700">صور صفحات الدرس</label>
            <p className="mt-1 text-xs text-gray-400">بحد أقصى {MAX_PAGES} صفحات.</p>
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 transition-colors hover:border-primary-400 hover:bg-primary-50">
              <Upload className="mb-2 h-8 w-8 text-gray-300" />
              <span className="text-sm font-bold text-gray-600">رفع الصور</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              />
            </label>
            {lessonImageError && (
              <p className="mt-2 text-sm font-bold text-error-500">{lessonImageError}</p>
            )}
            {(existingPages.length > 0 || newFiles.length > 0) && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-bold text-gray-600">الصفحات: {existingPages.length + newFiles.length}/{MAX_PAGES}</p>
                <div className="grid grid-cols-5 gap-2">
                  {existingPages.map((img) => (
                    <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                      <img src={img.image_url} alt="صفحة" className="h-full w-full object-cover" />
                      <button
                        onClick={() => handleRemoveExistingPage(img.id, img.image_url)}
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {newFiles.map((file, i) => (
                    <div key={`new-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                      <img src={URL.createObjectURL(file)} alt="صفحة" className="h-full w-full object-cover" />
                      <button
                        onClick={() => handleRemoveNewFile(i)}
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            <Button size="md" onClick={handleSaveEditLesson}>
              <Check className="h-4 w-4" />
              حفظ التعديلات
            </Button>
            <Button variant="ghost" size="md" onClick={() => setEditingLesson(null)}>
              إلغاء
            </Button>
          </div>
        </Modal>
      )}

      {/* ===== Delete Lesson Confirmation ===== */}
      {deleteLessonId && (
        <ConfirmModal
          title="هل أنتِ متأكدة من حذف هذا الدرس؟"
          message="سيتم حذف الدرس وصور صفحاته."
          confirmLabel="حذف الدرس"
          onConfirm={handleDeleteLesson}
          onCancel={() => setDeleteLessonId(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// Shared Modal components
// ============================================================
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 animate-fade-in">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-8 animate-slide-up">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 animate-slide-up">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-50 text-error-500">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-extrabold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="primary" size="md" className="bg-error-500 hover:bg-error-600 shadow-error-500/30" onClick={onConfirm}>
            <Trash2 className="h-4 w-4" />
            {confirmLabel}
          </Button>
          <Button variant="ghost" size="md" onClick={onCancel}>
            إلغاء
          </Button>
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


