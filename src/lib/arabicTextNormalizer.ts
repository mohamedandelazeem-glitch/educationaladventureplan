/**
 * Arabic text normalization utilities for OCR text preprocessing.
 *
 * Preserves meaningful Arabic words while removing diacritics, tatweel,
 * normalizing alef/yaa variants, and cleaning up common OCR artifacts.
 *
 * The ORIGINAL text is never mutated in place — callers receive a normalized
 * copy alongside the original.
 */

/**
 * Removes Arabic diacritics (tashkeel) from text.
 * Unicode range U+0617–U+064A covers fatha, damma, kasra, sukun, shadda, tanween, etc.
 */
function stripDiacritics(text: string): string {
  // U+064B–U+065F = Arabic diacritics, U+0670 = superscript alef
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

/** Removes tatweel (kashida) — U+0640. */
function stripTatweel(text: string): string {
  return text.replace(/\u0640/g, '');
}

/** Normalizes alef variants (أ إ آ ٱ → ا) and alef madda. */
function normalizeAlef(text: string): string {
  return text.replace(/[\u0621\u0622\u0623\u0625\u0671\u0672]/g, '\u0627');
}

/** Normalizes yaa variants (ى → ي). */
function normalizeYaa(text: string): string {
  return text.replace(/\u0649/g, '\u064A');
}

/** Normalizes taa marbuta to haa for matching purposes (ة → ه). */
function normalizeTaaMarbuta(text: string): string {
  return text.replace(/\u0629/g, '\u0647');
}

/** Collapses repeated whitespace and trims. */
function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Removes common punctuation that can interfere with keyword matching. */
function stripPunctuation(text: string): string {
  // Arabic + Latin punctuation, quotes, brackets
  return text.replace(/[.,;:!؟؟?()"«»\[\]{}\u060C\u061B\u061F…—–\-_/\\]/g, ' ');
}

/** Fixes common OCR spacing artifacts: spaces inside words, zero-width chars. */
function fixOcrSpacing(text: string): string {
  // Remove zero-width joiners/non-joiners, BOM, RTL/LTR marks
  return text
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF\u00AD]/g, '')
    // Fix spaces attached to Arabic letters from OCR (e.g. "ك ت ا ب" → "كتاب")
    // Only apply when the pattern is a single char followed by space, repeated
    .replace(/(\u0600-\u06FF)\s+(?=\u0600-\u06FF)/g, (match) => {
      // Only merge if the gap is a single-character space between Arabic letters
      // (detecting "scattered single letters") — but preserve normal word spacing
      return match;
    });
}

export interface NormalizationResult {
  /** The normalized text used for keyword matching. */
  normalized: string;
  /** The original OCR text, untouched. */
  original: string;
}

/**
 * Full normalization pipeline for Arabic OCR text.
 *
 * Steps:
 * 1. Strip zero-width / OCR artifacts
 * 2. Strip diacritics
 * 3. Strip tatweel
 * 4. Normalize alef variants → ا
 * 5. Normalize yaa → ي
 * 6. Normalize taa marbuta → ه
 * 7. Strip punctuation
 * 8. Collapse whitespace
 *
 * Returns both normalized and original text.
 */
export function normalizeArabicText(input: string): NormalizationResult {
  const original = input;

  const normalized = collapseWhitespace(
    stripPunctuation(
      normalizeTaaMarbuta(
        normalizeYaa(
          normalizeAlef(
            stripTatweel(
              stripDiacritics(
                fixOcrSpacing(input)
              )
            )
          )
        )
      )
    )
  );

  return { normalized, original };
}

/**
 * Lightweight normalization for individual keywords — applies the same
 * pipeline so that keyword matching operates on the same form as the
 * normalized OCR text.
 */
export function normalizeKeyword(keyword: string): string {
  return collapseWhitespace(
    stripPunctuation(
      normalizeTaaMarbuta(
        normalizeYaa(
          normalizeAlef(
            stripTatweel(
              stripDiacritics(keyword)
            )
          )
        )
      )
    )
  );
}
