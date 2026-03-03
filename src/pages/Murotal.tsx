import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Search, Headphones, Loader2
} from "lucide-react";

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Reciter {
  identifier: string;
  name: string;
  englishName: string;
  language: string;
}

const POPULAR_RECITERS = [
  { identifier: "ar.alafasy", name: "Mishary Rashid Alafasy" },
  { identifier: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais" },
  { identifier: "ar.saaborelmosly", name: "Saud Ash-Shuraim" },
  { identifier: "ar.husary", name: "Mahmoud Khalil Al-Husary" },
  { identifier: "ar.minshawi", name: "Mohamed Siddiq El-Minshawi" },
  { identifier: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)" },
  { identifier: "ar.maaboralmoshaf", name: "Maher Al-Muaiqly" },
  { identifier: "ar.ahmedajamy", name: "Ahmed ibn Ali al-Ajamy" },
  { identifier: "ar.haborelshateee", name: "Abu Bakr Ash-Shatri" },
  { identifier: "ar.ibrahimakhbar", name: "Ibrahim Al-Akhdar" },
];

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const Murotal = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [reciter, setReciter] = useState("ar.alafasy");
  const [loading, setLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [search, setSearch] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("https://api.alquran.cloud/v1/surah")
      .then(r => r.json())
      .then(d => { setSurahs(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${selectedSurah}.mp3`;

  const loadAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioLoading(true);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    const audio = new Audio(audioUrl);
    audio.volume = muted ? 0 : volume / 100;
    audio.onloadedmetadata = () => { setDuration(audio.duration); setAudioLoading(false); };
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => {
      if (repeat) { audio.currentTime = 0; audio.play(); }
      else if (selectedSurah < 114) { setSelectedSurah(s => s + 1); }
      else { setPlaying(false); }
    };
    audio.onerror = () => { setAudioLoading(false); };
    audioRef.current = audio;
  }, [audioUrl, volume, muted, repeat, selectedSurah]);

  useEffect(() => { loadAudio(); return () => { audioRef.current?.pause(); }; }, [reciter, selectedSurah]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume / 100;
  }, [volume, muted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); }
    else { audioRef.current.play().catch(() => {}); }
    setPlaying(!playing);
  };

  const seekTo = (val: number[]) => {
    if (audioRef.current) { audioRef.current.currentTime = val[0]; setCurrentTime(val[0]); }
  };

  const prevSurah = () => { if (selectedSurah > 1) setSelectedSurah(s => s - 1); };
  const nextSurah = () => { if (selectedSurah < 114) setSelectedSurah(s => s + 1); };

  const currentSurah = surahs.find(s => s.number === selectedSurah);
  const filteredSurahs = surahs.filter(s =>
    s.name.includes(search) ||
    s.englishName.toLowerCase().includes(search.toLowerCase()) ||
    s.englishNameTranslation.toLowerCase().includes(search.toLowerCase()) ||
    s.number.toString() === search
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Murotal Online - Fokus Salim</title>
        <meta name="description" content="Dengarkan murotal Al-Quran 114 surah dari berbagai qari internasional" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Murotal Online</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* Reciter Selection */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Qari</label>
          <Select value={reciter} onValueChange={setReciter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_RECITERS.map(r => (
                <SelectItem key={r.identifier} value={r.identifier}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Now Playing Card */}
        {currentSurah && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 text-center border border-primary/10">
            <p className="text-xs text-muted-foreground mb-1">Sedang Diputar</p>
            <h2 className="text-2xl font-bold font-arabic mb-1">{currentSurah.name}</h2>
            <p className="text-sm text-foreground font-medium">{currentSurah.englishName}</p>
            <p className="text-xs text-muted-foreground">{currentSurah.englishNameTranslation} • {currentSurah.numberOfAyahs} Ayat</p>

            {/* Progress */}
            <div className="mt-5 space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 1}
                step={1}
                onValueChange={seekTo}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="ghost" size="icon" onClick={prevSurah} disabled={selectedSurah <= 1}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="w-14 h-14 rounded-full"
                onClick={togglePlay}
                disabled={audioLoading}
              >
                {audioLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : playing ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={nextSurah} disabled={selectedSurah >= 114}>
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Volume & Repeat */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <Button
                variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => setMuted(!muted)}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[muted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={v => { setVolume(v[0]); setMuted(false); }}
                className="w-24"
              />
              <Button
                variant="ghost" size="icon" className={`h-8 w-8 ${repeat ? "text-primary" : ""}`}
                onClick={() => setRepeat(!repeat)}
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Surah List */}
        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari surah..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-1">
              {filteredSurahs.map(surah => (
                <button
                  key={surah.number}
                  onClick={() => setSelectedSurah(surah.number)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    surah.number === selectedSurah
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    surah.number === selectedSurah
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {surah.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{surah.englishName}</span>
                      <span className="text-base font-arabic">{surah.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {surah.englishNameTranslation} • {surah.numberOfAyahs} ayat
                    </span>
                  </div>
                  {surah.number === selectedSurah && playing && (
                    <div className="flex gap-0.5 items-end h-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-1 bg-primary rounded-full animate-pulse" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Murotal;
