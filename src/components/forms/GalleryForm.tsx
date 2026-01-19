import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

const formSchema = z.object({
  title: z.string().optional(),
  sort_order: z.coerce.number().min(0).default(0),
});

type FormData = z.infer<typeof formSchema>;

interface GalleryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    title: string | null;
    image_url: string;
    sort_order: number;
  } | null;
  onSuccess: () => void;
}

export function GalleryForm({ open, onOpenChange, editData, onSuccess }: GalleryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(editData?.image_url || "");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editData?.title || "",
      sort_order: editData?.sort_order || 0,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Gagal mengupload gambar");
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("gallery")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: FormData) => {
    if (!editData && !imageFile) {
      toast.error("Silakan pilih gambar terlebih dahulu");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = editData?.image_url || "";

      if (imageFile) {
        setIsUploading(true);
        const uploadedUrl = await uploadImage(imageFile);
        setIsUploading(false);
        
        if (!uploadedUrl) {
          setIsSubmitting(false);
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      if (editData) {
        const { error } = await supabase
          .from("gallery_images")
          .update({
            title: data.title || null,
            image_url: finalImageUrl,
            sort_order: data.sort_order,
          })
          .eq("id", editData.id);

        if (error) throw error;
        toast.success("Gambar galeri berhasil diperbarui");
      } else {
        const { error } = await supabase.from("gallery_images").insert({
          title: data.title || null,
          image_url: finalImageUrl,
          sort_order: data.sort_order,
        });

        if (error) throw error;
        toast.success("Gambar galeri berhasil ditambahkan");
      }

      form.reset();
      setImageUrl("");
      setImageFile(null);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving gallery image:", error);
      toast.error(error.message || "Gagal menyimpan gambar galeri");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setImageUrl(editData?.image_url || "");
    setImageFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Edit Gambar Galeri" : "Tambah Gambar Galeri"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Gambar {!editData && "*"}</FormLabel>
              <div className="flex flex-col gap-3">
                {imageUrl && (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => {
                        setImageUrl("");
                        setImageFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <label className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {imageUrl ? "Ganti Gambar" : "Upload Gambar"}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Deskripsi gambar" {...field} />
                  </FormControl>
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
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? "Mengupload..." : editData ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
