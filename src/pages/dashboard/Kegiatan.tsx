import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { EventForm } from "@/components/forms/EventForm";
import { DeleteDialog } from "@/components/forms/DeleteDialog";
import { Calendar, Clock, MapPin, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

export default function Kegiatan() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdminOrPengurus } = useUserRole();
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    if (error) console.error("Error fetching events:", error);
    else setEvents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
        </div>
      </DashboardLayout>
    </>
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