import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { IrabResultView } from "./IrabResultView";

interface Submission {
  id: string;
  student_name: string;
  arabic_text: string;
  sentence_type: string | null;
  status: string;
  created_at: string;
}

interface Props {
  submission: Submission;
  onBack: () => void;
}

export function IrabDetail({ submission, onBack }: Props) {
  const [words, setWords] = useState<any[]>([]);
  const [comment, setComment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [itemsRes, assessmentRes] = await Promise.all([
        supabase.from("irab_analysis_items" as any).select("*").eq("submission_id", submission.id).order("sort_order"),
        supabase.from("irab_assessments" as any).select("*").eq("submission_id", submission.id).maybeSingle(),
      ]);
      setWords((itemsRes.data as any) || []);
      setComment((assessmentRes.data as any)?.comment || null);
      setLoading(false);
    };
    fetchData();
  }, [submission.id]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Button>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <IrabResultView
          arabicText={submission.arabic_text}
          sentenceType={submission.sentence_type || "Belum dianalisis"}
          words={words}
          comment={comment}
          status={submission.status}
        />
      )}
    </div>
  );
}
