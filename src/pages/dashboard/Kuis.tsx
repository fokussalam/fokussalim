import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScheduledQuizList } from "@/components/quiz/ScheduledQuizList";
import { 
  Brain, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw,
  Trophy,
  Lightbulb,
  Sparkles,
  Calendar
} from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizResult {
  correct: number;
  total: number;
  answers: { questionId: number; userAnswer: number; isCorrect: boolean }[];
}

const TOPICS = [
  { value: "rukun-islam", label: "Rukun Islam" },
  { value: "rukun-iman", label: "Rukun Iman" },
  { value: "sejarah-nabi", label: "Sejarah Nabi Muhammad SAW" },
  { value: "al-quran", label: "Pengetahuan Al-Quran" },
  { value: "sholat", label: "Tata Cara Sholat" },
  { value: "puasa", label: "Puasa & Ramadhan" },
  { value: "zakat", label: "Zakat & Sedekah" },
  { value: "haji", label: "Haji & Umrah" },
  { value: "akhlak", label: "Akhlak & Adab" },
  { value: "doa", label: "Doa Sehari-hari" },
];

const DIFFICULTIES = [
  { value: "mudah", label: "Mudah", color: "bg-emerald-500" },
  { value: "sedang", label: "Sedang", color: "bg-amber-500" },
  { value: "sulit", label: "Sulit", color: "bg-red-500" },
];

function AIQuizTab() {
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [difficulty, setDifficulty] = useState("sedang");
  const [questionCount, setQuestionCount] = useState("5");
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<Map<number, number>>(new Map());

  const generateQuiz = async () => {
    const selectedTopic = topic === "custom" ? customTopic : topic;
    if (!selectedTopic) {
      toast.error("Pilih atau masukkan topik kuis");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("quiz-generator", {
        body: { 
          topic: selectedTopic, 
          difficulty, 
          questionCount: parseInt(questionCount) 
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setQuestions(data.questions);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setResult(null);
      setUserAnswers(new Map());
      toast.success("Kuis berhasil dibuat!");
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error(error instanceof Error ? error.message : "Gagal membuat kuis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = () => {
    if (selectedAnswer === null) {
      toast.error("Pilih jawaban terlebih dahulu");
      return;
    }

    const newAnswers = new Map(userAnswers);
    newAnswers.set(questions[currentQuestion].id, selectedAnswer);
    setUserAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      const answers = Array.from(newAnswers.entries()).map(([questionId, userAnswer]) => {
        const question = questions.find((q) => q.id === questionId);
        return {
          questionId,
          userAnswer,
          isCorrect: question?.correctAnswer === userAnswer,
        };
      });
      const correct = answers.filter((a) => a.isCorrect).length;
      setResult({ correct, total: questions.length, answers });
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setResult(null);
    setUserAnswers(new Map());
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 80) return { text: "Luar Biasa! 🎉", color: "text-emerald-600" };
    if (percentage >= 60) return { text: "Bagus! 👍", color: "text-blue-600" };
    if (percentage >= 40) return { text: "Cukup Baik 📚", color: "text-amber-600" };
    return { text: "Tetap Semangat! 💪", color: "text-red-600" };
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Buat Kuis Baru
          </CardTitle>
          <CardDescription>
            Pilih topik dan tingkat kesulitan untuk memulai kuis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Topik Kuis</Label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih topik..." />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {TOPICS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Topik Lainnya...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {topic === "custom" && (
            <div className="space-y-2">
              <Label>Topik Kustom</Label>
              <Input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Masukkan topik kuis..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Tingkat Kesulitan</Label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <Button
                  key={d.value}
                  variant={difficulty === d.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDifficulty(d.value)}
                  className="flex-1"
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Jumlah Soal</Label>
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="3">3 Soal</SelectItem>
                <SelectItem value="5">5 Soal</SelectItem>
                <SelectItem value="10">10 Soal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateQuiz}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Membuat Kuis...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Mulai Kuis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResult && result) {
    return (
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Hasil Kuis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">
              {result.correct}/{result.total}
            </div>
            <p className={`text-lg font-medium ${getScoreMessage((result.correct / result.total) * 100).color}`}>
              {getScoreMessage((result.correct / result.total) * 100).text}
            </p>
            <Progress 
              value={(result.correct / result.total) * 100} 
              className="mt-4 h-3"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Pembahasan
            </h3>
            {questions.map((q, idx) => {
              const userAnswer = userAnswers.get(q.id);
              const isCorrect = userAnswer === q.correctAnswer;
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-lg border ${
                    isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {idx + 1}. {q.question}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Jawaban benar: {q.options[q.correctAnswer]}
                      </p>
                      {!isCorrect && userAnswer !== undefined && (
                        <p className="text-xs text-red-600 mt-1">
                          Jawaban Anda: {q.options[userAnswer]}
                        </p>
                      )}
                      <p className="text-xs mt-2 text-muted-foreground">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={resetQuiz} className="w-full" size="lg">
            <RotateCcw className="w-4 h-4 mr-2" />
            Buat Kuis Baru
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary">
            Soal {currentQuestion + 1} dari {questions.length}
          </Badge>
          <Badge 
            variant="outline"
            className={
              difficulty === "mudah" 
                ? "border-emerald-500 text-emerald-600" 
                : difficulty === "sedang"
                ? "border-amber-500 text-amber-600"
                : "border-red-500 text-red-600"
            }
          >
            {DIFFICULTIES.find((d) => d.value === difficulty)?.label}
          </Badge>
        </div>
        <Progress 
          value={((currentQuestion + 1) / questions.length) * 100} 
          className="h-2"
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold leading-relaxed">
            {questions[currentQuestion]?.question}
          </h2>
        </div>

        <RadioGroup
          value={selectedAnswer?.toString()}
          onValueChange={(value) => setSelectedAnswer(parseInt(value))}
          className="space-y-3"
        >
          {questions[currentQuestion]?.options.map((option, idx) => (
            <div
              key={idx}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                selectedAnswer === idx
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedAnswer(idx)}
            >
              <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
              <Label
                htmlFor={`option-${idx}`}
                className="flex-1 cursor-pointer font-normal"
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={resetQuiz}
            className="flex-1"
          >
            Keluar
          </Button>
          <Button
            onClick={handleAnswer}
            className="flex-1"
            disabled={selectedAnswer === null}
          >
            {currentQuestion < questions.length - 1 ? (
              <>
                Selanjutnya
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              "Lihat Hasil"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Kuis() {
  return (
    <>
      <Helmet>
        <title>Kuis - Salim | Komunitas Pengajian</title>
      </Helmet>

      <DashboardLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Kuis</h1>
            <p className="text-muted-foreground mt-1">
              Uji pengetahuan Anda dengan berbagai jenis kuis
            </p>
          </div>

          <Tabs defaultValue="scheduled" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scheduled" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Kuis Terjadwal
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Kuis AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scheduled" className="mt-6">
              <ScheduledQuizList />
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Berbasis AI</span>
                </div>
              </div>
              <AIQuizTab />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </>
  );
}
