import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submission_id, arabic_text } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Kamu adalah ahli Nahwu dan Sharaf bahasa Arab. Analisis teks Arab berikut secara detail.

Teks: "${arabic_text}"

Berikan analisis dalam format JSON STRICT berikut (tanpa markdown, tanpa backtick):
{
  "sentence_type": "Jumlah Ismiyah" atau "Jumlah Fi'liyah" atau "Syibhul Jumlah" atau "Campuran",
  "words": [
    {
      "word": "kata arab",
      "word_type": "Isim" atau "Fi'il" atau "Harf",
      "irab_position": "Mubtada'" atau "Khabar" atau "Fa'il" atau "Maf'ul Bih" atau "Majrur" atau "Hal" atau "Tamyiz" atau "Mudaf" atau "Mudaf Ilaih" atau "Na'at" atau "Man'ut" atau "Athaf" atau "Badal" atau "Jar Majrur" atau lainnya,
      "irab_sign": "Dhammah" atau "Fathah" atau "Kasrah" atau "Sukun" atau "Tanwin Dhammah" atau "Tanwin Fathah" atau "Tanwin Kasrah" atau "Waw" atau "Alif" atau "Ya'" atau "Mabni" atau lainnya,
      "explanation": "penjelasan singkat kedudukan dan alasan tanda i'rab"
    }
  ]
}

PENTING: Hanya output JSON murni. Tidak ada teks lain.`;

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI API error: ${errText}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Clean markdown formatting
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const analysis = JSON.parse(content);

    // Update sentence_type on submission
    await supabase
      .from("irab_submissions")
      .update({ sentence_type: analysis.sentence_type, status: "auto_reviewed" })
      .eq("id", submission_id);

    // Insert analysis items
    if (analysis.words && analysis.words.length > 0) {
      const items = analysis.words.map((w: any, i: number) => ({
        submission_id,
        word: w.word,
        word_type: w.word_type,
        irab_position: w.irab_position,
        irab_sign: w.irab_sign,
        explanation: w.explanation || null,
        sort_order: i,
      }));

      await supabase.from("irab_analysis_items").insert(items);
    }

    // Insert auto assessment
    await supabase.from("irab_assessments").insert({
      submission_id,
      assessed_by: null,
      comment: `Analisis otomatis: Struktur kalimat teridentifikasi sebagai ${analysis.sentence_type}. Ditemukan ${analysis.words?.length || 0} kata.`,
    });

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("irab-analyze error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
