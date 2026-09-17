import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LessonPage {
  id: string;
  image_url: string;
  order_index: number;
}

interface ExtractedContent {
  pages: { page_index: number; text: string; topics: string[] }[];
  key_facts: string[];
  concepts: { name: string; description: string; source_page: number }[];
}

interface SceneData {
  order_index: number;
  scene_type: "intro" | "scene" | "question" | "outro";
  on_screen_text: string;
  voice_text: string;
  visual_description: string;
  illustration_emoji: string;
  duration_seconds: number;
  concept_id: string;
  source_page_index: number | null;
}

interface QuestionData {
  order_index: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_answer: "a" | "b" | "c";
  hint: string;
  source_fact: string;
  source_page_index: number | null;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

async function extractContentFromImages(
  imageUrls: string[],
  lessonName: string
): Promise<ExtractedContent> {
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const imageContent: { type: "image_url"; image_url: { url: string } }[] = [];
  for (const url of imageUrls.slice(0, 10)) {
    imageContent.push({ type: "image_url", image_url: { url } });
  }

  const systemPrompt = `أنت خبير في تحليل كتب العلوم المدرسية العربية. تحلل صور صفحات الكتاب المدرسي وتستخرج المحتوى التعليمي بدقة.

المطلوب:
1. استخراج كل النصوص الموجودة في كل صفحة
2. تحديد المواضيع والمفاهيم العلمية
3. استخراج الحقائق العلمية المهمة
4. تحديد المفاهيم القابلة للتعليم والاختبار

أرجع النتيجة بصيغة JSON فقط بدون أي نص إضافي.`;

  const userPrompt = `حلل صور صفحات درس "${lessonName}" من كتاب العلوم المدرسي.

استخرج:
- نص كل صفحة (pages array: page_index, text, topics)
- الحقائق العلمية المهمة (key_facts array)
- المفاهيم التعليمية (concepts array: name, description, source_page)

أرجع JSON بهذا الشكل:
{
  "pages": [{"page_index": 0, "text": "النص المستخرج", "topics": ["موضوع1"]}],
  "key_facts": ["حقيقة1", "حقيقة2"],
  "concepts": [{"name": "اسم المفهوم", "description": "وصف", "source_page": 0}]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: [
          { type: "text", text: userPrompt },
          ...imageContent,
        ]},
      ],
      max_tokens: 4000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI Vision API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  let extracted: ExtractedContent;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    extracted = JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  if (!extracted.pages || !Array.isArray(extracted.pages)) {
    throw new Error("AI response missing pages array");
  }

  return extracted;
}

async function generateAdventureScript(
  extracted: ExtractedContent,
  lessonName: string
): Promise<{ scenes: SceneData[]; questions: QuestionData[] }> {
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const systemPrompt = `أنت كاتب محتوى تعليمي للأطفال. تنشئ مغامرات تعليمية مبنية على محتوى حقيقي من الكتاب المدرسي.

القواعد:
- النص الظاهر على الشاشة (on_screen_text): عربية فصحى مبسطة من الكتاب
- صوت الشخصية (voice_text): لهجة مصرية طبيعية مناسبة للأطفال
- المحتوى يجب أن يكون من الحقائق المستخرجة فقط
- لا تستخدم محتوى تخيلي أو غير موجود في المصدر
- أنشئ 5-8 مشاهد تعليمية
- أنشئ 3-5 أسئلة مبنية على الحقائق المستخرجة

أرجع JSON فقط.`;

  const userPrompt = `أنشئ مغامرة تعليمية لدرس "${lessonName}".

المحتوى المستخرج من الكتاب:
${JSON.stringify(extracted, null, 2)}

أنشئ:
1. مشهد مقدمة (scene_type: "intro")
2. 3-5 مشاهد تعليمية (scene_type: "scene") - كل مشهد يشرح مفهوم من المفاهيم المستخرجة
3. مشهد ختامي (scene_type: "outro")

لكل مشهد:
- on_screen_text: النص التعليمي بالعربية الفصحى المبسطة (من الكتاب)
- voice_text: شرح الشخصية باللهجة المصرية للأطفال
- visual_description: وصف المشهد المرئي
- illustration_emoji: رمز تعبيري مناسب
- duration_seconds: مدة المشهد (10-30)
- concept_id: معرف المفهوم
- source_page_index: رقم الصفحة المصدر

ثم أنشئ 3-5 أسئلة:
- question_text: السؤال بالعربية الفصحى المبسطة
- option_a/b/c: الاختيارات
- correct_answer: "a" أو "b" أو "c"
- hint: تلميح
- source_fact: الحقيقة المصدر
- source_page_index: رقم الصفحة

أرجع JSON:
{
  "scenes": [...],
  "questions": [...]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch {
    throw new Error("Failed to parse adventure script as JSON");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { lessonId } = await req.json();
    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: "lessonId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lesson
    const { data: lesson, error: lessonErr } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();
    if (lessonErr || !lesson) {
      return new Response(
        JSON.stringify({ error: "Lesson not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get lesson pages
    const { data: pages } = await supabase
      .from("lesson_pages")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true });

    const lessonPages = (pages ?? []) as LessonPage[];
    if (lessonPages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No lesson pages found. Please upload images first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check for existing adventure
    const { data: existingAdv } = await supabase
      .from("adventures")
      .select("*")
      .eq("lesson_id", lessonId)
      .maybeSingle();

    let adventureId: string;

    if (existingAdv) {
      adventureId = existingAdv.id;
      // Reset to generating
      await supabase
        .from("adventures")
        .update({
          status: "generating",
          error_message: "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", adventureId);

      // Delete old scenes and questions
      await supabase.from("scenes").delete().eq("adventure_id", adventureId);
      await supabase.from("questions").delete().eq("adventure_id", adventureId);
    } else {
      const { data: newAdv, error: advErr } = await supabase
        .from("adventures")
        .insert({
          lesson_id: lessonId,
          title: lesson.name,
          description: `مغامرة تعليمية عن ${lesson.name}`,
          status: "generating",
        })
        .select("*")
        .single();

      if (advErr || !newAdv) {
        return new Response(
          JSON.stringify({ error: "Failed to create adventure" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      adventureId = newAdv.id;
    }

    // Step 1: Extract content from images
    const imageUrls = lessonPages.map((p) => p.image_url);

    let extracted: ExtractedContent;
    try {
      extracted = await extractContentFromImages(imageUrls, lesson.name);
    } catch (err) {
      await supabase
        .from("adventures")
        .update({
          status: "failed",
          error_message: `فشل في قراءة محتوى الصور: ${err.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", adventureId);

      return new Response(
        JSON.stringify({
          error: "لم نتمكن من قراءة محتوى صفحات الدرس. يرجى التأكد من وضوح الصور والمحاولة مرة أخرى.",
          adventure_id: adventureId,
          status: "failed",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 2: Generate adventure script
    let script: { scenes: SceneData[]; questions: QuestionData[] };
    try {
      script = await generateAdventureScript(extracted, lesson.name);
    } catch (err) {
      await supabase
        .from("adventures")
        .update({
          status: "failed",
          error_message: `فشل في إنشاء المغامرة: ${err.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", adventureId);

      return new Response(
        JSON.stringify({
          error: "فشل في إنشاء المغامرة. يرجى المحاولة مرة أخرى.",
          adventure_id: adventureId,
          status: "failed",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 3: Save extracted content and concepts
    await supabase
      .from("adventures")
      .update({
        extracted_content: extracted,
        concepts: extracted.concepts ?? [],
      })
      .eq("id", adventureId);

    // Step 4: Insert scenes
    if (script.scenes && script.scenes.length > 0) {
      const scenesToInsert = script.scenes.map((s, i) => ({
        adventure_id: adventureId,
        order_index: i,
        scene_text: s.on_screen_text || "",
        dialogue_text: s.voice_text || "",
        illustration_emoji: s.illustration_emoji || "🌟",
        on_screen_text: s.on_screen_text || "",
        voice_text: s.voice_text || "",
        visual_description: s.visual_description || "",
        duration_seconds: s.duration_seconds || 15,
        concept_id: s.concept_id || "",
        source_page_index: s.source_page_index ?? null,
        scene_type: s.scene_type || "scene",
      }));
      await supabase.from("scenes").insert(scenesToInsert);
    }

    // Step 5: Insert questions
    if (script.questions && script.questions.length > 0) {
      const questionsToInsert = script.questions.map((q, i) => ({
        adventure_id: adventureId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        correct_answer: q.correct_answer,
        hint: q.hint || "",
        order_index: i,
        source_fact: q.source_fact || "",
        source_page_index: q.source_page_index ?? null,
      }));
      await supabase.from("questions").insert(questionsToInsert);
    }

    // Step 6: Update lesson status
    if (lesson.status === "not_started") {
      await supabase
        .from("lessons")
        .update({ status: "in_progress" })
        .eq("id", lessonId);
    }

    // Step 7: Mark adventure as ready
    await supabase
      .from("adventures")
      .update({
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", adventureId);

    return new Response(
      JSON.stringify({
        success: true,
        adventure_id: adventureId,
        status: "ready",
        scenes_count: script.scenes?.length ?? 0,
        questions_count: script.questions?.length ?? 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
