import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { Users, Calendar, Wallet, ArrowRight, Heart, BookOpen, Handshake } from "lucide-react";
import logoSalim from "@/assets/logo-salim.png";

const Index = () => {
  const features = [
    {
      icon: Users,
      title: "Manajemen Anggota",
      description: "Kelola data anggota komunitas dengan mudah dan terorganisir.",
    },
    {
      icon: Calendar,
      title: "Jadwal Kegiatan",
      description: "Atur dan pantau jadwal kegiatan pengajian dan pertemuan.",
    },
    {
      icon: Wallet,
      title: "Keuangan & Iuran",
      description: "Catat pemasukan, pengeluaran, dan iuran bulanan anggota.",
    },
  ];

  const values = [
    {
      icon: BookOpen,
      title: "Pengajian Rutin",
      description: "Kajian Al-Quran dan ilmu agama secara berkala.",
    },
    {
      icon: Handshake,
      title: "Silaturahmi",
      description: "Mempererat tali persaudaraan antar anggota.",
    },
    {
      icon: Heart,
      title: "Kebersamaan",
      description: "Saling mendukung dalam kebaikan.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Salim - Aplikasi Komunitas Pengajian</title>
        <meta
          name="description"
          content="Salim adalah aplikasi untuk mengelola komunitas pengajian dengan fitur manajemen anggota, jadwal kegiatan, dan keuangan."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logoSalim} alt="Salim" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="font-bold text-lg text-primary">Salim</h1>
                <p className="text-xs text-muted-foreground">Komunitas Pengajian</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Masuk</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Daftar</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <img
                src={logoSalim}
                alt="Salim Logo"
                className="w-24 h-24 mx-auto mb-8 object-contain"
              />
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
                Selamat Datang di{" "}
                <span className="text-primary">Salim</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Aplikasi untuk mengelola kegiatan komunitas pengajian Anda. 
                Kelola anggota, jadwal kegiatan, dan keuangan dengan mudah dalam satu platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/register">
                    Mulai Sekarang
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Masuk ke Akun</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Fitur Utama</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Semua yang Anda butuhkan untuk mengelola komunitas pengajian dalam satu aplikasi.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {features.map((feature) => (
                <Card key={feature.title} className="card-hover text-center">
                  <CardHeader>
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Tentang Kami</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Salim hadir untuk memfasilitasi komunitas pengajian dalam menjalankan kegiatan keagamaan.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {values.map((value) => (
                <div key={value.title} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Siap Bergabung dengan Kami?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Daftar sekarang dan mulai kelola komunitas pengajian Anda dengan lebih baik.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">
                Daftar Gratis
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={logoSalim} alt="Salim" className="w-8 h-8 object-contain" />
                <span className="font-semibold text-primary">Salim</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2024 Salim - Komunitas Pengajian. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
