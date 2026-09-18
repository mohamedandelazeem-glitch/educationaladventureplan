import { describe, it, expect } from 'vitest';
import { routeLessonContent } from '../curriculumRouter';
import type { LessonMetadata } from '../types';

describe('curriculumRouter', () => {
  describe('curriculum matching', () => {
    it('routes page 9 content to curriculum (breathing/eating)', () => {
      const result = routeLessonContent(
        'الكائنات الحية تحتاج إلى التنفس والتغذية وتنمو.',
      );
      expect(result.mode).toBe('curriculum');
      expect(result.routeId).toBe('living_things_properties');
      expect(result.matchedPages).toContain(9);
      expect(result.animationActions).toContain('breathing');
      expect(result.animationActions).toContain('eating');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('routes lens/observation content to curriculum', () => {
      const result = routeLessonContent(
        'نلاحظ الأشياء باستخدام عدسة مكبرة لنرى التفاصيل.',
      );
      expect(result.mode).toBe('curriculum');
      expect(result.routeId).toBe('observation_lens');
      expect(result.animationActions).toContain('lens_inspecting');
    });

    it('routes habitat content to curriculum', () => {
      const result = routeLessonContent(
        'تعيش بعض الحيوانات في جحور وتختبئ في ظل الصخور.',
      );
      expect(result.mode).toBe('curriculum');
      expect(result.routeId).toBe('habitats');
      expect(result.animationActions).toContain('shadow_hiding');
    });

    it('routes classification content to curriculum', () => {
      const result = routeLessonContent(
        'نصنف الحيوانات: لها أرجل أو بدون أرجل.',
      );
      expect(result.mode).toBe('curriculum');
      expect(result.routeId).toBe('classification');
      expect(result.animationActions).toContain('animal_sorting');
    });

    it('routes adaptation content to curriculum', () => {
      const result = routeLessonContent(
        'الفنك واليربوع والسنط أمثلة على التكيف في الصحراء.',
      );
      expect(result.mode).toBe('curriculum');
      expect(result.routeId).toBe('adaptation');
      expect(result.animationActions).toContain('big_ears_fanning');
    });
  });

  describe('page-aware matching', () => {
    it('uses page metadata to boost matching route', () => {
      const meta: LessonMetadata = { pageNumber: 11 };
      const result = routeLessonContent('نلاحظ الأشياء', meta);
      expect(result.mode).toBe('curriculum');
      expect(result.routeId).toBe('observation_lens');
    });
  });

  describe('dynamic fallback', () => {
    it('routes unrelated content to dynamic', () => {
      const result = routeLessonContent(
        'تعرفنا اليوم على الرحلات والسفر حول العالم.',
      );
      expect(result.mode).toBe('dynamic');
      expect(result.dynamic).toBeDefined();
      expect(result.dynamic!.candidatePandaActions.length).toBeGreaterThan(0);
    });

    it('routes empty text to dynamic with idle action', () => {
      const result = routeLessonContent('');
      expect(result.mode).toBe('dynamic');
      expect(result.animationActions).toContain('idle');
    });
  });

  describe('false-positive prevention', () => {
    it('does not route on a single generic word alone', () => {
      // "ماء" alone is weight 1 — not enough to trigger different_places (threshold 4)
      const result = routeLessonContent('الماء لذيذ');
      expect(result.mode).toBe('dynamic');
    });

    it('does not route unrelated scientific text to curriculum', () => {
      const result = routeLessonContent(
        'درسنا اليوم عن الكواكب والمجرات في الفضاء.',
      );
      expect(result.mode).toBe('dynamic');
    });

    it('does not route a single generic verb to curriculum', () => {
      const result = routeLessonContent('الأكل لذيذ');
      expect(result.mode).toBe('dynamic');
    });
  });

  describe('multi-keyword matching', () => {
    it('matches with multiple keywords from the same route', () => {
      const result = routeLessonContent(
        'الكائنات الحية تتنفس وتتغذى وتنمو في بيئتها.',
      );
      expect(result.mode).toBe('curriculum');
      expect(result.matchedKeywords.length).toBeGreaterThanOrEqual(2);
    });
  });
});
