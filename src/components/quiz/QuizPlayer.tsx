import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, CheckCircle2, XCircle, ArrowRight, Trophy, Loader2 } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  sort_order: number;
}

interface QuizPlayerProps {
  quizId: string;
  quizTitle: string;
  durationMinutes: number;
  onComplete: () => void;
  onBack: () => void;
}

export function QuizPlayer({ quizId, quizTitle, durationMinutes, onComplete, onBack }: QuizPlayerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    timeTaken: number;
    details: Array<{
      question: string;
      selected: string;
      correct: string;
      isCorrect: boolean;
      explanation: string | null;
    }>;
  } | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchQuestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("sort_order");

      if (error) throw error;

      const formattedQuestions: Question[] = (data || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options as string[] : [],
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        sort_order: q.sort_order,
      }));

      setQuestions(formattedQuestions);

      // Create attempt
      if (user) {
        const { data: attempt, error: attemptError } = await supabase
          .from("quiz_attempts")
          .insert({
            quiz_id: quizId,
            user_id: user.id,
            total_questions: formattedQuestions.length,
          })
          .select()
          .single();

        if (attemptError) {
          if (attemptError.code === "23505") {
            toast({
              title: "Sudah Dikerjakan",
              description: "Anda sudah mengerjakan kuis ini sebelumnya",
              variant: "destructive",
            });
            onBack();
            return;
          }
          throw attemptError;
        }

        setAttemptId(attempt.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memuat pertanyaan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [quizId, user, toast, onBack]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Timer countdown
  useEffect(() => {
    if (showResults || isLoading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResults, isLoading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (selectedAnswer) {
      setAnswers((prev) => ({ ...prev, [questions[currentIndex].id]: selectedAnswer }));
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(answers[questions[currentIndex + 1]?.id] || "");
    }
  };

  const handlePrev = () => {
    if (selectedAnswer) {
      setAnswers((prev) => ({ ...prev, [questions[currentIndex].id]: selectedAnswer }));
    }

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswer(answers[questions[currentIndex - 1]?.id] || "");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Save current answer
    const finalAnswers = selectedAnswer
      ? { ...answers, [questions[currentIndex].id]: selectedAnswer }
      : answers;

    try {
      const timeTaken = durationMinutes * 60 - timeLeft;
      let score = 0;
      const details: typeof results extends null ? never : NonNullable<typeof results>["details"] = [];

      // Calculate score and prepare answers
      const answersToInsert = questions.map((q) => {
        const selected = finalAnswers[q.id] || "";
        const isCorrect = selected === q.correct_answer;
        if (isCorrect) score++;

        details.push({
          question: q.question,
          selected,
          correct: q.correct_answer,
          isCorrect,
          explanation: q.explanation,
        });

        return {
          attempt_id: attemptId!,
          question_id: q.id,
          selected_answer: selected,
          is_correct: isCorrect,
        };
      });

      // Insert answers
      if (attemptId) {
        await supabase.from("quiz_answers").insert(answersToInsert);

        // Update attempt
        await supabase
          .from("quiz_attempts")
          .update({
            score,
            time_taken_seconds: timeTaken,
            completed_at: new Date().toISOString(),
          })
          .eq("id", attemptId);
      }

      setResults({
        score,
        total: questions.length,
        timeTaken,
        details,
      });
      setShowResults(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan jawaban",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showResults && results) {
    const percentage = (results.score / results.total) * 100;

    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6 text-center">
            <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Kuis Selesai!</h2>
            <p className="text-4xl font-bold text-primary mb-2">
              {results.score}/{results.total}
            </p>
            <p className="text-muted-foreground">
              {percentage >= 80
                ? "Luar biasa! 🎉"
                : percentage >= 60
                ? "Bagus! 👍"
                : "Tetap semangat! 💪"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Waktu: {Math.floor(results.timeTaken / 60)}m {results.timeTaken % 60}s
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-semibold">Pembahasan</h3>
          {results.details.map((detail, index) => (
            <Card key={index} className={detail.isCorrect ? "border-green-500/50" : "border-red-500/50"}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start gap-2">
                  {detail.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{detail.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Jawaban Anda: <span className={detail.isCorrect ? "text-green-500" : "text-red-500"}>{detail.selected || "(tidak dijawab)"}</span>
                    </p>
                    {!detail.isCorrect && (
                      <p className="text-sm text-green-600">Jawaban Benar: {detail.correct}</p>
                    )}
                    {detail.explanation && (
                      <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                        {detail.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={onComplete}>Lihat Peringkat</Button>
          <Button variant="outline" onClick={onBack}>
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isTimeWarning = timeLeft <= 60;

  return (
    <div className="space-y-6">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{quizTitle}</h2>
          <p className="text-sm text-muted-foreground">
            Pertanyaan {currentIndex + 1} dari {questions.length}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold ${
            isTimeWarning ? "bg-red-100 text-red-600 animate-pulse" : "bg-primary/10 text-primary"
          }`}
        >
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Question card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion?.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            <div className="space-y-3">
              {currentQuestion?.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedAnswer === option
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedAnswer(option)}
                >
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
          Sebelumnya
        </Button>

        {currentIndex === questions.length - 1 ? (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Selesai
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Selanjutnya
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Question indicators */}
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => {
              if (selectedAnswer) {
                setAnswers((prev) => ({ ...prev, [questions[currentIndex].id]: selectedAnswer }));
              }
              setCurrentIndex(index);
              setSelectedAnswer(answers[q.id] || "");
            }}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              index === currentIndex
                ? "bg-primary text-primary-foreground"
                : answers[q.id]
                ? "bg-green-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
