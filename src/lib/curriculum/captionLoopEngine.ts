import type {
  CaptionSegment,
  ProcessedCaptionSegment,
} from './types';

/**
 * IMPORTANT marker — segments containing this tag are repeated twice.
 * The tag is stripped from the displayed text.
 */
const IMPORTANT_MARKER = '[حفظ_مهم]';

/** Font size multiplier for the repeated (emphasized) occurrence. */
const REPEAT_FONT_SCALE = 1.25;

/** Default duration per caption segment in seconds. */
const DEFAULT_SEGMENT_DURATION = 4;

/** Extra duration added for important segments (they contain more content). */
const IMPORTANT_EXTRA_DURATION = 2;

/**
 * Detects whether a caption text contains the important marker.
 * Returns the cleaned text (marker removed) and whether it was found.
 */
export function detectImportantMarker(text: string): {
  cleanedText: string;
  isImportant: boolean;
} {
  if (text.includes(IMPORTANT_MARKER)) {
    return {
      cleanedText: text.replace(IMPORTANT_MARKER, '').trim(),
      isImportant: true,
    };
  }
  return { cleanedText: text, isImportant: false };
}

/**
 * Estimates a reasonable duration for a caption segment based on text length.
 * Arabic text at ~2 words/second for children's pace.
 */
function estimateDuration(text: string, isImportant: boolean): number {
  const wordCount = text.split(' ').filter(Boolean).length;
  const baseDuration = Math.max(wordCount / 2, DEFAULT_SEGMENT_DURATION);
  return isImportant ? baseDuration + IMPORTANT_EXTRA_DURATION : baseDuration;
}

/**
 * Parses raw caption text strings into typed CaptionSegment objects.
 *
 * Each string may optionally contain [حفظ_مهم] to mark it as important.
 * Timing is assigned sequentially based on estimated reading duration.
 *
 * This function does NOT expand repeats — it only creates the base segments.
 */
export function createCaptionSegments(
  texts: string[],
  options?: { startOffset?: number; defaultDuration?: number },
): CaptionSegment[] {
  let currentTime = options?.startOffset ?? 0;
  const defaultDuration = options?.defaultDuration ?? DEFAULT_SEGMENT_DURATION;

  return texts.map((text, index) => {
    const { cleanedText, isImportant } = detectImportantMarker(text);
    const duration = isImportant
      ? estimateDuration(cleanedText, true)
      : defaultDuration;

    const segment: CaptionSegment = {
      id: `caption-${index}`,
      text: cleanedText,
      startTime: currentTime,
      endTime: currentTime + duration,
      emphasis: isImportant ? 'important' : 'normal',
      repeatCount: isImportant ? 2 : 1,
      displayMode: 'normal',
    };

    currentTime += duration;
    return segment;
  });
}

/**
 * Expands caption segments into processed segments, duplicating any
 * segment with repeatCount > 1.
 *
 * For important segments (repeatCount === 2):
 * - First occurrence plays normally.
 * - Second occurrence plays immediately after, with:
 *   - isRepeat = true (for emphasis styling)
 *   - 25% larger font (signaled via isRepeat flag)
 *   - bright yellow emphasis (applied by the renderer)
 *   - pulse animation (applied by the renderer)
 *
 * The original segment data is NOT mutated — new ProcessedCaptionSegment
 * objects are created with scheduled times.
 */
export function expandCaptionLoop(
  segments: CaptionSegment[],
): ProcessedCaptionSegment[] {
  const processed: ProcessedCaptionSegment[] = [];
  let scheduledTime = 0;

  for (const segment of segments) {
    const duration = segment.endTime - segment.startTime;

    // First occurrence
    processed.push({
      ...segment,
      isRepeat: false,
      scheduledStartTime: scheduledTime,
      scheduledEndTime: scheduledTime + duration,
    });
    scheduledTime += duration;

    // Repeat occurrence (only for important segments)
    if (segment.repeatCount > 1) {
      processed.push({
        ...segment,
        id: `${segment.id}-repeat`,
        isRepeat: true,
        scheduledStartTime: scheduledTime,
        scheduledEndTime: scheduledTime + duration,
        displayMode: 'highlight',
      });
      scheduledTime += duration;
    }
  }

  return processed;
}

/**
 * Returns the CSS font size multiplier for a processed segment.
 * Repeated (important) segments get a 25% increase.
 */
export function getFontScale(segment: ProcessedCaptionSegment): number {
  return segment.isRepeat ? REPEAT_FONT_SCALE : 1;
}

/**
 * Returns the recommended text color for a processed segment.
 * Repeated (important) segments use bright yellow emphasis.
 */
export function getCaptionColor(segment: ProcessedCaptionSegment): string {
  if (segment.isRepeat) return '#FBBF24'; // bright yellow
  if (segment.displayMode === 'question') return '#3B82F6'; // blue
  if (segment.displayMode === 'feedback') return '#22C55E'; // green
  return '#1F2937'; // default dark
}

/**
 * Returns whether a pulse animation should be applied to the segment.
 */
export function shouldPulse(segment: ProcessedCaptionSegment): boolean {
  return segment.isRepeat;
}

/**
 * Returns whether applause should be triggered after this segment.
 * Only for the repeated (second) occurrence of important segments.
 */
export function shouldTriggerApplause(segment: ProcessedCaptionSegment): boolean {
  return segment.isRepeat;
}

/**
 * Full pipeline: raw text strings → processed caption segments with
 * double-caption looping applied.
 */
export function buildCaptionLoop(
  texts: string[],
  options?: { startOffset?: number; defaultDuration?: number },
): ProcessedCaptionSegment[] {
  const segments = createCaptionSegments(texts, options);
  return expandCaptionLoop(segments);
}

/**
 * Gets the total duration of all processed caption segments.
 */
export function getTotalDuration(segments: ProcessedCaptionSegment[]): number {
  if (segments.length === 0) return 0;
  const last = segments[segments.length - 1];
  return last.scheduledEndTime;
}

export { REPEAT_FONT_SCALE, IMPORTANT_MARKER };
