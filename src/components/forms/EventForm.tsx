import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

const eventSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(100, "Judul maksimal 100 karakter").trim(),
  description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional().or(z.literal("")),
  event_date: z.date({ required_error: "Tanggal kegiatan wajib diisi" }),
  event_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format waktu tidak valid").optional().or(z.literal("")),
  location: z.string().max(255, "Lokasi maksimal 255 karakter").optional().or(z.literal("")),
  is_recurring: z.boolean().default(false),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: Event;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function EventForm({ event, onSuccess, trigger }: EventFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEdit = !!event;

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      event_time: "",
      location: "",
      is_recurring: false,
    },
  });

  useEffect(() => {
    if (event && open) {
      form.reset({
        title: event.title,
        description: event.description || "",
        event_date: new Date(event.event_date),
        event_time: event.event_time || "",
        location: event.location || "",
        is_recurring: event.is_recurring || false,
      });
    } else if (!event && open) {
      form.reset({
        title: "",
        description: "",
        event_time: "",
        location: "",
        is_recurring: false,
      });
    }
  }, [event, open, form]);

  const onSubmit = async (data: EventFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (isEdit && event) {
        const { error } = await supabase
          .from("events")
          .update({
            title: data.title.trim(),
            description: data.description?.trim() || null,
            event_date: format(data.event_date, "yyyy-MM-dd"),
            event_time: data.event_time || null,
            location: data.location?.trim() || null,
            is_recurring: data.is_recurring,
          })
          .eq("id", event.id);

        if (error) throw error;

        toast({ title: "Berhasil!", description: "Kegiatan berhasil diperbarui." });
      } else {
        const { error } = await supabase.from("events").insert({
          title: data.title.trim(),
          description: data.description?.trim() || null,
          event_date: format(data.event_date, "yyyy-MM-dd"),
          event_time: data.event_time || null,
          location: data.location?.trim() || null,
          is_recurring: data.is_recurring,
          created_by: user?.id || null,
        });

        if (error) throw error;

        toast({ title: "Berhasil!", description: "Kegiatan baru berhasil ditambahkan." });
      }

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast({ title: "Gagal", description: error.message || "Gagal menyimpan kegiatan.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            {isEdit ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">{isEdit ? "Edit" : "Tambah Kegiatan"}</span>
            <span className="sm:hidden">{isEdit ? "Edit" : "Tambah"}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}</DialogTitle>
          <DialogDescription>{isEdit ? "Perbarui detail kegiatan." : "Isi detail kegiatan komunitas."}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Kegiatan *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Pengajian Rutin Bulanan" {...field} />
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
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsi kegiatan..." className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waktu</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasi</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Masjid Al-Ikhlas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_recurring"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Kegiatan Rutin</FormLabel>
                    <p className="text-sm text-muted-foreground">Kegiatan berulang secara berkala</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Batal</Button>
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