import type { CurriculumRoute } from './types';

/**
 * Static curriculum mapping for the Egyptian Science curriculum.
 *
 * Each route defines:
 * - keywords with weights (distinctive terms weight higher than generic ones)
 * - a confidence threshold
 * - concepts, animation actions, voice direction, caption text
 *
 * Page numbers reference the source textbook.
 */

export const CURRICULUM_ROUTES: CurriculumRoute[] = [
  // ================================================================
  // PAGE 9 — Properties of Living Things
  // ================================================================
  {
    id: 'living_things_properties',
    title: 'خصائص الكائنات الحية',
    pages: [9],
    keywords: [
      { word: 'تنفس', weight: 3 },
      { word: 'تغذية', weight: 3 },
      { word: 'نمو', weight: 2 },
      { word: 'كائنات حية', weight: 2 },
    ],
    threshold: 4,
    concepts: ['الكائنات الحية تتنفس', 'الكائنات الحية تتغذى', 'الكائنات الحية تنمو'],
    animationActions: ['breathing', 'eating'],
    voiceDirection: 'صوت مرح وصديق — شرح أن الكائنات الحية تتنفس وتاكل وتنمو',
    captionText: 'الكائنات الحية تتنفس وتتغذى وتنمو',
    sceneIntention: 'الباندا يتنفس بعمق ثم ياكل جزرة ثم يكبر قليلا ليعرض خصائص الكائنات الحية',
  },

  // ================================================================
  // PAGE 10 — Habitats
  // ================================================================
  {
    id: 'habitats',
    title: 'الموائل',
    pages: [10],
    keywords: [
      { word: 'موطن', weight: 3 },
      { word: 'جحور', weight: 3 },
      { word: 'ظل الصخور', weight: 3 },
      { word: 'ضل الصخور', weight: 3 },
      { word: 'ظل', weight: 1 },
    ],
    threshold: 4,
    concepts: ['لكل كائن موطن يناسبه', 'بعض الحيوانات تعيش في الجحور', 'بعض الحيوانات تختبئ في ظل الصخور'],
    animationActions: ['shadow_hiding'],
    voiceDirection: 'صوت متاثر بالحر — الباندا يركض لظل الصخور ويمسح عرقه',
    captionText: 'بعض الحيوانات تختبئ في ظل الصخور لتقي نفسها من الحر',
    sceneIntention: 'الباندا يحس بالحر ويركض ليختبئ تحت صخرة كبيرة ويمسح جبينه بارتياح',
  },

  // ================================================================
  // PAGE 11 — How We Observe
  // ================================================================
  {
    id: 'observation_lens',
    title: 'كيف نلاحظ الأشياء',
    pages: [11],
    keywords: [
      { word: 'عدسة مكبرة', weight: 4 },
      { word: 'عدسه مكبره', weight: 4 },
      { word: 'نلاحظ', weight: 2 },
      { word: 'ملاحظة', weight: 2 },
    ],
    threshold: 4,
    concepts: ['نستخدم العدسة المكبرة لنرى التفاصيل الدقيقة', 'الملاحظة اداة من ادوات العالم'],
    animationActions: ['lens_inspecting'],
    voiceDirection: 'صوت فضولي ومتحمس — الباندا يرفع العدسة المكبرة ويتامل',
    captionText: 'نستخدم العدسة المكبرة لملاحظة التفاصيل الصغيرة',
    sceneIntention: 'الباندا يحمل عدسة مكبرة ويقربها من عينه ويتطلع بفضول',
  },

  // ================================================================
  // PAGE 12 — Observation Card
  // ================================================================
  {
    id: 'observation_card',
    title: 'بطاقة الملاحظة',
    pages: [12],
    keywords: [
      { word: 'ورقة الشجر', weight: 3 },
      { word: 'ورقه الشجر', weight: 3 },
      { word: 'بيضاوية', weight: 3 },
      { word: 'مسننة', weight: 3 },
      { word: 'ورقة', weight: 1 },
      { word: 'شجر', weight: 1 },
    ],
    threshold: 4,
    concepts: ['نصف شكل الورقة على بطاقة الملاحظة', 'الاوراق قد تكون بيضاوية او مسننة'],
    animationActions: ['note_writing'],
    voiceDirection: 'صوت جدي ومنظم — الباندا يرتدي نظارات ويدون ملاحظاته على الورقة',
    captionText: 'نصف صفات الورقة في بطاقة الملاحظة',
    sceneIntention: 'الباندا يرتدي نظارات قراءة ويمسك ورقة شجر ويدون ملاحظاته في دفتر',
  },

  // ================================================================
  // PAGE 13 / 20 — Dung Beetle / Stars
  // ================================================================
  {
    id: 'beetle_stars',
    title: 'الخنفساء والنجوم',
    pages: [13, 20],
    keywords: [
      { word: 'خنفساء', weight: 4 },
      { word: 'الجعران', weight: 4 },
      { word: 'تدحرج', weight: 3 },
      { word: 'النجوم', weight: 4 },
      { word: 'نجم', weight: 3 },
      { word: 'البوصلة', weight: 4 },
      { word: 'اتجاه', weight: 2 },
      { word: 'الملاحة', weight: 4 },
    ],
    threshold: 4,
    concepts: ['الخنفساء تدحرج الكرة', 'النجوم تساعد في تحديد الاتجاه', 'البوصلة اداة ملاحة'],
    animationActions: ['upside_down'],
    voiceDirection: 'صوت مبهوم — الباندا ينقلب راسا على عقب مثل الكرة المتدحرجة',
    captionText: 'الخنفساء تدحرج الكرة والنجوم تدلنا على الاتجاه',
    sceneIntention: 'الباندا ينقلب راسا على عقب ويتدحرج بانبهام ثم يعود لوضعه الطبيعي',
  },

  // ================================================================
  // PAGE 14–15 — Classification
  // ================================================================
  {
    id: 'classification',
    title: 'تصنيف الكائنات الحية',
    pages: [14, 15],
    keywords: [
      { word: 'أرجل', weight: 3 },
      { word: 'ارجل', weight: 3 },
      { word: 'بدون أرجل', weight: 4 },
      { word: 'بدون ارجل', weight: 4 },
      { word: 'تصنيف', weight: 4 },
      { word: 'تصنف', weight: 3 },
    ],
    threshold: 4,
    concepts: ['نصنف الحيوانات حسب عدد الارجل', 'بعض الحيوانات بدون ارجل'],
    animationActions: ['animal_sorting'],
    voiceDirection: 'صوت معلم مرح — الباندا يصنف الحيوانات ويوازن على رجل واحدة',
    captionText: 'نصنف الكائنات الحية حسب صفاتها مثل عدد الارجل',
    sceneIntention: 'الباندا يوازن على رجل واحدة ثم ينحني ويزحف وبطاقات التصنيف تترتب فوقه',
  },

  // ================================================================
  // PAGE 16 — Different Places (Nile / Desert / Frog)
  // ================================================================
  {
    id: 'different_places',
    title: 'اماكن مختلفة',
    pages: [16],
    keywords: [
      { word: 'نهر النيل', weight: 4 },
      { word: 'الصحراء', weight: 3 },
      { word: 'الضفدع', weight: 4 },
      { word: 'نهر', weight: 1 },
      { word: 'ماء', weight: 1 },
    ],
    threshold: 4,
    concepts: ['البيئات مختلفة: نهر النيل والصحراء', 'الضفدع يعيش قرب الماء'],
    animationActions: ['deep_drilling'],
    voiceDirection: 'صوت متغير — سعيد قرب الماء ثم عطشان في الصحراء',
    captionText: 'تعيش الكائنات في اماكن مختلفة تناسبها',
    sceneIntention: 'الباندا يلعب بالماء بسعادة ثم ينتقل للصحراء ويشعر بالعطش ويبحث عن الماء',
  },

  // ================================================================
  // PAGE 17 / 19 — Adaptation / Acacia / Fennec / Jerboa
  // ================================================================
  {
    id: 'adaptation',
    title: 'التكيف في البيئات',
    pages: [17, 19],
    keywords: [
      { word: 'تكيف', weight: 4 },
      { word: 'السنط', weight: 4 },
      { word: 'الفنك', weight: 4 },
      { word: 'اليربوع', weight: 4 },
      { word: 'تكيفات', weight: 3 },
    ],
    threshold: 4,
    concepts: ['الكائنات تتكيف مع بيئتها', 'الفنك له اذنان كبيرتان', 'اليربوع يقفز عاليا'],
    animationActions: ['deep_drilling', 'big_ears_fanning'],
    voiceDirection: 'صوت مدهوش — الباندا يكتشف تكيفات الحيوانات في الصحراء',
    captionText: 'الكائنات الحية تتكيف مع بيئتها مثل الفنك واليربوع',
    sceneIntention: 'الباندا يبحث عن الماء ثم تظهر له اذنان كبيرتان يرفرف بهما بدهشة',
  },

  // ================================================================
  // PAGE 21 — Plant Habitats
  // ================================================================
  {
    id: 'plant_habitats',
    title: 'موائل النباتات',
    pages: [21],
    keywords: [
      { word: 'لوتس', weight: 4 },
      { word: 'بردي', weight: 4 },
      { word: 'حنظل', weight: 4 },
      { word: 'تمر', weight: 3 },
      { word: 'تمر', weight: 3 },
      { word: 'نخيل', weight: 2 },
    ],
    threshold: 4,
    concepts: ['النباتات تعيش في اماكن مختلفة', 'اللوتس ينمو في الماء', 'النخيل يعطي التمر'],
    animationActions: ['plant_foraging'],
    voiceDirection: 'صوت هادئ وسعيد — الباندا يجمع الثمار ويشم زهرة اللوتس',
    captionText: 'تعيش النباتات في موائل مختلفة مثل اللوتس والنخيل',
    sceneIntention: 'الباندا يحمل سلة فاكهة ويقطف تمرا من النخيل ثم ينحني لشم زهرة اللوتس',
  },
];

