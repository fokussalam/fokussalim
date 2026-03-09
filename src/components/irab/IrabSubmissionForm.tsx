import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { IrabResultView } from "./IrabResultView";

interface Props {
  onSubmitted: () => void;
}

interface AnalysisResult {
  sentence_type: string;
  words: {
    word: string;
    word_type: string;
    irab_position: string;
    irab_sign: string;
    explanation: string;
  }[];
  comment?: string;
}

export function IrabSubmissionForm({ onSubmitted }: Props) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [studentName, setStudentName] = useState("");
  const [arabicText, setArabicText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (profile?.full_name) setStudentName(profile.full_name);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !arabicText.trim()) {
      toast.error("Lengkapi nama dan teks Arab");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      // Insert submission
      const { data: insertedData, error } = await supabase
        .from("irab_submissions" as any)
        .insert({
          user_id: user?.id || null,
          student_name: studentName.trim(),
          arabic_text: arabicText.trim(),
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;

      const submissionId = (insertedData as any).id;
      toast.success("Teks dikirim! Menganalisis i'rab...");

      // Call AI analysis and wait for result
      const { data: aiData, error: aiError } = await supabase.functions.invoke("irab-analyze", {
        body: {
          submission_id: submissionId,
          arabic_text: arabicText.trim(),
        },
      });

      if (aiError) {
        console.error("AI analysis error:", aiError);
        toast.error("Analisis AI gagal. Ustadz akan menganalisis manual.");
      } else if (aiData?.analysis) {
        const analysis = aiData.analysis;
        setResult({
          sentence_type: analysis.sentence_type,
          words: analysis.words || [],
          comment: `Struktur kalimat: ${analysis.sentence_type}. Ditemukan ${analysis.words?.length || 0} kata.`,
        });
        toast.success("Analisis i'rab selesai!");
      }

      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim teks");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setArabicText("");
  };

  if (result) {
    return (
      <div className="space-y-4">
        <IrabResultView
          arabicText={arabicText}
          sentenceType={result.sentence_type}
          words={result.words}
          comment={result.comment}
          status="auto_reviewed"
        />
        <Button onClick={handleReset} variant="outline" className="w-full gap-2">
          <RotateCcw className="w-4 h-4" /> Analisis Teks Baru
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Analisis I'rab</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama</Label>
            <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nama lengkap" required />
          </div>

          <div className="space-y-2">
            <Label>Teks Arab</Label>
            <Textarea
              value={arabicText}
              onChange={e => setArabicText(e.target.value)}
              placeholder="أدخل النص العربي هنا..."
              className="font-arabic text-xl text-right leading-loose min-h-[100px]"
              dir="rtl"
              required
            />
            <p className="text-xs text-muted-foreground">
              Masukkan kalimat atau ayat Arab yang ingin dianalisis i'rabnya
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {loading ? "Menganalisis..." : "Analisis I'rab"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
