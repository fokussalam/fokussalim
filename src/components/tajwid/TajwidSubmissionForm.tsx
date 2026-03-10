import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { surahList } from "@/data/surahList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Square, Loader2, Send, FileAudio, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  submission: {
    id: string;
    surah_number: number;
    ayat_number: number;
    ayat_text: string | null;
    audio_url: string | null;
    status: string;
  };
  analysisItems: Array<{
    word: string;
    hukum_tajwid: string;
    catatan: string | null;
  }>;
  assessment: {
    makhraj_score: number;
    tajwid_score: number;
    kelancaran_score: number;
    comment: string | null;
  } | null;
}

interface Props {
  onSubmitted: () => void;
}

export function TajwidSubmissionForm({ onSubmitted }: Props) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [santriName, setSantriName] = useState("");
  const [surahNumber, setSurahNumber] = useState<string>("");
  const [ayatNumber, setAyatNumber] = useState<string>("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [ayatText, setAyatText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fetchingAyat, setFetchingAyat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (profile?.full_name) setSantriName(profile.full_name);
  }, [profile]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `rekaman-${Date.now()}.webm`, { type: "audio/webm" });
        setAudioFile(file);
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast.error("Tidak dapat mengakses mikrofon");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const selectedSurah = surahList.find(s => s.number === Number(surahNumber));
  const maxAyat = selectedSurah?.ayatCount || 1;

  useEffect(() => {
    if (!surahNumber || !ayatNumber) {
      setAyatText("");
      return;
    }
    const fetchAyat = async () => {
      setFetchingAyat(true);
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayatNumber}/ar`);
        const data = await res.json();
        if (data.code === 200) {
          setAyatText(data.data.text);
        }
      } catch {
        setAyatText("");
      } finally {
        setFetchingAyat(false);
      }
    };
    fetchAyat();
  }, [surahNumber, ayatNumber]);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriName.trim() || !surahNumber || !ayatNumber) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      let audioUrl: string | null = null;
      if (audioFile) {
        const folder = user ? user.id : "public";
        const ext = audioFile.name.split(".").pop();
        const path = `${folder}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("tajwid-audio")
          .upload(path, audioFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("tajwid-audio").getPublicUrl(path);
        audioUrl = urlData.publicUrl;
      }

      const { data: insertedData, error } = await supabase.from("tajwid_submissions" as any).insert({
        user_id: user?.id || null,
        santri_name: santriName.trim(),
        surah_number: Number(surahNumber),
        ayat_number: Number(ayatNumber),
        ayat_text: ayatText || null,
        audio_url: audioUrl,
        status: "pending",
      }).select("id").single();

      if (error) throw error;

      toast.success("Bacaan berhasil dikirim! Menganalisis tajwid...");
      setLoading(false);
      setAnalyzing(true);

      const submissionId = (insertedData as any).id;
      const { error: aiError } = await supabase.functions.invoke("tajwid-analyze", {
        body: {
          submission_id: submissionId,
          surah_number: Number(surahNumber),
          ayat_number: Number(ayatNumber),
          ayat_text: ayatText,
        },
      });

      if (aiError) {
        console.error("AI analysis error:", aiError);
        toast.error("Analisis AI gagal. Ustadz akan mengoreksi manual.");
        setAnalyzing(false);
        onSubmitted();
        return;
      }

      // Fetch the results
      const [analysisRes, assessmentRes] = await Promise.all([
        supabase.from("tajwid_analysis_items" as any).select("*").eq("submission_id", submissionId).order("sort_order"),
        supabase.from("tajwid_assessments" as any).select("*").eq("submission_id", submissionId).maybeSingle(),
      ]);

      setResult({
        submission: {
          id: submissionId,
          surah_number: Number(surahNumber),
          ayat_number: Number(ayatNumber),
          ayat_text: ayatText || null,
          audio_url: audioUrl,
          status: "auto_reviewed",
        },
        analysisItems: (analysisRes.data as any) || [],
        assessment: (assessmentRes.data as any) || null,
      });

      toast.success("Analisis tajwid otomatis selesai!");
      setAnalyzing(false);
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim bacaan");
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSurahNumber("");
    setAyatNumber("");
    setAudioFile(null);
    setAyatText("");
  };

  // Show result view
  if (result) {
    const surah = surahList.find(s => s.number === result.submission.surah_number);
    return (
      <div className="space-y-4">
        {/* Ayat */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>QS. {surah?.name}: {result.submission.ayat_number}</span>
              <Badge variant="outline">Dinilai oleh Adin, M.Pd</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.submission.ayat_text && (
              <p className="text-2xl font-arabic leading-loose text-foreground text-center mb-4" dir="rtl">
                {result.submission.ayat_text}
              </p>
            )}
            {result.submission.audio_url && (
              <audio controls className="w-full" src={result.submission.audio_url}>
                Browser tidak mendukung audio.
              </audio>
            )}
          </CardContent>
        </Card>

        {/* Analysis Table */}
        {result.analysisItems.length > 0 && (
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
                  {result.analysisItems.map((item, i) => (
                    <TableRow key={i}>
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
        {result.assessment && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Penilaian
                <Badge variant="outline" className="text-xs font-normal">Otomatis AI</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { label: "Makhraj", score: result.assessment.makhraj_score },
                  { label: "Tajwid", score: result.assessment.tajwid_score },
                  { label: "Kelancaran", score: result.assessment.kelancaran_score },
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
              {result.assessment.comment && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Komentar:</p>
                  <p className="text-sm text-muted-foreground">{result.assessment.comment}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Button onClick={handleReset} variant="outline" className="w-full gap-2">
          <RotateCcw className="w-4 h-4" /> Kirim Bacaan Baru
        </Button>
      </div>
    );
  }

  // Show analyzing state
  if (analyzing) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <div>
            <p className="font-semibold text-foreground">Menganalisis tajwid...</p>
            <p className="text-sm text-muted-foreground mt-1">Mohon tunggu, AI sedang menganalisis bacaan Anda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kirim Bacaan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Santri</Label>
            <Input value={santriName} onChange={e => setSantriName(e.target.value)} placeholder="Nama lengkap" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Surah</Label>
              <Select value={surahNumber} onValueChange={v => { setSurahNumber(v); setAyatNumber(""); }}>
                <SelectTrigger><SelectValue placeholder="Pilih surah" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {surahList.map(s => (
                    <SelectItem key={s.number} value={String(s.number)}>
                      {s.number}. {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ayat</Label>
              <Input
                type="number"
                min={1}
                max={maxAyat}
                value={ayatNumber}
                onChange={e => setAyatNumber(e.target.value)}
                placeholder={`1-${maxAyat}`}
                required
              />
            </div>
          </div>

          {ayatText && (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-arabic leading-loose text-foreground" dir="rtl">
                {fetchingAyat ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : ayatText}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                QS. {selectedSurah?.name}: {ayatNumber}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Audio Bacaan</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                className="gap-2 flex-1"
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <><Square className="w-4 h-4" /> Stop ({formatTime(recordingTime)})</>
                ) : (
                  <><Mic className="w-4 h-4" /> Rekam</>
                )}
              </Button>
              <label className="flex-1">
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={e => { setAudioFile(e.target.files?.[0] || null); }}
                />
                <div className="flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
                  <FileAudio className="w-4 h-4" /> Pilih File
                </div>
              </label>
            </div>
            {audioFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <FileAudio className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{audioFile.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAudioFile(null)} className="text-xs h-7 px-2">
                  Hapus
                </Button>
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Kirim Bacaan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
