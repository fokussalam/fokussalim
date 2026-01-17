import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Loader2 } from "lucide-react";

const contentSchema = z.object({
  section: z.enum(["features", "values", "programs", "quotes", "articles"], { required_error: "Pilih section" }),
  title: z.string().min(1, "Judul wajib diisi").max(100, "Maksimal 100 karakter"),
  description: z.string().min(1, "Deskripsi wajib diisi").max(255, "Maksimal 255 karakter"),
  icon: z.string().min(1, "Icon wajib diisi"),
  sort_order: z.number().min(0, "Urutan minimal 0"),
});

type ContentFormData = z.infer<typeof contentSchema>;

interface HomepageContent {
  id: string;
  section: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface HomepageContentFormProps {
  content?: HomepageContent;
  defaultSection?: "features" | "values" | "programs" | "quotes" | "articles";
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const iconOptions = [
  { value: "BookOpen", label: "BookOpen (Kajian)" },
  { value: "MessageCircle", label: "MessageCircle (Konsultasi)" },
  { value: "BookMarked", label: "BookMarked (Tahsin)" },
  { value: "Heart", label: "Heart (Sosial)" },
  { value: "Users", label: "Users (Anggota)" },
  { value: "Calendar", label: "Calendar (Jadwal)" },
  { value: "Wallet", label: "Wallet (Keuangan)" },
  { value: "Handshake", label: "Handshake (Jabat Tangan)" },
  { value: "Star", label: "Star (Bintang)" },
  { value: "Award", label: "Award (Penghargaan)" },
  { value: "Target", label: "Target" },
  { value: "Lightbulb", label: "Lightbulb (Ide)" },
  { value: "Shield", label: "Shield (Pelindung)" },
  { value: "Zap", label: "Zap (Kilat)" },
];

export function HomepageContentForm({ content, defaultSection, onSuccess, trigger }: HomepageContentFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEdit = !!content;

  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      section: defaultSection || "programs",
      title: "",
      description: "",
      icon: "Star",
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (content && open) {
      form.reset({
        section: content.section as "features" | "values" | "programs" | "quotes" | "articles",
        title: content.title,
        description: content.description,
        icon: content.icon,
        sort_order: content.sort_order,
      });
    } else if (!content && open) {
      form.reset({
        section: defaultSection || "programs",
        title: "",
        description: "",
        icon: "Star",
        sort_order: 0,
      });
    }
  }, [content, open, form, defaultSection]);

  const onSubmit = async (data: ContentFormData) => {
    setLoading(true);
    try {
      if (isEdit && content) {
        const { error } = await supabase
          .from("homepage_content")
          .update({
            section: data.section,
            title: data.title,
            description: data.description,
            icon: data.icon,
            sort_order: data.sort_order,
          })
          .eq("id", content.id);

        if (error) throw error;
        toast({ title: "Berhasil!", description: "Konten berhasil diperbarui." });
      } else {
        const { error } = await supabase.from("homepage_content").insert({
          section: data.section,
          title: data.title,
          description: data.description,
          icon: data.icon,
          sort_order: data.sort_order,
        });

        if (error) throw error;
        toast({ title: "Berhasil!", description: "Konten berhasil ditambahkan." });
      }

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving content:", error);
      toast({ title: "Gagal", description: error.message || "Gagal menyimpan konten.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            {isEdit ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isEdit ? "Edit" : "Tambah"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Konten" : "Tambah Konten"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui konten beranda." : "Tambahkan konten baru ke beranda."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="programs">Program Utama</SelectItem>
                      <SelectItem value="quotes">Quote Islami</SelectItem>
                      <SelectItem value="articles">Artikel</SelectItem>
                      <SelectItem value="features">Fitur Utama</SelectItem>
                      <SelectItem value="values">Tentang Kami</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul *</FormLabel>
                  <FormControl>
                    <Input placeholder="Judul konten" {...field} />
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
                  <FormLabel>Deskripsi *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsi konten..." className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih icon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urutan</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
