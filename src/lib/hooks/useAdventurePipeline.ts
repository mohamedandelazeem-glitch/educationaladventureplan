import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { saveAdventure, getAllAdventures, type AdventureRecord } from '@/lib/adventureRepository';
import { routeLessonContent } from '@/lib/curriculum/curriculumRouter';
import { buildCaptionLoop } from '@/lib/curriculum/captionLoopEngine';
import type { ProcessedCaptionSegment } from '@/lib/curriculum/types';
import type { Lesson, Adventure, ExtractedContent } from '@/lib/types';

export type GenerationStatus = 'not_created' | 'generating' | 'ready' | 'failed';

export interface PipelineState {
  status: GenerationStatus;
  error: string;
  generatedAdventure: Adventure | null;
}

export interface AdventurePipelineResult {
  state: PipelineState;
  generate: (lesson: Lesson) => Promise<void>;
  savedAdventures: AdventureRecord[];
  refreshSavedAdventures: () => Promise<void>;
}

const MAX_PAGES = 10;

function extractOcrText(content: ExtractedContent | null): string {
  if (!content?.pages) return '';
  return content.pages
    .map((p) => p.text)
    .filter(Boolean)
    .join('\n');
}

/**
 * Isolated adventure generation pipeline.
 *
 * Sequence:
 * 1. Validate lesson + pages exist
 * 2. Check for existing ready adventure (skip regeneration)
 * 3. Call edge function (OCR/Vision + AI script generation)
 * 4. Route OCR text through curriculum router
 * 5. Generate caption loop from extracted text
 * 6. Persist adventure record to IndexedDB
 * 7. Refresh saved adventures list
 *
 * The caller receives state updates and can open the player when status === 'ready'.
 */
