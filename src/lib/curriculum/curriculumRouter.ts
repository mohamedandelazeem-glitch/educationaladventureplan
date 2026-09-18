import { normalizeArabicText, normalizeKeyword } from '../arabicTextNormalizer';
import { CURRICULUM_ROUTES } from './curriculumMappings';
import { parseDynamicLesson } from './dynamicFallbackParser';
import type {
  CurriculumRoute,
  LessonMetadata,
  RouteResult,
} from './types';

interface RouteScore {
  route: CurriculumRoute;
  totalWeight: number;
  matchedKeywords: string[];
}

/**
 * Scores a single curriculum route against the normalized text.
 *
 * Each keyword is searched as a substring in the normalized text.
 * The total weight is the sum of matched keyword weights.
 * Generic words (weight 1) alone are not enough — the threshold enforces
 * that distinctive terms must be present.
 */
function scoreRoute(
  route: CurriculumRoute,
  normalizedText: string,
  metadata: LessonMetadata | undefined,
): RouteScore {
  let totalWeight = 0;
  const matchedKeywords: string[] = [];

  for (const entry of route.keywords) {
    const normalizedKeyword = normalizeKeyword(entry.word);
    if (normalizedText.includes(normalizedKeyword)) {
      totalWeight += entry.weight;
      matchedKeywords.push(entry.word);
    }
  }

  // Page metadata boost: if the provided page number matches the route's pages,
  // add a small confidence boost to help disambiguate between routes.
  if (metadata?.pageNumber && route.pages.includes(metadata.pageNumber)) {
    totalWeight += 2;
  }

  return { route, totalWeight, matchedKeywords };
}

/**
 * Routes lesson OCR content to either a known curriculum route or the dynamic
 * fallback parser.
 *
 * Algorithm:
 * 1. Preserve original OCR text.
 * 2. Normalize the text (diacritics, tatweel, alef/yaa, punctuation).
 * 3. Score each curriculum route via weighted keyword matching.
 * 4. Filter routes that meet their threshold.
 * 5. Pick the highest-scoring route.
 * 6. If no route meets its threshold, use dynamic fallback.
 *
 * A single generic word (e.g. "ماء") will NOT trigger a curriculum route
 * because distinctive terms carry higher weight and thresholds are set
 * accordingly.
 */
export function routeLessonContent(
  ocrText: string,
  metadata?: LessonMetadata,
): RouteResult {
  const { normalized, original } = normalizeArabicText(ocrText);

  if (!normalized) {
    return {
      mode: 'dynamic',
      confidence: 0,
      matchedKeywords: [],
      concepts: [],
      animationActions: ['idle'],
      sourceText: original,
      dynamic: parseDynamicLesson(original, metadata),
    };
  }

  // Score all routes
  const scored = CURRICULUM_ROUTES.map((route) =>
    scoreRoute(route, normalized, metadata),
  );

  // Filter routes that meet their threshold
  const qualifying = scored.filter((s) => s.totalWeight >= s.route.threshold);

  if (qualifying.length === 0) {
    // Dynamic fallback
    const dynamic = parseDynamicLesson(original, metadata);
    return {
      mode: 'dynamic',
      confidence: 0,
      matchedKeywords: [],
      concepts: dynamic.concepts,
      animationActions: dynamic.candidatePandaActions,
      sourceText: original,
      dynamic,
    };
  }

  // Pick the highest-scoring route; tie-break by more matched keywords
  qualifying.sort((a, b) => {
    if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight;
    return b.matchedKeywords.length - a.matchedKeywords.length;
  });

  const best = qualifying[0];

  // Confidence: ratio of achieved weight to a reference maximum
  // The reference is the sum of all keyword weights in the route
  const maxPossible = best.route.keywords.reduce((sum, k) => sum + k.weight, 0);
  const confidence = Math.min(best.totalWeight / maxPossible, 1);

  return {
    mode: 'curriculum',
    confidence,
    matchedPages: best.route.pages,
    matchedKeywords: best.matchedKeywords,
    concepts: best.route.concepts,
    animationActions: best.route.animationActions,
    scriptTemplate: best.route.sceneIntention,
    sourceText: original,
    routeId: best.route.id,
  };
}
