import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  contact_address_1: z.string().min(1, "Wajib diisi"),
  contact_address_2: z.string().min(1, "Wajib diisi"),
  contact_address_3: z.string().min(1, "Wajib diisi"),
  contact_phone_1: z.string().min(1, "Wajib diisi"),
  contact_phone_2: z.string().optional(),
  contact_email_1: z.string().email("Email tidak valid"),
  contact_email_2: z.string().email("Email tidak valid").optional().or(z.literal("")),
  contact_hours_1: z.string().min(1, "Wajib diisi"),
  contact_hours_2: z.string().optional(),
  whatsapp_number: z.string().min(1, "Wajib diisi"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface ContactSettingsFormProps {
  onSuccess?: () => void;
}

const ContactSettingsForm = ({ onSuccess }: ContactSettingsFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      contact_address_1: "",
      contact_address_2: "",
      contact_address_3: "",
      contact_phone_1: "",
      contact_phone_2: "",
      contact_email_1: "",
      contact_email_2: "",
      contact_hours_1: "",
      contact_hours_2: "",
      whatsapp_number: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((item) => {
          settingsMap[item.key] = item.value;
        });

        form.reset({
          contact_address_1: settingsMap.contact_address_1 || "",
          contact_address_2: settingsMap.contact_address_2 || "",
          contact_address_3: settingsMap.contact_address_3 || "",
          contact_phone_1: settingsMap.contact_phone_1 || "",
          contact_phone_2: settingsMap.contact_phone_2 || "",
          contact_email_1: settingsMap.contact_email_1 || "",
          contact_email_2: settingsMap.contact_email_2 || "",
          contact_hours_1: settingsMap.contact_hours_1 || "",
          contact_hours_2: settingsMap.contact_hours_2 || "",
          whatsapp_number: settingsMap.whatsapp_number || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Gagal memuat pengaturan",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    setLoading(true);
    try {
      const updates = Object.entries(data).map(([key, value]) => ({
        key,
        value: value || "",
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: update.value })
          .eq("key", update.key);

        if (error) throw error;
      }

      toast({
        title: "Berhasil",
        description: "Pengaturan kontak berhasil diperbarui",
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui pengaturan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Edit Kontak
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Informasi Kontak</DialogTitle>
        </DialogHeader>
        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Alamat */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Alamat</h4>
                <FormField
                  control={form.control}
                  name="contact_address_1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Baris 1</FormLabel>
                      <FormControl>
                        <Input placeholder="Jl. Pendidikan No. 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_address_2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Baris 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Kelurahan, Kecamatan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_address_3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Baris 3</FormLabel>
                      <FormControl>
                        <Input placeholder="Kota, Kode Pos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Telepon */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Telepon</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_phone_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telepon 1</FormLabel>
                        <FormControl>
                          <Input placeholder="+62 812-xxxx-xxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_phone_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telepon 2 (Opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+62 21-xxxxxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Email</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_email_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email 1</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@domain.id" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_email_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email 2 (Opsional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="pendaftaran@domain.id" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Jam Operasional */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Jam Operasional</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_hours_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jam Operasional 1</FormLabel>
                        <FormControl>
                          <Input placeholder="Senin - Jumat: 08:00 - 17:00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_hours_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jam Operasional 2 (Opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Sabtu: 08:00 - 12:00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">WhatsApp Admin</h4>
                <FormField
                  control={form.control}
                  name="whatsapp_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor WhatsApp (tanpa +)</FormLabel>
                      <FormControl>
                        <Input placeholder="6281234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactSettingsForm;
