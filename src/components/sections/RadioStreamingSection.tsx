import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Radio, Volume2, VolumeX, Pause, Play, ExternalLink } from "lucide-react";

const STREAM_URL_HQ = "https://ars.mitradio.com:8040/radio.mp3";
const STREAM_URL_SD = "https://ars.mitradio.com:8050/radio.mp3";
const RADIO_WEBSITE = "https://www.radiosalamfm.com";

export function RadioStreamingSection() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentServer, setCurrentServer] = useState<"HQ" | "SD">("HQ");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
    };

    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);

    // Auto-play on mount
    audio.play().catch(() => {
      // Autoplay blocked - user needs to interact
      setIsLoading(false);
    });

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("waiting", handleWaiting);
    };
  }, [currentServer]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      setIsLoading(true);
      audio.play().catch(() => {
        setIsLoading(false);
        setHasError(true);
      });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(!isMuted);
  };

  const switchServer = () => {
    const newServer = currentServer === "HQ" ? "SD" : "HQ";
    setCurrentServer(newServer);
    setIsLoading(true);
    setHasError(false);
    
    const audio = audioRef.current;
    if (audio) {
      audio.src = newServer === "HQ" ? STREAM_URL_HQ : STREAM_URL_SD;
      if (isPlaying) {
        audio.play().catch(() => {
          setIsLoading(false);
        });
      }
    }
  };

  const currentStreamUrl = currentServer === "HQ" ? STREAM_URL_HQ : STREAM_URL_SD;

  return (
    <section className="py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-destructive/10 to-accent/5 rounded-xl p-4 border border-destructive/20 relative overflow-hidden">
          {/* Animated background when playing */}
          {isPlaying && (
            <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent animate-pulse pointer-events-none" />
          )}
          
          <div className="flex items-center gap-3 relative z-10">
            {/* Radio Icon with animation */}
            <div className={`w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 ${isPlaying ? 'animate-pulse' : ''}`}>
              <Radio className={`w-6 h-6 text-destructive ${isPlaying ? 'animate-bounce' : ''}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                Radio Salam 97.4 FM
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLoading ? "Memuat..." : isPlaying ? "🔴 Live Streaming" : hasError ? "Gagal memuat" : "Klik untuk memulai"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Server: {currentServer}
                </span>
                <button 
                  onClick={switchServer}
                  className="text-[10px] text-primary hover:underline"
                >
                  Ganti Server
                </button>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <Button 
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={toggleMute}
                disabled={!isPlaying}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              
              <Button 
                size="icon"
                className="h-10 w-10 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={togglePlay}
                disabled={isLoading && !hasError}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Website Link */}
          <div className="mt-3 pt-3 border-t border-destructive/10 relative z-10">
            <a 
              href={RADIO_WEBSITE} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              www.radiosalamfm.com
            </a>
          </div>
          
          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={currentStreamUrl}
            preload="none"
          />
        </div>
      </div>
    </section>
  );
}
