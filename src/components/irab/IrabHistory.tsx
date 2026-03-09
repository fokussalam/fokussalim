import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight, Clock, CheckCircle } from "lucide-react";
import { IrabDetail } from "./IrabDetail";

interface Submission {
  id: string;
  student_name: string;
  arabic_text: string;
  sentence_type: string | null;
  status: string;
  created_at: string;
}

interface Props {
  refreshKey: number;
}

export function IrabHistory({ refreshKey }: Props) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("irab_submissions" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSubmissions((data as any) || []);
      setLoading(false);
    };
    fetchData();
  }, [user, refreshKey]);

  if (selectedId) {
    const sub = submissions.find(s => s.id === selectedId);
    if (sub) return <IrabDetail submission={sub} onBack={() => setSelectedId(null)} />;
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
        <p>Belum ada riwayat analisis. Kirim teks Arab pertamamu!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map(sub => (
        <Card
          key={sub.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedId(sub.id)}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-arabic text-base text-foreground truncate" dir="rtl">
                {sub.arabic_text}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {sub.sentence_type && (
                  <Badge variant="outline" className="text-xs">{sub.sentence_type}</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(sub.created_at).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Badge variant={sub.status === "reviewed" ? "default" : sub.status === "auto_reviewed" ? "outline" : "secondary"}>
                {sub.status === "reviewed" ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Ustadz</>
                ) : sub.status === "auto_reviewed" ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> AI</>
                ) : (
                  <><Clock className="w-3 h-3 mr-1" /> Menunggu</>
                )}
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
