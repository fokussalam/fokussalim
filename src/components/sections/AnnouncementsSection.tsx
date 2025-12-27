import { Calendar, ArrowRight, Bell, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AnnouncementsSection = () => {
  const announcements = [
    {
      type: "Penting",
      title: "Pendaftaran Santri Baru TA 2025/2026",
      description: "Pendaftaran santri baru untuk tahun ajaran 2025/2026 telah dibuka. Kuota terbatas, segera daftarkan putra-putri Anda.",
      date: "27 Desember 2024",
      isNew: true,
    },
    {
      type: "Jadwal",
      title: "Ujian Semester Ganjil",
      description: "Ujian semester ganjil akan dilaksanakan pada tanggal 15-20 Januari 2025. Persiapkan diri dengan baik.",
      date: "20 Desember 2024",
      isNew: true,
    },
    {
      type: "Kegiatan",
      title: "Wisuda Tahfidz Juz 30",
      description: "Acara wisuda bagi santri yang telah menyelesaikan hafalan Juz 30 akan diselenggarakan pada akhir bulan.",
      date: "18 Desember 2024",
      isNew: false,
    },
  ];

  const schedules = [
    { day: "Senin - Kamis", time: "Pagi: 08:00 - 11:00", session: "Sesi Reguler" },
    { day: "Senin - Kamis", time: "Sore: 15:30 - 17:30", session: "Sesi Sore" },
    { day: "Jumat", time: "08:00 - 10:00", session: "Tahfidz Intensif" },
    { day: "Sabtu - Ahad", time: "08:00 - 12:00", session: "Kelas Weekend" },
  ];

  return (
    <section id="pengumuman" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Announcements */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                  Info Terbaru
                </span>
                <h2 className="text-3xl font-bold text-foreground">Pengumuman</h2>
              </div>
              <Button variant="ghost" className="hidden md:flex items-center gap-2">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {announcements.map((item, index) => (
                <Card 
                  key={index} 
                  className="group cursor-pointer border-l-4 border-l-transparent hover:border-l-primary transition-all duration-300 hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {item.type}
                            </span>
                            {item.isNew && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                                Baru
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {item.title}
                          </CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base mb-3">
                      {item.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {item.date}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-6 md:hidden">
              Lihat Semua Pengumuman
            </Button>
          </div>

          {/* Schedule */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-2">
                Jadwal Kegiatan
              </span>
              <h2 className="text-3xl font-bold text-foreground">Waktu Belajar</h2>
            </div>

            <Card className="bg-card border-0 shadow-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary via-accent to-secondary" />
              <CardContent className="p-6">
                <div className="space-y-4">
                  {schedules.map((schedule, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{schedule.day}</h4>
                        <p className="text-sm text-muted-foreground">{schedule.time}</p>
                        <span className="text-xs text-primary font-medium">{schedule.session}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground text-center">
                    Jadwal dapat berubah sewaktu-waktu. Hubungi admin untuk informasi lebih lanjut.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnnouncementsSection;
