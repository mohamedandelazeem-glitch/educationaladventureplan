import { describe, it, expect } from 'vitest';
import { parseDynamicLesson } from '../dynamicFallbackParser';
import type { LessonMetadata } from '../types';

describe('dynamicFallbackParser', () => {
  it('extracts key terms from text', () => {
    const result = parseDynamicLesson('درسنا اليوم عن الرحلات والسفر حول العالم');
    expect(result.keyTerms.length).toBeGreaterThan(0);
    expect(result.keyTerms).toContain('الرحلات');
    expect(result.keyTerms).toContain('والسفر');
  });

  it('filters out stop words from key terms', () => {
    const result = parseDynamicLesson('في المدرسة نتعلم عن العلوم والرياضيات');
    expect(result.keyTerms).not.toContain('في');
  });

  it('maps detected keywords to panda actions', () => {
    const result = parseDynamicLesson('الباندا ياكل الطعام ويشرب الماء');
    expect(result.candidatePandaActions).toContain('eating');
    expect(result.candidatePandaActions).toContain('deep_drilling');
  });

  it('falls back to idle when no animation mapping matches', () => {
    const result = parseDynamicLesson('الكواكب تدور حول المجرات البعيدة');
    expect(result.candidatePandaActions).toContain('idle');
  });

  it('generates candidate scenes', () => {
    const result = parseDynamicLesson('تعرفنا على الجبال والانهار');
    expect(result.candidateScenes.length).toBeGreaterThan(0);
    expect(result.candidateScenes[0]).toContain('الباندا');
  });

  it('infers a topic from the first sentence', () => {
    const result = parseDynamicLesson('الرحلات ممتعة ونتعلم منها الكثير');
    expect(result.topic).toBeTruthy();
    expect(result.topic.length).toBeGreaterThan(0);
  });

  it('handles empty text', () => {
    const result = parseDynamicLesson('');
    expect(result.topic).toBe('درس عام');
    expect(result.candidatePandaActions).toContain('idle');
  });

  it('uses lesson title from metadata when text is empty', () => {
    const meta: LessonMetadata = { lessonTitle: 'الجغرافيا' };
    const result = parseDynamicLesson('', meta);
    expect(result.topic).toBe('الجغرافيا');
  });
});
