import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { submission_id, surah_number, ayat_number, ayat_text } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const systemPrompt = `Kamu adalah seorang ahli tajwid Al-Quran. Tugasmu menganalisis ayat Al-Quran dan mengidentifikasi hukum-hukum tajwid yang ada.

Untuk setiap ayat yang diberikan, kamu harus:
1. Memecah ayat menjadi kata/bagian yang mengandung hukum tajwid
2. Mengidentifikasi hukum tajwid pada setiap kata/bagian
3. Memberikan catatan penjelasan singkat
4. Memberikan penilaian awal untuk makhraj, tajwid, dan kelancaran (0-100)

Hukum tajwid yang umum: Idzhar, Idgham Bighunnah, Idgham Bilaghunnah, Iqlab, Ikhfa, Qalqalah, Mad Thabi'i, Mad Wajib Muttashil, Mad Jaiz Munfashil, Mad Lazim, Ghunnah, Tafkhim, Tarqiq, Idgham Mimi, Ikhfa Syafawi, Idzhar Syafawi, dll.`;

    const userPrompt = `Analisis hukum tajwid pada ayat berikut:
Surah: ${surah_number}, Ayat: ${ayat_number}
Teks Ayat: ${ayat_text}

Berikan analisis tajwid yang detail.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "tajwid_analysis",
              description: "Hasil analisis tajwid dari ayat Al-Quran",
              parameters: {
                type: "object",
                properties: {
                  analysis_items: {
                    type: "array",
                    description: "Daftar kata/bagian yang mengandung hukum tajwid",
                    items: {
                      type: "object",
                      properties: {
                        word: { type: "string", description: "Kata atau bagian ayat dalam huruf Arab" },
                        hukum_tajwid: { type: "string", description: "Nama hukum tajwid yang berlaku" },
                        catatan: { type: "string", description: "Penjelasan singkat mengapa hukum ini berlaku" },
                      },
                      required: ["word", "hukum_tajwid", "catatan"],
                      additionalProperties: false,
                    },
                  },
                  makhraj_score: { type: "number", description: "Skor makhraj 0-100 berdasarkan tingkat kesulitan ayat" },
                  tajwid_score: { type: "number", description: "Skor tajwid 0-100" },
                  kelancaran_score: { type: "number", description: "Skor kelancaran 0-100" },
                  comment: { type: "string", description: "Komentar dan saran umum untuk pembacaan ayat ini" },
                },
                required: ["analysis_items", "makhraj_score", "tajwid_score", "kelancaran_score", "comment"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "tajwid_analysis" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Terlalu banyak permintaan, coba lagi nanti." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error: " + response.status);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);

    // Insert analysis items
    if (result.analysis_items && result.analysis_items.length > 0) {
      const rows = result.analysis_items.map((item: any, i: number) => ({
        submission_id,
        word: item.word,
        hukum_tajwid: item.hukum_tajwid,
        catatan: item.catatan || null,
        sort_order: i,
      }));
      await supabase.from("tajwid_analysis_items").insert(rows);
    }

    // Insert AI assessment
    await supabase.from("tajwid_assessments").insert({
      submission_id,
      makhraj_score: Math.min(100, Math.max(0, result.makhraj_score || 70)),
      tajwid_score: Math.min(100, Math.max(0, result.tajwid_score || 70)),
      kelancaran_score: Math.min(100, Math.max(0, result.kelancaran_score || 70)),
      comment: result.comment || "Analisis otomatis oleh AI. Ustadz dapat mengoreksi penilaian ini.",
      assessed_by: null,
    });

    // Update submission status
    await supabase.from("tajwid_submissions").update({ status: "auto_reviewed" }).eq("id", submission_id);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tajwid-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
