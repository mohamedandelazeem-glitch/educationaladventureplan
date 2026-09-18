import { describe, it, expect } from 'vitest';
import {
  normalizeArabicText,
  normalizeKeyword,
} from '../../arabicTextNormalizer';

describe('arabicTextNormalizer', () => {
  describe('normalizeArabicText', () => {
    it('strips diacritics', () => {
      const { normalized } = normalizeArabicText('كِتَابٌ مَدْرَسَةٌ');
      expect(normalized).toBe('كتاب مدرسه');
    });

    it('strips tatweel', () => {
      const { normalized } = normalizeArabicText('كــتاب');
      expect(normalized).toBe('كتاب');
    });

    it('normalizes alef variants (أ إ آ → ا)', () => {
      const { normalized } = normalizeArabicText('أكل إبراهيم آمنة');
      expect(normalized).toBe('اكل ابراهيم امنه');
    });

    it('normalizes yaa (ى → ي)', () => {
      const { normalized } = normalizeArabicText('على الكبرى');
      expect(normalized).toBe('علي الكبري');
    });

    it('normalizes taa marbuta (ة → ه)', () => {
      const { normalized } = normalizeArabicText('مدرسة شجرة');
      expect(normalized).toBe('مدرسه شجره');
    });

    it('collapses repeated whitespace', () => {
      const { normalized } = normalizeArabicText('كتاب   مدرسة  قلم');
      expect(normalized).toBe('كتاب مدرسه قلم');
    });

    it('strips punctuation', () => {
      const { normalized } = normalizeArabicText('كتاب، مدرسة! قلم؟');
      expect(normalized).toBe('كتاب مدرسه قلم');
    });

    it('preserves original text', () => {
      const original = 'كِتَابٌ، مَدْرَسَةٌ!';
      const { normalized, original: preserved } = normalizeArabicText(original);
      expect(preserved).toBe(original);
      expect(normalized).not.toContain('،');
    });

    it('handles empty string', () => {
      const { normalized } = normalizeArabicText('');
      expect(normalized).toBe('');
    });

    it('handles text with mixed Arabic and Latin', () => {
      const { normalized } = normalizeArabicText('كتاب page 123');
      expect(normalized).toBe('كتاب page 123');
    });
  });

  describe('normalizeKeyword', () => {
    it('normalizes a keyword the same way as full text', () => {
      const keyword = normalizeKeyword('ظلّ الصُّخور');
      const { normalized } = normalizeArabicText('ظلّ الصُّخور كبير');
      expect(normalized).toContain(keyword);
    });

    it('normalizes alef and taa marbuta in keyword', () => {
      expect(normalizeKeyword('عدسة مكبرة')).toBe('عدسه مكبره');
    });
  });
});
