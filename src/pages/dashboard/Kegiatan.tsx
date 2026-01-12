import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Calendar, Clock, MapPin, Plus } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

export default function Kegiatan() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdminOrPengurus } = useUserRole();

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const isPastEvent = (date: string) => {
    return new Date(date) < new Date();
  };

  return (
    <>
      <Helmet>
        <title>Jadwal Kegiatan - Salim | Komunitas Pengajian</title>
      </Helmet>

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Jadwal Kegiatan</h1>
              <p className="text-muted-foreground">
                Kelola jadwal kegiatan komunitas
              </p>
            </div>
            {isAdminOrPengurus && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Kegiatan
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Belum Ada Kegiatan</h3>
                <p className="text-muted-foreground mb-4">
                  Belum ada kegiatan yang dijadwalkan.
                </p>
                {isAdminOrPengurus && (
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Kegiatan Pertama
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className={`card-hover ${
                    isPastEvent(event.event_date) ? "opacity-60" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      {isPastEvent(event.event_date) ? (
                        <Badge variant="secondary">Selesai</Badge>
                      ) : (
                        <Badge className="bg-primary">Mendatang</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        {format(new Date(event.event_date), "EEEE, d MMMM yyyy", {
                          locale: id,
                        })}
                      </span>
                    </div>

                    {event.event_time && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{event.event_time}</span>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
