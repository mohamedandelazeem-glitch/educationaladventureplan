/**
 * Shared types for the curriculum routing, dynamic fallback, and caption
 * looping system. These types are isolated from the rest of the application
 * to keep the routing layer self-contained.
 */

/** A single keyword with an associated weight for scoring. */
export interface KeywordEntry {
  /** The Arabic keyword (will be normalized before matching). */
  word: string;
  /** Higher weight = more distinctive/important. Generic words get lower weight. */
  weight: number;
}

/** A curriculum route configuration for a specific textbook page or pages. */
export interface CurriculumRoute {
  /** Unique route identifier. */
  id: string;
  /** Human-readable title (Arabic). */
  title: string;
  /** Textbook page number(s) this route covers. */
  pages: number[];
  /** Keywords to match in normalized OCR text. */
  keywords: KeywordEntry[];
  /** Minimum total weighted score required to select this route. */
  threshold: number;
  /** Scientific concepts associated with this route. */
  concepts: string[];
  /** Panda animation actions to trigger. */
  animationActions: string[];
  /** Egyptian Arabic voice direction for the companion. */
  voiceDirection: string;
  /** Simplified MSA caption text. */
  captionText: string;
  /** Scene intention description. */
  sceneIntention: string;
}

/** Metadata optionally passed to the router. */
export interface LessonMetadata {
  pageNumber?: number;
  lessonTitle?: string;
  imageDescription?: string;
}

/** The result of routing lesson content. */
export interface RouteResult {
  /** "curriculum" if matched a known route, "dynamic" if fallback. */
  mode: 'curriculum' | 'dynamic';
  /** Confidence score 0–1. */
  confidence: number;
  /** Matched page number(s) if curriculum mode. */
  matchedPages?: number[];
  /** Keywords that triggered the match. */
  matchedKeywords: string[];
  /** Scientific concepts identified. */
  concepts: string[];
  /** Panda animation actions to play. */
  animationActions: string[];
  /** Scene description / script template. */
  scriptTemplate?: string;
  /** The original OCR source text. */
  sourceText: string;
  /** The route ID if curriculum mode. */
  routeId?: string;
  /** Dynamic fallback data if mode is "dynamic". */
  dynamic?: DynamicLessonData;
}

/** Structured data extracted by the dynamic fallback parser. */
export interface DynamicLessonData {
  /** Inferred topic from the OCR text. */
  topic: string;
  /** Key terms (nouns, scientific terms, objects). */
  keyTerms: string[];
  /** Detected verbs / processes. */
  actions: string[];
  /** Scientific concepts inferred from text. */
  concepts: string[];
  /** Candidate scene descriptions. */
  candidateScenes: string[];
  /** Panda animation actions mapped from keywords. */
  candidatePandaActions: string[];
}

// ============================================================
// Caption types
// ============================================================

/** Caption display modes. */
export type CaptionMode = 'normal' | 'highlight' | 'question' | 'feedback';

/** Emphasis level for a caption segment. */
export type CaptionEmphasis = 'normal' | 'important';

/** A single caption segment with timing. */
export interface CaptionSegment {
  id: string;
  /** Caption text (MSA for display). */
  text: string;
  /** Start time in seconds. */
  startTime: number;
  /** End time in seconds. */
  endTime: number;
  /** Whether this segment is marked as important ([حفظ_مهم]). */
  emphasis: CaptionEmphasis;
  /** How many times this segment should be displayed (max 2 for important). */
  repeatCount: number;
  /** Display mode for styling. */
  displayMode: CaptionMode;
}

/** A processed caption segment after loop expansion. */
export interface ProcessedCaptionSegment extends CaptionSegment {
  /** Whether this is the repeated (emphasized) occurrence. */
  isRepeat: boolean;
  /** Actual start time after loop expansion. */
  scheduledStartTime: number;
  /** Actual end time after loop expansion. */
  scheduledEndTime: number;
}