export function useAdventurePipeline(
  onAdventuresUpdated: (records: AdventureRecord[]) => void,
): AdventurePipelineResult {
  const [state, setState] = useState<PipelineState>({
    status: 'not_created',
    error: '',
    generatedAdventure: null,
  });
  const [savedAdventures, setSavedAdventures] = useState<AdventureRecord[]>([]);

  const refreshSavedAdventures = useCallback(async () => {
    try {
      const all = await getAllAdventures();
      setSavedAdventures(all);
      onAdventuresUpdated(all);
    } catch {
      // IndexedDB may be unavailable — non-fatal
    }
  }, [onAdventuresUpdated]);

  const generate = useCallback(async (lesson: Lesson) => {
    // STEP 1: Validate lesson
    if (!lesson || !lesson.id || !lesson.name?.trim()) {
      setState({
        status: 'failed',
        error: 'بيانات الدرس غير مكتملة.',
        generatedAdventure: null,
      });
      return;
    }

    // STEP 2: Validate pages exist + count
    const { data: pages, error: pagesErr } = await supabase
      .from('lesson_pages')
      .select('id, image_url, order_index')
      .eq('lesson_id', lesson.id)
      .order('order_index', { ascending: true });

    if (pagesErr) {
      setState({
        status: 'failed',
        error: 'حدث خطأ أثناء قراءة صفحات الدرس. يرجى المحاولة مرة أخرى.',
        generatedAdventure: null,
      });
      return;
    }

    if (!pages || pages.length === 0) {
      setState({
        status: 'failed',
        error: 'لا توجد صور لهذا الدرس. يرجى رفع صور صفحات الدرس أولًا.',
        generatedAdventure: null,
      });
      return;
    }

    if (pages.length > MAX_PAGES) {
      setState({
        status: 'failed',
        error: `يمكن رفع ${MAX_PAGES} صفحات كحد أقصى لكل درس.`,
        generatedAdventure: null,
      });
      return;
    }

    // STEP 3: Check for existing ready adventure — skip regeneration
    const { data: existingAdv } = await supabase
      .from('adventures')
      .select('*')
      .eq('lesson_id', lesson.id)
      .maybeSingle();

    if (existingAdv && (existingAdv as Adventure).status === 'ready') {
      setState({
        status: 'ready',
        error: '',
        generatedAdventure: existingAdv as Adventure,
      });
      return;
    }

    // STEP 4: Set generating status
    setState({
      status: 'generating',
      error: '',
      generatedAdventure: null,
    });

    try {
      // STEP 5: Call edge function for OCR/Vision + AI script generation
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ lessonId: lesson.id }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        const errorMsg = result.error || 'حدث خطأ أثناء إنشاء المغامرة. يرجى المحاولة مرة أخرى.';

        // Refresh adventure status from DB to get the failed status
        const { data: advData } = await supabase
          .from('adventures')
          .select('*')
          .eq('lesson_id', lesson.id)
          .maybeSingle();

        setState({
          status: 'failed',
          error: typeof errorMsg === 'string' ? errorMsg : 'حدث خطأ أثناء إنشاء المغامرة. يرجى المحاولة مرة أخرى.',
          generatedAdventure: (advData as Adventure) ?? null,
        });
        return;
      }

      // STEP 6: Fetch the completed adventure with extracted content
      const { data: advData } = await supabase
        .from('adventures')
        .select('*')
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      if (!advData) {
        setState({
          status: 'failed',
          error: 'لم يتم العثور على المغامرة بعد الإنشاء.',
          generatedAdventure: null,
        });
        return;
      }

      const adventure = advData as Adventure;

      // STEP 7: Route OCR text through curriculum router
      const ocrText = extractOcrText(adventure.extracted_content);
      const routeResult = routeLessonContent(ocrText, {
        lessonTitle: lesson.name,
      });

      // STEP 8: Generate caption loop from extracted page text
      const captionTexts = adventure.extracted_content?.pages
        ?.map((p) => p.text)
        .filter(Boolean) ?? [];

      let captions: ProcessedCaptionSegment[] = [];
      if (captionTexts.length > 0) {
        captions = buildCaptionLoop(captionTexts);
      }

      // STEP 9: Persist adventure record to IndexedDB
      const { data: pageRows } = await supabase
        .from('lesson_pages')
        .select('image_url')
        .eq('lesson_id', lesson.id)
        .order('order_index', { ascending: true });

      const imageUrls = (pageRows ?? []).map((p: { image_url: string }) => p.image_url);

      const record: AdventureRecord = {
        id: adventure.id,
        imageBase64: imageUrls,
        lessonTitle: lesson.name,
        generatedScript: routeResult.scriptTemplate ?? routeResult.sourceText,
        timestampsData: captions as object[],
        createdAt: new Date().toISOString(),
        sourceFacts: adventure.extracted_content?.key_facts ?? [],
        concepts: routeResult.concepts,
        scenes: adventure.extracted_content?.pages as object[] ?? [],
        animationStates: { actions: routeResult.animationActions, mode: routeResult.mode },
        generationStatus: 'ready',
      };

      try {
        await saveAdventure(record);
        await refreshSavedAdventures();
      } catch {
        // IndexedDB failure is non-fatal — adventure is in Supabase
      }

      // STEP 10: Update lesson status if not_started
      if (lesson.status === 'not_started') {
        await supabase
          .from('lessons')
          .update({ status: 'in_progress' })
          .eq('id', lesson.id);
      }

      setState({
        status: 'ready',
        error: '',
        generatedAdventure: adventure,
      });
    } catch {
      // Network or unexpected error
      const { data: advData } = await supabase
        .from('adventures')
        .select('*')
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      setState({
        status: 'failed',
        error: 'حدث خطأ أثناء إنشاء المغامرة. يرجى المحاولة مرة أخرى.',
        generatedAdventure: (advData as Adventure) ?? null,
      });
    }
  }, [refreshSavedAdventures]);

  return {
    state,
    generate,
    savedAdventures,
    refreshSavedAdventures,
  };
}
