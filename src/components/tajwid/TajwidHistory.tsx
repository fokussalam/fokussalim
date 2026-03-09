import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { surahList } from "@/data/surahList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight, Clock, CheckCircle } from "lucide-react";
import { TajwidDetail } from "./TajwidDetail";

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

interface Props {
  refreshKey: number;
}

export function TajwidHistory({ refreshKey }: Props) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("tajwid_submissions" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSubmissions((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [user, refreshKey]);

  if (selectedId) {
    const sub = submissions.find(s => s.id === selectedId);
    if (sub) return <TajwidDetail submission={sub} onBack={() => setSelectedId(null)} />;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Belum ada riwayat bacaan. Kirim bacaan pertamamu!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map(sub => {
        const surah = surahList.find(s => s.number === sub.surah_number);
        return (
          <Card
            key={sub.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedId(sub.id)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  QS. {surah?.name || sub.surah_number}: {sub.ayat_number}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(sub.created_at).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={sub.status === "reviewed" ? "default" : sub.status === "auto_reviewed" ? "outline" : "secondary"}>
                  {sub.status === "reviewed" ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Dinilai Ustadz</>
                  ) : sub.status === "auto_reviewed" ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Dinilai oleh Adin, M.Pd</>
                  ) : (
                    <><Clock className="w-3 h-3 mr-1" /> Menunggu</>
                  )}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
