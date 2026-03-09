import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { IrabResultView } from "./IrabResultView";

interface Submission {
  id: string;
  student_name: string;
  arabic_text: string;
  sentence_type: string | null;
  status: string;
  created_at: string;
}

export function IrabReview() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [words, setWords] = useState<any[]>([]);
  const [existingComment, setExistingComment] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("irab_submissions" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setSubmissions((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const openDetail = async (sub: Submission) => {
    setSelectedSub(sub);
    setDetailLoading(true);
    const [itemsRes, assessRes] = await Promise.all([
      supabase.from("irab_analysis_items" as any).select("*").eq("submission_id", sub.id).order("sort_order"),
      supabase.from("irab_assessments" as any).select("*").eq("submission_id", sub.id).maybeSingle(),
    ]);
    setWords((itemsRes.data as any) || []);
    const existing = (assessRes.data as any)?.comment || "";
    setExistingComment(existing);
    setComment(existing);
    setDetailLoading(false);
  };

  const handleSaveReview = async () => {
    if (!selectedSub || !user) return;
    setSaving(true);

    // Upsert assessment
    const { data: existing } = await supabase
      .from("irab_assessments" as any)
      .select("id")
      .eq("submission_id", selectedSub.id)
      .maybeSingle();

    if ((existing as any)?.id) {
      await supabase.from("irab_assessments" as any).update({
        comment: comment.trim(),
        assessed_by: user.id,
      }).eq("id", (existing as any).id);
    } else {
      await supabase.from("irab_assessments" as any).insert({
        submission_id: selectedSub.id,
        comment: comment.trim(),
        assessed_by: user.id,
      });
    }

    // Update status
    await supabase
      .from("irab_submissions" as any)
      .update({ status: "reviewed" })
      .eq("id", selectedSub.id);

    toast.success("Review disimpan");
    setSaving(false);
    setSelectedSub(null);
    fetchSubmissions();
  };

  if (selectedSub) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedSub(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Button>

        {detailLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <IrabResultView
              arabicText={selectedSub.arabic_text}
              sentenceType={selectedSub.sentence_type || "Belum dianalisis"}
              words={words}
              status={selectedSub.status}
            />

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Catatan Ustadz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Berikan catatan atau koreksi..."
                  rows={4}
                />
                <Button onClick={handleSaveReview} disabled={saving} className="w-full gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Simpan Review
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Belum ada submission</p>
      ) : (
        submissions.map(sub => (
          <Card
            key={sub.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openDetail(sub)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{sub.student_name}</p>
                  <p className="font-arabic text-base text-foreground truncate mt-1" dir="rtl">
                    {sub.arabic_text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(sub.created_at).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                </div>
                <Badge variant={sub.status === "reviewed" ? "default" : sub.status === "auto_reviewed" ? "outline" : "secondary"}>
                  {sub.status === "reviewed" ? "Dinilai" : sub.status === "auto_reviewed" ? "AI" : "Menunggu"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
