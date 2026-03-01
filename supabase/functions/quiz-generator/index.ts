import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, difficulty, questionCount } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Kamu adalah "Kuis Salim", pembuat kuis keislaman yang merujuk pada kitab-kitab Ulama Salaf (seperti Riyadhus Shalihin, Bulughul Maram, Fathul Bari, Tafsir Ibnu Katsir, Aqidah Wasithiyyah, Al-Ushul Ats-Tsalatsah, Fiqhus Sunnah, dll). Buatkan ${questionCount || 5} soal kuis tentang "${topic || 'pengetahuan islam dasar'}" dengan tingkat kesulitan ${difficulty || 'sedang'}.

Format respons HARUS dalam JSON valid dengan struktur berikut:
{
  "questions": [
    {
      "id": 1,
      "question": "Pertanyaan di sini",
      "options": ["A. Pilihan 1", "B. Pilihan 2", "C. Pilihan 3", "D. Pilihan 4"],
      "correctAnswer": 0,
      "explanation": "Penjelasan singkat beserta referensi kitab/hadits/dalil"
    }
  ]
}

Pastikan:
- Semua pertanyaan dalam bahasa Indonesia
- Setiap soal memiliki 4 pilihan jawaban
- correctAnswer adalah index dari jawaban benar (0-3)
- Penjelasan WAJIB menyertakan referensi dari kitab Ulama Salaf, hadits shahih, atau dalil Al-Quran
- Topik mencakup: Aqidah, Fiqih, Sejarah Islam, Tafsir, Hadits, Akhlak, Sirah Nabawiyah
- Jawaban sesuai pemahaman Ahlus Sunnah wal Jamaah berdasarkan manhaj Salaf`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Buatkan kuis Salim tentang: ${topic || 'pengetahuan islam dasar'}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Terlalu banyak permintaan, coba lagi nanti." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis, silakan hubungi admin." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Gagal menghasilkan kuis" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let quizData;
    try {
      quizData = JSON.parse(content);
    } catch {
      console.error("Failed to parse quiz JSON:", content);
      return new Response(JSON.stringify({ error: "Format kuis tidak valid" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(quizData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Quiz generator error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
