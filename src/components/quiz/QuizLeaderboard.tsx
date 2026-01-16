import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Clock, ArrowLeft, Loader2 } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  completedAt: string;
}

interface QuizLeaderboardProps {
  quizId: string;
  quizTitle: string;
  onBack: () => void;
}

export function QuizLeaderboard({ quizId, quizTitle, onBack }: QuizLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data: attempts, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .not("completed_at", "is", null)
        .order("score", { ascending: false })
        .order("time_taken_seconds", { ascending: true });

      if (error) throw error;

      // Fetch profiles for all users
      const userIds = [...new Set((attempts || []).map((a) => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

      const leaderboardEntries: LeaderboardEntry[] = (attempts || []).map((attempt, index) => {
        const profile = profileMap.get(attempt.user_id);
        return {
          rank: index + 1,
          userId: attempt.user_id,
          userName: profile?.full_name || "Unknown",
          avatarUrl: profile?.avatar_url,
          score: attempt.score,
          totalQuestions: attempt.total_questions,
          timeTaken: attempt.time_taken_seconds || 0,
          completedAt: attempt.completed_at || "",
        };
      });

      setEntries(leaderboardEntries);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">Peringkat Kuis</h2>
          <p className="text-sm text-muted-foreground">{quizTitle}</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada peserta yang menyelesaikan kuis ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.userId} className={`${getRankBg(entry.rank)}`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">{getRankIcon(entry.rank)}</div>

                  <Avatar className="w-10 h-10">
                    <AvatarImage src={entry.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(entry.userName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{entry.userName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatTime(entry.timeTaken)}
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={entry.rank <= 3 ? "default" : "secondary"} className="font-bold">
                      {entry.score}/{entry.totalQuestions}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((entry.score / entry.totalQuestions) * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={onBack}>
          Kembali ke Daftar Kuis
        </Button>
      </div>
    </div>
  );
}
