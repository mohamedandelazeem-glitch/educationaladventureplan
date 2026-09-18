import { describe, it, expect } from 'vitest';
import {
  detectImportantMarker,
  createCaptionSegments,
  expandCaptionLoop,
  buildCaptionLoop,
  getTotalDuration,
  getFontScale,
  getCaptionColor,
  shouldPulse,
  shouldTriggerApplause,
  REPEAT_FONT_SCALE,
} from '../captionLoopEngine';

describe('captionLoopEngine', () => {
  describe('detectImportantMarker', () => {
    it('detects [حفظ_مهم] marker', () => {
      const { cleanedText, isImportant } = detectImportantMarker(
        'الكائنات الحية تتنفس [حفظ_مهم]',
      );
      expect(isImportant).toBe(true);
      expect(cleanedText).toBe('الكائنات الحية تتنفس');
    });

    it('returns isImportant=false when no marker', () => {
      const { cleanedText, isImportant } = detectImportantMarker('نص عادي');
      expect(isImportant).toBe(false);
      expect(cleanedText).toBe('نص عادي');
    });
  });

  describe('createCaptionSegments', () => {
    it('creates segments with sequential timing', () => {
      const segments = createCaptionSegments(['نص اول', 'نص ثاني']);
      expect(segments).toHaveLength(2);
      expect(segments[0].startTime).toBe(0);
      expect(segments[1].startTime).toBe(segments[0].endTime);
    });

    it('marks important segments with repeatCount=2', () => {
      const segments = createCaptionSegments([
        'الكائنات تتنفس [حفظ_مهم]',
      ]);
      expect(segments[0].emphasis).toBe('important');
      expect(segments[0].repeatCount).toBe(2);
    });

    it('marks normal segments with repeatCount=1', () => {
      const segments = createCaptionSegments(['نص عادي']);
      expect(segments[0].emphasis).toBe('normal');
      expect(segments[0].repeatCount).toBe(1);
    });

    it('strips the important marker from displayed text', () => {
      const segments = createCaptionSegments([
        'الكائنات تتنفس [حفظ_مهم]',
      ]);
      expect(segments[0].text).not.toContain('[حفظ_مهم]');
    });
  });

  describe('expandCaptionLoop', () => {
    it('duplicates important segments for double caption', () => {
      const segments = createCaptionSegments([
        'مقدمة',
        'معلومة مهمة [حفظ_مهم]',
        'خاتمة',
      ]);
      const expanded = expandCaptionLoop(segments);
      // 3 base segments + 1 repeat = 4
      expect(expanded).toHaveLength(4);
    });

    it('does not duplicate normal segments', () => {
      const segments = createCaptionSegments(['نص 1', 'نص 2']);
      const expanded = expandCaptionLoop(segments);
      expect(expanded).toHaveLength(2);
    });

    it('marks the repeated segment with isRepeat=true', () => {
      const segments = createCaptionSegments([
        'معلومة مهمة [حفظ_مهم]',
      ]);
      const expanded = expandCaptionLoop(segments);
      expect(expanded[0].isRepeat).toBe(false);
      expect(expanded[1].isRepeat).toBe(true);
    });

    it('schedules the repeat immediately after the first occurrence', () => {
      const segments = createCaptionSegments([
        'معلومة مهمة [حفظ_مهم]',
      ]);
      const expanded = expandCaptionLoop(segments);
      expect(expanded[1].scheduledStartTime).toBe(expanded[0].scheduledEndTime);
    });

    it('sets displayMode=highlight on repeated segments', () => {
      const segments = createCaptionSegments([
        'معلومة مهمة [حفظ_مهم]',
      ]);
      const expanded = expandCaptionLoop(segments);
      expect(expanded[1].displayMode).toBe('highlight');
    });

    it('does not mutate original segments', () => {
      const segments = createCaptionSegments([
        'معلومة مهمة [حفظ_مهم]',
      ]);
      const original = JSON.parse(JSON.stringify(segments));
      expandCaptionLoop(segments);
      expect(segments).toEqual(original);
    });
  });

  describe('emphasis helpers', () => {
    it('returns 1.25x font scale for repeated segments', () => {
      const segments = createCaptionSegments(['مهم [حفظ_مهم]']);
      const expanded = expandCaptionLoop(segments);
      expect(getFontScale(expanded[0])).toBe(1);
      expect(getFontScale(expanded[1])).toBe(REPEAT_FONT_SCALE);
      expect(REPEAT_FONT_SCALE).toBe(1.25);
    });

    it('returns bright yellow for repeated segments', () => {
      const segments = createCaptionSegments(['مهم [حفظ_مهم]']);
      const expanded = expandCaptionLoop(segments);
      expect(getCaptionColor(expanded[1])).toBe('#FBBF24');
    });

    it('returns pulse=true only for repeated segments', () => {
      const segments = createCaptionSegments(['مهم [حفظ_مهم]']);
      const expanded = expandCaptionLoop(segments);
      expect(shouldPulse(expanded[0])).toBe(false);
      expect(shouldPulse(expanded[1])).toBe(true);
    });

    it('triggers applause only on the repeat occurrence', () => {
      const segments = createCaptionSegments(['مهم [حفظ_مهم]']);
      const expanded = expandCaptionLoop(segments);
      expect(shouldTriggerApplause(expanded[0])).toBe(false);
      expect(shouldTriggerApplause(expanded[1])).toBe(true);
    });
  });

  describe('buildCaptionLoop (full pipeline)', () => {
    it('processes mixed normal and important captions', () => {
      const expanded = buildCaptionLoop([
        'مرحبا يا اطفال',
        'الكائنات الحية تتنفس [حفظ_مهم]',
        'شكرا لكم',
      ]);
      // 3 base + 1 repeat = 4
      expect(expanded).toHaveLength(4);
      expect(getTotalDuration(expanded)).toBeGreaterThan(0);
    });
  });

  describe('getTotalDuration', () => {
    it('returns 0 for empty segments', () => {
      expect(getTotalDuration([])).toBe(0);
    });

    it('returns the end time of the last segment', () => {
      const expanded = buildCaptionLoop(['نص اول', 'نص ثاني']);
      const last = expanded[expanded.length - 1];
      expect(getTotalDuration(expanded)).toBe(last.scheduledEndTime);
    });
  });
});
