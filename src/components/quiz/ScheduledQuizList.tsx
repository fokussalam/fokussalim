import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { ScheduledQuizForm } from "./ScheduledQuizForm";
import { QuizPlayer } from "./QuizPlayer";
import { QuizLeaderboard } from "./QuizLeaderboard";
import {
  Plus,
  Clock,
  Users,
  Trophy,
  Play,
  Pencil,
  Trash2,
  BarChart3,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface ScheduledQuiz {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  question_count: number;
  attempt_count: number;
  user_completed: boolean;
}

export function ScheduledQuizList() {
  const [quizzes, setQuizzes] = useState<ScheduledQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editQuiz, setEditQuiz] = useState<any>(null);
  const [activeQuiz, setActiveQuiz] = useState<ScheduledQuiz | null>(null);
  const [leaderboardQuiz, setLeaderboardQuiz] = useState<ScheduledQuiz | null>(null);
  const [deleteQuiz, setDeleteQuiz] = useState<ScheduledQuiz | null>(null);

  const { isAdminOrPengurus } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchQuizzes = useCallback(async () => {
    try {
      const { data: quizzesData, error } = await supabase
        .from("scheduled_quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch question counts
      const quizIds = (quizzesData || []).map((q) => q.id);

      const { data: questionCounts } = await supabase
        .from("quiz_questions")
        .select("quiz_id")
        .in("quiz_id", quizIds);

      const questionCountMap = new Map<string, number>();
      questionCounts?.forEach((q) => {
        questionCountMap.set(q.quiz_id, (questionCountMap.get(q.quiz_id) || 0) + 1);
      });

      // Fetch attempt counts
      const { data: attemptCounts } = await supabase
        .from("quiz_attempts")
        .select("quiz_id")
        .in("quiz_id", quizIds)
        .not("completed_at", "is", null);

      const attemptCountMap = new Map<string, number>();
      attemptCounts?.forEach((a) => {
        attemptCountMap.set(a.quiz_id, (attemptCountMap.get(a.quiz_id) || 0) + 1);
      });

      // Check user's completion status
      let userCompletedMap = new Map<string, boolean>();
      if (user) {
        const { data: userAttempts } = await supabase
          .from("quiz_attempts")
          .select("quiz_id")
          .eq("user_id", user.id)
          .not("completed_at", "is", null);

        userAttempts?.forEach((a) => {
          userCompletedMap.set(a.quiz_id, true);
        });
      }

      const formattedQuizzes: ScheduledQuiz[] = (quizzesData || []).map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        duration_minutes: quiz.duration_minutes,
        is_active: quiz.is_active,
        created_at: quiz.created_at,
        question_count: questionCountMap.get(quiz.id) || 0,
        attempt_count: attemptCountMap.get(quiz.id) || 0,
        user_completed: userCompletedMap.get(quiz.id) || false,
      }));

      setQuizzes(formattedQuizzes);
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleToggleActive = async (quiz: ScheduledQuiz) => {
    try {
      const { error } = await supabase
        .from("scheduled_quizzes")
        .update({ is_active: !quiz.is_active })
        .eq("id", quiz.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Kuis ${!quiz.is_active ? "diaktifkan" : "dinonaktifkan"}`,
      });

      fetchQuizzes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (quiz: ScheduledQuiz) => {
    // Fetch questions for this quiz
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quiz.id)
      .order("sort_order");

    setEditQuiz({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      duration_minutes: quiz.duration_minutes,
      is_active: quiz.is_active,
      questions: (questions || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: q.correct_answer,
        explanation: q.explanation,
      })),
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteQuiz) return;

    try {
      const { error } = await supabase
        .from("scheduled_quizzes")
        .delete()
        .eq("id", deleteQuiz.id);

      if (error) throw error;

      toast({ title: "Berhasil", description: "Kuis berhasil dihapus" });
      setDeleteQuiz(null);
      fetchQuizzes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (activeQuiz) {
    return (
      <QuizPlayer
        quizId={activeQuiz.id}
        quizTitle={activeQuiz.title}
        durationMinutes={activeQuiz.duration_minutes}
        onComplete={() => {
          setLeaderboardQuiz(activeQuiz);
          setActiveQuiz(null);
        }}
        onBack={() => {
          setActiveQuiz(null);
          fetchQuizzes();
        }}
      />
    );
  }

  if (leaderboardQuiz) {
    return (
      <QuizLeaderboard
        quizId={leaderboardQuiz.id}
        quizTitle={leaderboardQuiz.title}
        onBack={() => {
          setLeaderboardQuiz(null);
          fetchQuizzes();
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdminOrPengurus && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setEditQuiz(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Kuis Baru
          </Button>
        </div>
      )}

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isAdminOrPengurus
                ? "Belum ada kuis terjadwal. Klik tombol di atas untuk membuat kuis baru."
                : "Belum ada kuis terjadwal yang tersedia."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className={!quiz.is_active && !isAdminOrPengurus ? "opacity-50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      {quiz.is_active ? (
                        <Badge className="bg-green-500">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Nonaktif</Badge>
                      )}
                      {quiz.user_completed && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Selesai
                        </Badge>
                      )}
                    </div>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                    )}
                  </div>

                  {isAdminOrPengurus && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={quiz.is_active}
                        onCheckedChange={() => handleToggleActive(quiz)}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {quiz.duration_minutes} menit
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    {quiz.question_count} soal
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {quiz.attempt_count} peserta
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {quiz.is_active && !quiz.user_completed && (
                    <Button size="sm" onClick={() => setActiveQuiz(quiz)}>
                      <Play className="w-4 h-4 mr-1" />
                      Mulai Kuis
                    </Button>
                  )}

                  <Button size="sm" variant="outline" onClick={() => setLeaderboardQuiz(quiz)}>
                    <Trophy className="w-4 h-4 mr-1" />
                    Peringkat
                  </Button>

                  {isAdminOrPengurus && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(quiz)}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteQuiz(quiz)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Hapus
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ScheduledQuizForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditQuiz(null);
        }}
        onSuccess={fetchQuizzes}
        editData={editQuiz}
      />

      <AlertDialog open={!!deleteQuiz} onOpenChange={(open) => !open && setDeleteQuiz(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kuis</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kuis "{deleteQuiz?.title}"? Semua data termasuk pertanyaan dan hasil akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
