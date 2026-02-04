import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  History,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface QuizAttemptWithDetails {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  time_taken_seconds: number | null;
  started_at: string;
  completed_at: string | null;
  quiz_title: string;
  answers: {
    question: string;
    selected_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string | null;
  }[];
}

export function QuizArchive() {
  const [attempts, setAttempts] = useState<QuizAttemptWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAttempts();
    }
  }, [user]);

  const fetchAttempts = async () => {
    if (!user) return;

    try {
      // Fetch completed attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (attemptsError) throw attemptsError;

      if (!attemptsData || attemptsData.length === 0) {
        setAttempts([]);
        setIsLoading(false);
        return;
      }

      // Fetch quiz titles
      const quizIds = [...new Set(attemptsData.map((a) => a.quiz_id))];
      const { data: quizzesData } = await supabase
        .from("scheduled_quizzes")
        .select("id, title")
        .in("id", quizIds);

      const quizTitleMap = new Map(quizzesData?.map((q) => [q.id, q.title]) || []);

      // Fetch answers for each attempt
      const attemptIds = attemptsData.map((a) => a.id);
      const { data: answersData } = await supabase
        .from("quiz_answers")
        .select("attempt_id, question_id, selected_answer, is_correct")
        .in("attempt_id", attemptIds);

      // Fetch questions
      const questionIds = [...new Set(answersData?.map((a) => a.question_id) || [])];
      const { data: questionsData } = await supabase
        .from("quiz_questions")
        .select("id, question, correct_answer, explanation, options")
        .in("id", questionIds);

      const questionMap = new Map(questionsData?.map((q) => [q.id, q]) || []);

      // Build the attempts with details
      const attemptsWithDetails: QuizAttemptWithDetails[] = attemptsData.map((attempt) => {
        const attemptAnswers = answersData?.filter((a) => a.attempt_id === attempt.id) || [];
        
        const answers = attemptAnswers.map((answer) => {
          const question = questionMap.get(answer.question_id);
          return {
            question: question?.question || "",
            selected_answer: answer.selected_answer,
            correct_answer: question?.correct_answer || "",
            is_correct: answer.is_correct,
            explanation: question?.explanation || null,
          };
        });

        return {
          id: attempt.id,
          quiz_id: attempt.quiz_id,
          score: attempt.score,
          total_questions: attempt.total_questions,
          time_taken_seconds: attempt.time_taken_seconds,
          started_at: attempt.started_at,
          completed_at: attempt.completed_at,
          quiz_title: quizTitleMap.get(attempt.quiz_id) || "Kuis Tidak Diketahui",
          answers,
        };
      });

      setAttempts(attemptsWithDetails);
    } catch (error) {
      console.error("Failed to fetch quiz attempts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "text-emerald-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return { label: "Luar Biasa", variant: "default" as const, className: "bg-emerald-500" };
    if (percentage >= 60) return { label: "Bagus", variant: "default" as const, className: "bg-blue-500" };
    if (percentage >= 40) return { label: "Cukup", variant: "default" as const, className: "bg-amber-500" };
    return { label: "Perlu Belajar", variant: "default" as const, className: "bg-red-500" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Anda belum menyelesaikan kuis apapun.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Kerjakan kuis terjadwal untuk melihat riwayat di sini.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats
  const totalAttempts = attempts.length;
  const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0);
  const totalQuestions = attempts.reduce((sum, a) => sum + a.total_questions, 0);
  const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalAttempts}</div>
            <div className="text-xs text-muted-foreground">Kuis Selesai</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{totalCorrect}</div>
            <div className="text-xs text-muted-foreground">Jawaban Benar</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{averageScore}%</div>
            <div className="text-xs text-muted-foreground">Rata-rata</div>
          </CardContent>
        </Card>
      </div>

      {/* Attempt List */}
      <div className="space-y-3">
        {attempts.map((attempt) => {
          const isExpanded = expandedAttempt === attempt.id;
          const scoreBadge = getScoreBadge(attempt.score, attempt.total_questions);

          return (
            <Card key={attempt.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-1">{attempt.quiz_title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attempt.completed_at && format(new Date(attempt.completed_at), "dd MMMM yyyy, HH:mm", { locale: id })}
                    </p>
                  </div>
                  <Badge className={scoreBadge.className}>{scoreBadge.label}</Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className={`flex items-center gap-1 font-semibold ${getScoreColor(attempt.score, attempt.total_questions)}`}>
                    <Trophy className="w-4 h-4" />
                    {attempt.score}/{attempt.total_questions}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(attempt.time_taken_seconds)}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    {Math.round((attempt.score / attempt.total_questions) * 100)}%
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Sembunyikan Detail
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Lihat Detail
                    </>
                  )}
                </Button>

                {isExpanded && attempt.answers.length > 0 && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {attempt.answers.map((answer, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          answer.is_correct
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {answer.is_correct ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {idx + 1}. {answer.question}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Jawaban benar: {answer.correct_answer}
                            </p>
                            {!answer.is_correct && (
                              <p className="text-xs text-red-600 mt-0.5">
                                Jawaban Anda: {answer.selected_answer}
                              </p>
                            )}
                            {answer.explanation && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                {answer.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
