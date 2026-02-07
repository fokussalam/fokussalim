import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { EventForm } from "@/components/forms/EventForm";
import { DeleteDialog } from "@/components/forms/DeleteDialog";
import { Calendar, Clock, MapPin, CalendarDays, Pencil, Trash2, Users, ExternalLink, Settings, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

export default function Kegiatan() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [waGroupLink, setWaGroupLink] = useState("");
  const [loadingWa, setLoadingWa] = useState(true);
  const { isAdminOrPengurus } = useUserRole();
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    if (error) console.error("Error fetching events:", error);
    else setEvents(data || []);
    setLoading(false);
  }, []);

  const fetchWaGroupLink = useCallback(async () => {
    setLoadingWa(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "whatsapp_group_link")
      .single();
    
    if (error) {
      console.error("Error fetching WA group link:", error);
    } else {
      setWaGroupLink(data?.value || "");
    }
    setLoadingWa(false);
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchWaGroupLink();
  }, [fetchEvents, fetchWaGroupLink]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast({ title: "Gagal", description: "Gagal menghapus kegiatan.", variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Kegiatan berhasil dihapus." });
      fetchEvents();
    }
  };

  const isPastEvent = (date: string) => new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));

  const upcomingEvents = events.filter((e) => !isPastEvent(e.event_date));
  const pastEvents = events.filter((e) => isPastEvent(e.event_date));

  return (
    <>
      <Helmet><title>Jadwal Kegiatan - Salim | Komunitas Pengajian</title></Helmet>
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Jadwal Kegiatan</h1>
              <p className="text-sm text-muted-foreground">{upcomingEvents.length} kegiatan mendatang</p>
            </div>
            {isAdminOrPengurus && <EventForm onSuccess={fetchEvents} />}
          </div>

          <Tabs defaultValue="jadwal" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-xs">
              <TabsTrigger value="jadwal" className="gap-2">
                <CalendarDays className="w-4 h-4" />
                Jadwal
              </TabsTrigger>
              <TabsTrigger value="daftar" className="gap-2">
                <Users className="w-4 h-4" />
                Daftar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jadwal" className="mt-4">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader><div className="h-5 w-32 bg-muted rounded" /></CardHeader>
                      <CardContent className="space-y-3">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-4 w-20 bg-muted rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Belum Ada Kegiatan</h3>
                    <p className="text-muted-foreground mb-4">Tambahkan kegiatan pertama komunitas Anda.</p>
                    {isAdminOrPengurus && <EventForm onSuccess={fetchEvents} />}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {upcomingEvents.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />Kegiatan Mendatang
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcomingEvents.map((event) => (
                          <EventCard key={event.id} event={event} isPast={false} isAdminOrPengurus={isAdminOrPengurus} onEdit={fetchEvents} onDelete={() => handleDelete(event.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                  {pastEvents.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5" />Kegiatan Selesai
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pastEvents.slice(0, 6).map((event) => (
                          <EventCard key={event.id} event={event} isPast={true} isAdminOrPengurus={isAdminOrPengurus} onEdit={fetchEvents} onDelete={() => handleDelete(event.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="daftar" className="mt-4">
              <DaftarTab 
                waGroupLink={waGroupLink} 
                loading={loadingWa} 
                isAdminOrPengurus={isAdminOrPengurus}
                onUpdate={fetchWaGroupLink}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </>
  );
}

// Daftar Tab Component
function DaftarTab({ 
  waGroupLink, 
  loading, 
  isAdminOrPengurus,
  onUpdate 
}: { 
  waGroupLink: string; 
  loading: boolean;
  isAdminOrPengurus: boolean;
  onUpdate: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Bergabung dengan Grup Kegiatan
          </CardTitle>
          {isAdminOrPengurus && (
            <EditWaLinkDialog currentLink={waGroupLink} onSuccess={onUpdate} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : waGroupLink ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Bergabunglah dengan grup WhatsApp kami untuk mendapatkan informasi terbaru tentang kegiatan dan jadwal pengajian.
            </p>
            <Button 
              asChild 
              className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700"
            >
              <a href={waGroupLink} target="_blank" rel="noopener noreferrer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Gabung Grup WhatsApp
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Link Belum Tersedia</h3>
            <p className="text-muted-foreground">
              {isAdminOrPengurus 
                ? "Silakan tambahkan link grup WhatsApp dengan mengklik tombol edit di atas."
                : "Link grup WhatsApp belum diatur oleh admin."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Edit WA Link Dialog
function EditWaLinkDialog({ currentLink, onSuccess }: { currentLink: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState(currentLink);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLink(currentLink);
  }, [currentLink]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: link })
        .eq("key", "whatsapp_group_link");

      if (error) throw error;

      toast({ title: "Berhasil", description: "Link grup WhatsApp berhasil diperbarui." });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating WA link:", error);
      toast({ title: "Gagal", description: "Gagal memperbarui link.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings className="w-4 h-4" />
          Edit Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Link Grup WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wa-link">Link Grup WhatsApp</Label>
            <Input
              id="wa-link"
              placeholder="https://chat.whatsapp.com/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Masukkan link undangan grup WhatsApp (format: https://chat.whatsapp.com/...)
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EventCard({ event, isPast, isAdminOrPengurus, onEdit, onDelete }: { event: Event; isPast: boolean; isAdminOrPengurus: boolean; onEdit: () => void; onDelete: () => Promise<void> }) {
  return (
    <Card className={`card-hover ${isPast ? "opacity-70" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base sm:text-lg line-clamp-2">{event.title}</CardTitle>
          {isPast ? <Badge variant="secondary" className="text-xs flex-shrink-0">Selesai</Badge> : <Badge className="bg-primary text-xs flex-shrink-0">Mendatang</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {event.description && <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="truncate">{format(new Date(event.event_date), "EEEE, d MMM yyyy", { locale: id })}</span>
        </div>
        {event.event_time && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{event.event_time}</span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        {event.is_recurring && <Badge variant="outline" className="text-xs mt-2">Rutin</Badge>}
        
        {isAdminOrPengurus && (
          <div className="flex items-center gap-1 pt-2 border-t mt-3">
            <EventForm
              event={event}
              onSuccess={onEdit}
              trigger={
                <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                  <Pencil className="w-3.5 h-3.5" />Edit
                </Button>
              }
            />
            <DeleteDialog
              title="Hapus Kegiatan?"
              description={`Kegiatan "${event.title}" akan dihapus secara permanen.`}
              onDelete={onDelete}
              trigger={
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-3.5 h-3.5" />Hapus
                </Button>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
