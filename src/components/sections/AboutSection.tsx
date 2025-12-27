import { Target, Eye, Award, Users } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="profil" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Tentang Kami
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Lembaga Pendidikan Al-Qur'an
              <span className="text-primary"> Terpercaya</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Taman Qur'an hadir sebagai wadah pendidikan Al-Qur'an yang berfokus pada 
              pembentukan generasi yang tidak hanya fasih membaca dan menghafal Al-Qur'an, 
              tetapi juga mengamalkannya dalam kehidupan sehari-hari.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Vision */}
              <div className="p-6 rounded-xl bg-card shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Visi</h3>
                <p className="text-sm text-muted-foreground">
                  Menjadi lembaga pendidikan Al-Qur'an terdepan dalam mencetak generasi Qur'ani yang berakhlak mulia.
                </p>
              </div>

              {/* Mission */}
              <div className="p-6 rounded-xl bg-card shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Misi</h3>
                <p className="text-sm text-muted-foreground">
                  Menyelenggarakan pendidikan Al-Qur'an berkualitas dengan metode modern dan bimbingan yang profesional.
                </p>
              </div>
            </div>
          </div>

          {/* Right Content - Stats & Achievements */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl blur-2xl" />
            <div className="relative bg-card rounded-2xl shadow-xl p-8 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-8 text-center">
                Pencapaian Kami
              </h3>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: "500+", label: "Santri Aktif", icon: Users },
                  { value: "30+", label: "Ustadz/Ustadzah", icon: Award },
                  { value: "15+", label: "Tahun Berdiri", icon: Target },
                  { value: "1000+", label: "Alumni", icon: Award },
                ].map((stat, index) => (
                  <div 
                    key={index} 
                    className="text-center p-6 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">SK Terdaftar:</span> Kemenag RI No. XXX/2010
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
