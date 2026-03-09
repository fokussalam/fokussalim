import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { surahList } from "@/data/surahList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Square, Loader2, Send, FileAudio } from "lucide-react";
import { toast } from "sonner";

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
  const [fetchingAyat, setFetchingAyat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriName.trim() || !surahNumber || !ayatNumber) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }

    setLoading(true);
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

      // Trigger AI analysis in background
      const submissionId = (insertedData as any).id;
      supabase.functions.invoke("tajwid-analyze", {
        body: {
          submission_id: submissionId,
          surah_number: Number(surahNumber),
          ayat_number: Number(ayatNumber),
          ayat_text: ayatText,
        },
      }).then(({ error: aiError }) => {
        if (aiError) {
          console.error("AI analysis error:", aiError);
          toast.error("Analisis AI gagal. Ustadz akan mengoreksi manual.");
        } else {
          toast.success("Analisis tajwid otomatis selesai!");
        }
        onSubmitted();
      });

      setSurahNumber("");
      setAyatNumber("");
      setAudioFile(null);
      setAyatText("");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim bacaan");
    } finally {
      setLoading(false);
    }
  };

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
