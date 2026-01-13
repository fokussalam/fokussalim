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
import { UserPlus, Pencil, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const memberSchema = z.object({
  full_name: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .trim(),
  phone: z
    .string()
    .regex(/^(\+62|62|0)?[0-9]{9,12}$/, "Format nomor telepon tidak valid")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(255, "Alamat maksimal 255 karakter")
    .optional()
    .or(z.literal("")),
  status: z.enum(["aktif", "tidak_aktif", "pending"]),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  member?: Profile;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function MemberForm({ member, onSuccess, trigger }: MemberFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEdit = !!member;

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      address: "",
      status: "aktif",
    },
  });

  useEffect(() => {
    if (member && open) {
      form.reset({
        full_name: member.full_name,
        phone: member.phone || "",
        address: member.address || "",
        status: member.status,
      });
    } else if (!member && open) {
      form.reset({
        full_name: "",
        phone: "",
        address: "",
        status: "aktif",
      });
    }
  }, [member, open, form]);

  const onSubmit = async (data: MemberFormData) => {
    setLoading(true);
    try {
      if (isEdit && member) {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: data.full_name.trim(),
            phone: data.phone?.trim() || null,
            address: data.address?.trim() || null,
            status: data.status,
          })
          .eq("id", member.id);

        if (error) throw error;

        toast({
          title: "Berhasil!",
          description: "Data anggota berhasil diperbarui.",
        });
      } else {
        const { error } = await supabase.from("profiles").insert({
          full_name: data.full_name.trim(),
          phone: data.phone?.trim() || null,
          address: data.address?.trim() || null,
          status: data.status,
          user_id: crypto.randomUUID(),
          join_date: new Date().toISOString().split("T")[0],
        });

        if (error) throw error;

        toast({
          title: "Berhasil!",
          description: "Anggota baru berhasil ditambahkan.",
        });
      }

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving member:", error);
      toast({
        title: "Gagal",
        description: error.message || "Gagal menyimpan data anggota.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            {isEdit ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span className="hidden sm:inline">{isEdit ? "Edit" : "Tambah Anggota"}</span>
            <span className="sm:hidden">{isEdit ? "Edit" : "Tambah"}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Anggota" : "Tambah Anggota Baru"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui data anggota." : "Isi data anggota baru komunitas."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap *</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama lengkap" {...field} autoComplete="name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Telepon</FormLabel>
                  <FormControl>
                    <Input placeholder="08xxxxxxxxxx" type="tel" {...field} autoComplete="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Masukkan alamat" className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
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