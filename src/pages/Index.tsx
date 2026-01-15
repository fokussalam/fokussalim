import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { 
  Users, Calendar, Wallet, ArrowRight, Heart, BookOpen, Handshake, 
  Star, Award, Target, Lightbulb, Shield, Zap, Pencil, Trash2, Plus 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { HomepageContentForm } from "@/components/forms/HomepageContentForm";
import { DeleteDialog } from "@/components/forms/DeleteDialog";
import logoSalim from "@/assets/logo-salim.png";

interface HomepageContent {
  id: string;
  section: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Calendar, Wallet, Heart, BookOpen, Handshake, Star, Award, Target, Lightbulb, Shield, Zap,
};

const Index = () => {
  const [features, setFeatures] = useState<HomepageContent[]>([]);
  const [values, setValues] = useState<HomepageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdminOrPengurus } = useUserRole();
  const { toast } = useToast();

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("homepage_content")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Error fetching content:", error);
    } else if (data) {
      setFeatures(data.filter((item) => item.section === "features"));
      setValues(data.filter((item) => item.section === "values"));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("homepage_content").delete().eq("id", id);
    if (error) {
      toast({ title: "Gagal", description: "Gagal menghapus konten.", variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Konten berhasil dihapus." });
      fetchContent();
    }
  };

  const getIcon = (iconName: string) => iconMap[iconName] || Star;

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
            <div className="flex items-center justify-between mb-12">
              <div className="text-center flex-1">
                <h2 className="text-3xl font-bold mb-4">Fitur Utama</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Semua yang Anda butuhkan untuk mengelola komunitas pengajian dalam satu aplikasi.
                </p>
              </div>
              {isAdminOrPengurus && (
                <HomepageContentForm defaultSection="features" onSuccess={fetchContent} />
              )}
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="text-center">
                      <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-4" />
                      <div className="h-6 w-32 bg-muted rounded mx-auto" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 w-full bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : features.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Belum ada fitur yang ditambahkan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {features.map((feature) => {
                  const IconComponent = getIcon(feature.icon);
                  return (
                    <Card key={feature.id} className="card-hover text-center relative group">
                      {isAdminOrPengurus && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <HomepageContentForm
                            content={feature}
                            onSuccess={fetchContent}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <DeleteDialog
                            title="Hapus Konten?"
                            description={`Konten "${feature.title}" akan dihapus secara permanen.`}
                            onDelete={() => handleDelete(feature.id)}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            }
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <IconComponent className="w-7 h-7 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div className="text-center flex-1">
                <h2 className="text-3xl font-bold mb-4">Tentang Kami</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Salim hadir untuk memfasilitasi komunitas pengajian dalam menjalankan kegiatan keagamaan.
                </p>
              </div>
              {isAdminOrPengurus && (
                <HomepageContentForm defaultSection="values" onSuccess={fetchContent} />
              )}
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse text-center">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4" />
                    <div className="h-5 w-24 bg-muted rounded mx-auto mb-2" />
                    <div className="h-4 w-32 bg-muted rounded mx-auto" />
                  </div>
                ))}
              </div>
            ) : values.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Belum ada nilai yang ditambahkan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {values.map((value) => {
                  const IconComponent = getIcon(value.icon);
                  return (
                    <div key={value.id} className="text-center relative group">
                      {isAdminOrPengurus && (
                        <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <HomepageContentForm
                            content={value}
                            onSuccess={fetchContent}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <DeleteDialog
                            title="Hapus Konten?"
                            description={`Konten "${value.title}" akan dihapus secara permanen.`}
                            onDelete={() => handleDelete(value.id)}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            }
                          />
                        </div>
                      )}
                      <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-8 h-8 text-secondary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
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
