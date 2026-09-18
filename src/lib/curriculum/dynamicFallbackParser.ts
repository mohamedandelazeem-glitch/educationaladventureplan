import { normalizeArabicText, normalizeKeyword } from '../arabicTextNormalizer';
import { DYNAMIC_ANIMATION_MATRIX, DEFAULT_FALLBACK_ACTION } from './curriculumMappings';
import type { DynamicLessonData, LessonMetadata } from './types';

/**
 * Arabic stop words — common words that should not be treated as key terms.
 * Normalized form (alef/yaa/taa-marbuta already collapsed).
 */
const STOP_WORDS = new Set([
  'في', 'من', 'الى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
  'التي', 'الذي', 'الذين', 'هو', 'هي', 'هم', 'هن', 'كان', 'كانت',
  'قد', 'كل', 'بعض', 'عند', 'عندما', 'ثم', 'او', 'اما', 'ان', 'انه',
  'لا', 'ما', 'كما', 'حيث', 'لكن', 'بين', 'حول', 'نحو', 'دون',
  'به', 'بها', 'فيه', 'فيها', 'له', 'لها', 'وقد', 'وكان', 'فقد',
  'ال', 'يوم', 'بعد', 'قبل', 'خلال', 'عنه', 'عنها', 'منها', 'منه',
]);

/** Common Arabic verb prefixes to strip when extracting root-like terms. */
const VERB_PREFIXES = ['ي', 'ت', 'ن', 'ا', 'ست'];

/**
 * Extracts candidate key terms (nouns, scientific terms, objects, places)
 * from normalized Arabic text by filtering out stop words and short tokens.
 */
function extractKeyTerms(normalized: string): string[] {
  const words = normalized.split(' ').filter(Boolean);
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const word of words) {
    // Skip stop words
    if (STOP_WORDS.has(word)) continue;
    // Skip very short tokens (likely particles)
    if (word.length < 3) continue;
    // Skip words that are just the definite article "ال" + short root
    if (word.startsWith('ال') && word.length <= 4) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    terms.push(word);
  }

  return terms.slice(0, 12);
}

/**
 * Extracts verbs / processes by looking for action-related words.
 * Uses the dynamic animation matrix to detect process verbs.
 */
function extractActions(normalized: string): string[] {
  const actions: string[] = [];
  const seen = new Set<string>();

  for (const entry of DYNAMIC_ANIMATION_MATRIX) {
    const normalizedKeyword = normalizeKeyword(entry.keyword);
    if (normalized.includes(normalizedKeyword)) {
      if (!seen.has(entry.keyword)) {
        seen.add(entry.keyword);
        actions.push(entry.keyword);
      }
    }
  }

  return actions;
}

/**
 * Maps key terms and actions to panda animation actions using the dynamic
 * animation matrix. Falls back to idle if no match is found.
 */
function mapToAnimations(normalized: string): string[] {
  const actions = new Set<string>();

  for (const entry of DYNAMIC_ANIMATION_MATRIX) {
    const normalizedKeyword = normalizeKeyword(entry.keyword);
    if (normalized.includes(normalizedKeyword)) {
      actions.add(entry.action);
    }
  }

  if (actions.size === 0) {
    actions.add(DEFAULT_FALLBACK_ACTION);
  }

  return Array.from(actions);
}

/**
 * Infers a topic from the OCR text by taking the first meaningful sentence
 * and extracting the subject.
 */
function inferTopic(normalized: string): string {
  const sentences = normalized.split(/[.,،؛!؟?]/).filter((s) => s.trim().length > 5);
  if (sentences.length === 0) return 'درس عام';
  const firstSentence = sentences[0].trim();
  // Take first 5 words as topic hint
  const words = firstSentence.split(' ').slice(0, 5).join(' ');
  return words;
}

/**
 * Generates candidate scene descriptions from the dynamic lesson data.
 * Each scene is a short child-friendly description grounded in OCR terms.
 */
function generateCandidateScenes(
  keyTerms: string[],
  animations: string[],
  topic: string,
): string[] {
  const scenes: string[] = [];

  // Scene 1: Introduction
  scenes.push(`الباندا يرحب بكم ويقول: هنعرف النهارده عن ${topic}`);

  // Scene 2: Explore key terms
  if (keyTerms.length > 0) {
    const topTerms = keyTerms.slice(0, 3).join(' و');
    scenes.push(`الباندا يكتشف كلمات مهمة: ${topTerms}`);
  }

  // Scene 3: Animation-based scene
  if (animations.length > 0 && animations[0] !== DEFAULT_FALLBACK_ACTION) {
    scenes.push(`الباندا يتحرك ويتفاعل مع الدرس بحماس`);
  }

  // Scene 4: Closing
  scenes.push(`الباندا يلخص الدرس ويشكركم على المذاكرة`);

  return scenes;
}

/**
 * Generates a short child-friendly script in Egyptian Arabic
 * grounded in the OCR-derived concepts.
 */
function generateDynamicScript(topic: string, keyTerms: string[]): string {
  const terms = keyTerms.slice(0, 3).join(' و');
  return `يا هلا بكم! النهارده هنتعلم عن ${topic}. خلينا نعرف كلمات مهمة زي: ${terms}. اهو الباندا بيقولكم: ذاكروا كويس وهتنجحوا!`;
}

/**
 * Parses non-curriculum OCR text into structured lesson data.
 *
 * Extracts:
 * - topic (inferred from first meaningful sentence)
 * - key terms (filtered nouns, scientific terms, objects, places)
 * - actions (detected verbs / processes)
 * - concepts (inferred from key terms)
 * - candidate scenes (child-friendly scene descriptions)
 * - candidate panda actions (mapped from dynamic animation matrix)
 */
export function parseDynamicLesson(
  ocrText: string,
  metadata?: LessonMetadata,
): DynamicLessonData {
  const { normalized } = normalizeArabicText(ocrText);

  if (!normalized) {
    return {
      topic: metadata?.lessonTitle ?? 'درس عام',
      keyTerms: [],
      actions: [],
      concepts: [],
      candidateScenes: ['الباندا يرحب بكم'],
      candidatePandaActions: [DEFAULT_FALLBACK_ACTION],
    };
  }

  const keyTerms = extractKeyTerms(normalized);
  const actions = extractActions(normalized);
  const animations = mapToAnimations(normalized);
  const topic = inferTopic(normalized);

  const concepts = keyTerms.slice(0, 5).map((term) => `مصطلح: ${term}`);

  const candidateScenes = generateCandidateScenes(keyTerms, animations, topic);

  // Include the generated script in the first scene
  const script = generateDynamicScript(topic, keyTerms);
  candidateScenes[0] = script;

  return {
    topic,
    keyTerms,
    actions,
    concepts,
    candidateScenes,
    candidatePandaActions: animations,
  };
}
