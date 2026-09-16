import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Child, Unit, Lesson, Progress, Concept } from '@/lib/types';

export function useChildData(childId: string | null) {
  const [child, setChild] = useState<Child | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!childId) return;
    setLoading(true);

    const [childRes, unitsRes] = await Promise.all([
      supabase.from('children').select('*').eq('id', childId).maybeSingle(),
      supabase.from('units').select('*').eq('child_id', childId).order('order_index', { ascending: true }),
    ]);

    setChild(childRes.data as Child | null);
    const unitsData = (unitsRes.data ?? []) as Unit[];
    setUnits(unitsData);

    if (unitsData.length > 0) {
      const unitIds = unitsData.map((u) => u.id);
      const [lessonsRes, progressRes, conceptsRes] = await Promise.all([
        supabase.from('lessons').select('*').in('unit_id', unitIds).order('order_index', { ascending: true }),
        supabase.from('progress').select('*').eq('child_id', childId),
        supabase.from('concepts').select('*').eq('child_id', childId),
      ]);
      setLessons((lessonsRes.data ?? []) as Lesson[]);
      setProgress((progressRes.data ?? []) as Progress[]);
      setConcepts((conceptsRes.data ?? []) as Concept[]);
    } else {
      setLessons([]);
      setProgress([]);
      setConcepts([]);
    }

    setLoading(false);
  }, [childId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { child, units, lessons, progress, concepts, loading, refetch: fetchAll };
}
