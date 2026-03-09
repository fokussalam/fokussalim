import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { surahList } from "@/data/surahList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Plus, Trash2, Save, Loader2, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

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

interface AnalysisRow {
  id?: string;
  word: string;
  hukum_tajwid: string;
  catatan: string;
}

export function TajwidReview() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Analysis items
  const [analysisRows, setAnalysisRows] = useState<AnalysisRow[]>([]);

  // Assessment scores
  const [makhrajScore, setMakhrajScore] = useState(70);
  const [tajwidScore, setTajwidScore] = useState(70);
  const [kelancaranScore, setKelancaranScore] = useState(70);
  const [comment, setComment] = useState("");

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tajwid_submissions" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setSubmissions((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const loadExistingData = async (submissionId: string) => {
    const [analysisRes, assessmentRes] = await Promise.all([
      supabase.from("tajwid_analysis_items" as any).select("*").eq("submission_id", submissionId).order("sort_order"),
      supabase.from("tajwid_assessments" as any).select("*").eq("submission_id", submissionId).maybeSingle(),
    ]);

    const items = (analysisRes.data as any) || [];
    setAnalysisRows(items.map((i: any) => ({ id: i.id, word: i.word, hukum_tajwid: i.hukum_tajwid, catatan: i.catatan || "" })));

    const a = assessmentRes.data as any;
    if (a) {
      setMakhrajScore(a.makhraj_score);
      setTajwidScore(a.tajwid_score);
      setKelancaranScore(a.kelancaran_score);
      setComment(a.comment || "");
    } else {
      setMakhrajScore(70);
      setTajwidScore(70);
      setKelancaranScore(70);
      setComment("");
    }
  };

  const selectSubmission = (sub: Submission) => {
    setSelected(sub);
    loadExistingData(sub.id);
  };

  const addRow = () => setAnalysisRows([...analysisRows, { word: "", hukum_tajwid: "", catatan: "" }]);
  const removeRow = (i: number) => setAnalysisRows(analysisRows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof AnalysisRow, value: string) => {
    const updated = [...analysisRows];
    updated[i] = { ...updated[i], [field]: value };
    setAnalysisRows(updated);
  };

  const handleSave = async () => {
    if (!selected || !user) return;
    setSaving(true);
    try {
      // Delete old analysis items and re-insert
      await supabase.from("tajwid_analysis_items" as any).delete().eq("submission_id", selected.id);
      if (analysisRows.length > 0) {
        const rows = analysisRows.filter(r => r.word.trim()).map((r, i) => ({
          submission_id: selected.id,
          word: r.word.trim(),
          hukum_tajwid: r.hukum_tajwid.trim(),
          catatan: r.catatan.trim() || null,
          sort_order: i,
        }));
        if (rows.length > 0) {
          const { error } = await supabase.from("tajwid_analysis_items" as any).insert(rows);
          if (error) throw error;
        }
      }

      // Upsert assessment
      const { data: existing } = await supabase
        .from("tajwid_assessments" as any)
        .select("id")
        .eq("submission_id", selected.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("tajwid_assessments" as any).update({
          makhraj_score: makhrajScore,
          tajwid_score: tajwidScore,
          kelancaran_score: kelancaranScore,
          comment: comment.trim() || null,
          assessed_by: user.id,
        }).eq("id", (existing as any).id);
      } else {
        await supabase.from("tajwid_assessments" as any).insert({
          submission_id: selected.id,
          makhraj_score: makhrajScore,
          tajwid_score: tajwidScore,
          kelancaran_score: kelancaranScore,
          comment: comment.trim() || null,
          assessed_by: user.id,
        });
      }

      // Update submission status
      await supabase.from("tajwid_submissions" as any).update({ status: "reviewed" }).eq("id", selected.id);

      toast.success("Penilaian berhasil disimpan!");
      setSelected({ ...selected, status: "reviewed" });
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  if (selected) {
    const surah = surahList.find(s => s.number === selected.surah_number);
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelected(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </Button>

        {/* Submission info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{selected.santri_name} — QS. {surah?.name}: {selected.ayat_number}</span>
              <Badge variant={selected.status === "reviewed" ? "default" : selected.status === "auto_reviewed" ? "outline" : "secondary"}>
                {selected.status === "reviewed" ? "Dinilai Ustadz" : selected.status === "auto_reviewed" ? "Dinilai AI" : "Menunggu"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selected.ayat_text && (
              <p className="text-2xl font-arabic leading-loose text-foreground text-center mb-4" dir="rtl">
                {selected.ayat_text}
              </p>
            )}
            {selected.audio_url && (
              <audio controls className="w-full" src={selected.audio_url}>
                Browser tidak mendukung audio.
              </audio>
            )}
          </CardContent>
        </Card>

        {/* Analysis Table Editor */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Analisis Tajwid</CardTitle>
              <Button size="sm" variant="outline" onClick={addRow} className="gap-1">
                <Plus className="w-3 h-3" /> Tambah
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {analysisRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada analisis. Klik Tambah untuk menambahkan.
              </p>
            ) : (
              <div className="space-y-3">
                {analysisRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Kata (Arab)"
                        value={row.word}
                        onChange={e => updateRow(i, "word", e.target.value)}
                        dir="rtl"
                        className="font-arabic"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Hukum tajwid"
                        value={row.hukum_tajwid}
                        onChange={e => updateRow(i, "hukum_tajwid", e.target.value)}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Catatan"
                        value={row.catatan}
                        onChange={e => updateRow(i, "catatan", e.target.value)}
                      />
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeRow(i)} className="shrink-0 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment Scores */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Penilaian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: "Makhraj", value: makhrajScore, setter: setMakhrajScore },
              { label: "Tajwid", value: tajwidScore, setter: setTajwidScore },
              { label: "Kelancaran", value: kelancaranScore, setter: setKelancaranScore },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-2">
                  <Label>{label}</Label>
                  <span className="font-bold">{value}/100</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={v => setter(v[0])}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label>Komentar Ustadz</Label>
              <Textarea
                placeholder="Berikan komentar dan saran untuk santri..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Penilaian
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submissions list
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
        <p className="text-center py-12 text-muted-foreground">Belum ada bacaan yang dikirim santri.</p>
      ) : (
        submissions.map(sub => {
          const surah = surahList.find(s => s.number === sub.surah_number);
          return (
            <Card key={sub.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => selectSubmission(sub)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{sub.santri_name}</p>
                  <p className="text-sm text-muted-foreground">
                    QS. {surah?.name}: {sub.ayat_number} •{" "}
                    {new Date(sub.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <Badge variant={sub.status === "reviewed" ? "default" : sub.status === "auto_reviewed" ? "outline" : "secondary"}>
                  {sub.status === "reviewed" ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Dinilai Ustadz</>
                  ) : sub.status === "auto_reviewed" ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Dinilai AI</>
                  ) : (
                    <><Clock className="w-3 h-3 mr-1" /> Menunggu</>
                  )}
                </Badge>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
