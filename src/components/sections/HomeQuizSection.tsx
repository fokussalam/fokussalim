import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  { value: "mudah", label: "Mudah" },
  { value: "sedang", label: "Sedang" },
  { value: "sulit", label: "Sulit" },
];

export const HomeQuizSection = () => {
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
        body: { topic: selectedTopic, difficulty, questionCount: parseInt(questionCount) },
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
        return { questionId, userAnswer, isCorrect: question?.correctAnswer === userAnswer };
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

  // Setup form
  if (questions.length === 0) {
    return (
      <section className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">Kuis Salim</span>
            </div>
            <h3 className="text-lg font-semibold">Uji Pengetahuan Islam</h3>
            <p className="text-xs text-muted-foreground mt-1">Berdasarkan referensi kitab Ulama Salaf</p>
          </div>

          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Topik</Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Pilih topik..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {TOPICS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                    <SelectItem value="custom">Topik Lainnya...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {topic === "custom" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Topik Kustom</Label>
                  <Input
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Masukkan topik..."
                    className="h-9 text-sm"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Kesulitan</Label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <Button
                      key={d.value}
                      variant={difficulty === d.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDifficulty(d.value)}
                      className="flex-1 h-8 text-xs"
                    >
                      {d.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Jumlah Soal</Label>
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="3">3 Soal</SelectItem>
                    <SelectItem value="5">5 Soal</SelectItem>
                    <SelectItem value="10">10 Soal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateQuiz} disabled={isLoading} className="w-full" size="sm">
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Membuat Kuis...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Mulai Kuis</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Result
  if (showResult && result) {
    const pct = (result.correct / result.total) * 100;
    return (
      <section className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Hasil Kuis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">
                  {result.correct}/{result.total}
                </div>
                <p className={`text-sm font-medium ${getScoreMessage(pct).color}`}>
                  {getScoreMessage(pct).text}
                </p>
                <Progress value={pct} className="mt-3 h-2" />
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Pembahasan
                </h4>
                {questions.map((q, idx) => {
                  const ua = userAnswers.get(q.id);
                  const isCorrect = ua === q.correctAnswer;
                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-lg border text-xs ${
                        isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">{idx + 1}. {q.question}</p>
                          <p className="text-muted-foreground mt-0.5">Jawaban: {q.options[q.correctAnswer]}</p>
                          {!isCorrect && ua !== undefined && (
                            <p className="text-red-600 mt-0.5">Anda: {q.options[ua]}</p>
                          )}
                          <p className="mt-1 text-muted-foreground">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button onClick={resetQuiz} className="w-full" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" /> Kuis Baru
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Active quiz
  return (
    <section className="py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-xs">
                Soal {currentQuestion + 1}/{questions.length}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  difficulty === "mudah"
                    ? "border-emerald-500 text-emerald-600"
                    : difficulty === "sedang"
                    ? "border-amber-500 text-amber-600"
                    : "border-red-500 text-red-600"
                }`}
              >
                {DIFFICULTIES.find((d) => d.value === difficulty)?.label}
              </Badge>
            </div>
            <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-1.5" />
          </CardHeader>
          <CardContent className="space-y-4">
            <h4 className="text-sm font-semibold leading-relaxed">
              {questions[currentQuestion]?.question}
            </h4>

            <RadioGroup
              value={selectedAnswer?.toString()}
              onValueChange={(v) => setSelectedAnswer(parseInt(v))}
              className="space-y-2"
            >
              {questions[currentQuestion]?.options.map((option, idx) => (
                <div
                  key={idx}
                  className={`flex items-center space-x-2 p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                    selectedAnswer === idx
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedAnswer(idx)}
                >
                  <RadioGroupItem value={idx.toString()} id={`home-q-${idx}`} />
                  <Label htmlFor={`home-q-${idx}`} className="flex-1 cursor-pointer font-normal text-xs">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetQuiz} className="flex-1" size="sm">
                Keluar
              </Button>
              <Button onClick={handleAnswer} className="flex-1" size="sm" disabled={selectedAnswer === null}>
                {currentQuestion < questions.length - 1 ? (
                  <>Lanjut <ArrowRight className="w-3 h-3 ml-1" /></>
                ) : (
                  "Lihat Hasil"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
