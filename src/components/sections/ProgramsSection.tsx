import { BookOpen, Heart, Mic2, Clock, Users, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ProgramsSection = () => {
  const programs = [
    {
      icon: BookOpen,
      title: "Tahsin",
      subtitle: "Perbaikan Bacaan",
      description: "Program perbaikan bacaan Al-Qur'an dengan metode yang mudah dipahami untuk semua usia.",
      features: [
        "Pembelajaran Tajwid lengkap",
        "Koreksi makhraj huruf",
        "Latihan intensif harian",
        "Evaluasi berkala",
      ],
      color: "primary",
    },
    {
      icon: Mic2,
      title: "Tahfidz",
      subtitle: "Hafalan Al-Qur'an",
      description: "Program menghafal Al-Qur'an dengan bimbingan ustadz berpengalaman dan metode terstruktur.",
      features: [
        "Target hafalan terukur",
        "Muroja'ah rutin",
        "Setoran harian",
        "Sertifikat tahfidz",
      ],
      color: "secondary",
    },
    {
      icon: Heart,
      title: "Akhlak",
      subtitle: "Pembinaan Karakter",
      description: "Pembinaan akhlak dan karakter islami untuk membentuk kepribadian yang mulia.",
      features: [
        "Adab & etika islami",
        "Kegiatan sosial",
        "Mentoring personal",
        "Praktik ibadah",
      ],
      color: "accent",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "primary":
        return {
          iconBg: "bg-primary/10",
          icon: "text-primary",
          badge: "bg-primary/10 text-primary",
        };
      case "secondary":
        return {
          iconBg: "bg-secondary/10",
          icon: "text-secondary",
          badge: "bg-secondary/10 text-secondary",
        };
      case "accent":
        return {
          iconBg: "bg-accent/10",
          icon: "text-accent",
          badge: "bg-accent/10 text-accent",
        };
      default:
        return {
          iconBg: "bg-primary/10",
          icon: "text-primary",
          badge: "bg-primary/10 text-primary",
        };
    }
  };

  return (
    <section id="program" className="py-24 bg-muted/30 islamic-pattern">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Program Unggulan
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tiga Pilar Pembelajaran
          </h2>
          <p className="text-muted-foreground text-lg">
            Pendekatan holistik dalam pendidikan Al-Qur'an yang mengintegrasikan
            bacaan, hafalan, dan pembentukan karakter.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {programs.map((program, index) => {
            const colors = getColorClasses(program.color);
            return (
              <Card
                key={index}
                className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card"
              >
                {/* Decorative Top Bar */}
                <div className={`h-1 ${program.color === "primary" ? "bg-primary" : program.color === "secondary" ? "bg-secondary" : "bg-accent"}`} />
                
                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-xl ${colors.iconBg} flex items-center justify-center mb-4`}>
                    <program.icon className={`w-7 h-7 ${colors.icon}`} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{program.title}</CardTitle>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {program.subtitle}
                    </span>
                  </div>
                  <CardDescription className="text-base">
                    {program.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {program.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CheckCircle className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">
                    Selengkapnya
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 text-center">
          {[
            { icon: Clock, label: "Jadwal Fleksibel", desc: "Pagi, Sore & Malam" },
            { icon: Users, label: "Kelas Kecil", desc: "Maksimal 15 santri/kelas" },
            { icon: CheckCircle, label: "Bersertifikat", desc: "Sertifikat resmi lembaga" },
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center gap-2 p-6 rounded-xl bg-card shadow-sm">
              <item.icon className="w-8 h-8 text-primary mb-2" />
              <h4 className="font-semibold text-foreground">{item.label}</h4>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
