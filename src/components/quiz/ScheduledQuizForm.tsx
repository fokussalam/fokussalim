import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

const questionSchema = z.object({
  question: z.string().min(1, "Pertanyaan wajib diisi"),
  options: z.array(z.string().min(1)).min(2, "Minimal 2 opsi jawaban"),
  correct_answer: z.string().min(1, "Jawaban benar wajib diisi"),
  explanation: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, "Judul kuis wajib diisi"),
  description: z.string().optional(),
  duration_minutes: z.number().min(1, "Durasi minimal 1 menit").max(180, "Durasi maksimal 180 menit"),
  is_active: z.boolean(),
  questions: z.array(questionSchema).min(1, "Minimal 1 pertanyaan"),
});

type FormData = z.infer<typeof formSchema>;

interface ScheduledQuizFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: {
    id: string;
    title: string;
    description: string | null;
    duration_minutes: number;
    is_active: boolean;
    questions: Array<{
      id?: string;
      question: string;
      options: string[];
      correct_answer: string;
      explanation?: string;
    }>;
  };
}

export function ScheduledQuizForm({ open, onOpenChange, onSuccess, editData }: ScheduledQuizFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: editData
      ? {
          title: editData.title,
          description: editData.description || "",
          duration_minutes: editData.duration_minutes,
          is_active: editData.is_active,
          questions: editData.questions.map((q) => ({
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation || "",
          })),
        }
      : {
          title: "",
          description: "",
          duration_minutes: 30,
          is_active: false,
          questions: [
            { question: "", options: ["", "", "", ""], correct_answer: "", explanation: "" },
          ],
        },
  });

  const questions = form.watch("questions");

  const addQuestion = () => {
    const current = form.getValues("questions");
    form.setValue("questions", [
      ...current,
      { question: "", options: ["", "", "", ""], correct_answer: "", explanation: "" },
    ]);
  };

  const removeQuestion = (index: number) => {
    const current = form.getValues("questions");
    if (current.length > 1) {
      form.setValue(
        "questions",
        current.filter((_, i) => i !== index)
      );
    }
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const current = form.getValues("questions");
    current[qIndex].options[oIndex] = value;
    form.setValue("questions", current);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      if (editData) {
        // Update quiz
        const { error: quizError } = await supabase
          .from("scheduled_quizzes")
          .update({
            title: data.title,
            description: data.description,
            duration_minutes: data.duration_minutes,
            is_active: data.is_active,
          })
          .eq("id", editData.id);

        if (quizError) throw quizError;

        // Delete existing questions and re-insert
        await supabase.from("quiz_questions").delete().eq("quiz_id", editData.id);

        const questionsToInsert = data.questions.map((q, index) => ({
          quiz_id: editData.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          sort_order: index,
        }));

        const { error: questionsError } = await supabase
          .from("quiz_questions")
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;

        toast({ title: "Berhasil", description: "Kuis berhasil diperbarui" });
      } else {
        // Create new quiz
        const { data: quiz, error: quizError } = await supabase
          .from("scheduled_quizzes")
          .insert({
            title: data.title,
            description: data.description,
            duration_minutes: data.duration_minutes,
            is_active: data.is_active,
            created_by: userData.user.id,
          })
          .select()
          .single();

        if (quizError) throw quizError;

        const questionsToInsert = data.questions.map((q, index) => ({
          quiz_id: quiz.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          sort_order: index,
        }));

        const { error: questionsError } = await supabase
          .from("quiz_questions")
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;

        toast({ title: "Berhasil", description: "Kuis berhasil dibuat" });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan kuis",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Kuis" : "Buat Kuis Baru"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Kuis</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan judul kuis..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsi kuis..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Durasi (menit)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={180}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Status Aktif</FormLabel>
                    <div className="flex items-center gap-2 pt-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">
                        {field.value ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Pertanyaan</h3>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Pertanyaan
                </Button>
              </div>

              {questions.map((_, qIndex) => (
                <div key={qIndex} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Pertanyaan {qIndex + 1}</span>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`questions.${qIndex}.question`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pertanyaan</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tulis pertanyaan..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((oIndex) => (
                      <div key={oIndex}>
                        <label className="text-sm text-muted-foreground">Opsi {oIndex + 1}</label>
                        <Input
                          placeholder={`Opsi ${oIndex + 1}`}
                          value={questions[qIndex]?.options[oIndex] || ""}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <FormField
                    control={form.control}
                    name={`questions.${qIndex}.correct_answer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jawaban Benar</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan jawaban yang benar..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`questions.${qIndex}.explanation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Penjelasan (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Penjelasan jawaban..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editData ? "Simpan Perubahan" : "Buat Kuis"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
