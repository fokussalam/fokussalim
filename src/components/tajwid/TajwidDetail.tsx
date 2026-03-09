import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { surahList } from "@/data/surahList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Volume2, Loader2 } from "lucide-react";

interface Submission {
  id: string;
  santri_name: string;
  surah_number: number;
  ayat_number: number;
  ayat_text: string | null;
  audio_url: string | null;
  status: string;
  created_at: string;
}

interface AnalysisItem {
  id: string;
  word: string;
  hukum_tajwid: string;
  catatan: string | null;
  sort_order: number;
}

interface Assessment {
  id: string;
  makhraj_score: number;
  tajwid_score: number;
  kelancaran_score: number;
  comment: string | null;
}

interface Props {
  submission: Submission;
  onBack: () => void;
}

export function TajwidDetail({ submission, onBack }: Props) {
  const [analysisItems, setAnalysisItems] = useState<AnalysisItem[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const surah = surahList.find(s => s.number === submission.surah_number);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [analysisRes, assessmentRes] = await Promise.all([
        supabase.from("tajwid_analysis_items" as any).select("*").eq("submission_id", submission.id).order("sort_order"),
        supabase.from("tajwid_assessments" as any).select("*").eq("submission_id", submission.id).maybeSingle(),
      ]);
      setAnalysisItems((analysisRes.data as any) || []);
      setAssessment((assessmentRes.data as any) || null);
      setLoading(false);
    };
    fetchData();
  }, [submission.id]);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Button>

      {/* Ayat Display */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>QS. {surah?.name}: {submission.ayat_number}</span>
            <Badge variant={submission.status === "reviewed" ? "default" : submission.status === "auto_reviewed" ? "outline" : "secondary"}>
              {submission.status === "reviewed" ? "Dinilai Ustadz" : submission.status === "auto_reviewed" ? "Dinilai oleh Adin, M.Pd" : "Menunggu"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submission.ayat_text && (
            <p className="text-2xl font-arabic leading-loose text-foreground text-center mb-4" dir="rtl">
              {submission.ayat_text}
            </p>
          )}
          {submission.audio_url && (
            <audio controls className="w-full" src={submission.audio_url}>
              Browser tidak mendukung audio.
            </audio>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Analysis Table */}
          {analysisItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Analisis Tajwid</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kata</TableHead>
                      <TableHead>Hukum Tajwid</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-arabic text-lg" dir="rtl">{item.word}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.hukum_tajwid}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.catatan || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Assessment */}
          {assessment ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  Penilaian
                  {submission.status === "auto_reviewed" && (
                    <Badge variant="outline" className="text-xs font-normal">Otomatis AI</Badge>
                  )}
                  {submission.status === "reviewed" && (
                    <Badge variant="default" className="text-xs font-normal">Ustadz</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { label: "Makhraj", score: assessment.makhraj_score },
                    { label: "Tajwid", score: assessment.tajwid_score },
                    { label: "Kelancaran", score: assessment.kelancaran_score },
                  ].map(({ label, score }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{label}</span>
                        <span className={`font-bold ${scoreColor(score)}`}>{score}/100</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                </div>
                {assessment.comment && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Komentar Ustadz:</p>
                    <p className="text-sm text-muted-foreground">{assessment.comment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            submission.status === "pending" && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Bacaan belum dinilai. Harap tunggu ustadz mereview bacaan Anda.
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