/**
 * Dynamic animation keyword → action mapping.
 * Used by the fallback parser to suggest panda actions for non-curriculum text.
 */
export const DYNAMIC_ANIMATION_MATRIX: { keyword: string; action: string }[] = [
  { keyword: 'سفر', action: 'idle' },
  { keyword: 'سافر', action: 'idle' },
  { keyword: 'رحلة', action: 'idle' },
  { keyword: 'سماء', action: 'idle' },
  { keyword: 'جري', action: 'idle' },
  { keyword: 'يجري', action: 'idle' },
  { keyword: 'ماء', action: 'deep_drilling' },
  { keyword: 'مياه', action: 'deep_drilling' },
  { keyword: 'بحر', action: 'deep_drilling' },
  { keyword: 'نهر', action: 'deep_drilling' },
  { keyword: 'أكل', action: 'eating' },
  { keyword: 'اكل', action: 'eating' },
  { keyword: 'طعام', action: 'eating' },
  { keyword: 'كتب', action: 'note_writing' },
  { keyword: 'يكتب', action: 'note_writing' },
  { keyword: 'ورقة', action: 'note_writing' },
  { keyword: 'ورقه', action: 'note_writing' },
  { keyword: 'ينظر', action: 'lens_inspecting' },
  { keyword: 'نلاحظ', action: 'lens_inspecting' },
  { keyword: 'ملاحظة', action: 'lens_inspecting' },
  { keyword: 'يفكر', action: 'idle' },
  { keyword: 'نبات', action: 'plant_foraging' },
  { keyword: 'نخيل', action: 'plant_foraging' },
  { keyword: 'زهرة', action: 'plant_foraging' },
  { keyword: 'زهره', action: 'plant_foraging' },
  { keyword: 'شمس', action: 'shadow_hiding' },
  { keyword: 'حر', action: 'shadow_hiding' },
  { keyword: 'صحراء', action: 'shadow_hiding' },
  { keyword: 'خنفساء', action: 'upside_down' },
  { keyword: 'تدحرج', action: 'upside_down' },
  { keyword: 'تصنيف', action: 'animal_sorting' },
  { keyword: 'تصنف', action: 'animal_sorting' },
  { keyword: 'تكيف', action: 'big_ears_fanning' },
  { keyword: 'اذن', action: 'big_ears_fanning' },
  { keyword: 'اذنان', action: 'big_ears_fanning' },
];

/** Default fallback action when no dynamic mapping matches. */
export const DEFAULT_FALLBACK_ACTION = 'idle';
