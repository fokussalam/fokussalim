import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { 
  Menu, X, BookOpen, MessageCircle, BookMarked, Heart,
  Calendar, MapPin, User, ChevronRight, ExternalLink,
  Phone, Instagram, Youtube, ArrowRight, Pencil, Plus, Trash2,
  Users, Wallet, Handshake, Star, Award, Target, Lightbulb, Shield, Zap, Image
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { HomepageContentForm } from "@/components/forms/HomepageContentForm";
import { GalleryForm } from "@/components/forms/GalleryForm";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Mobile Top Bar Component
const TopBar = ({ onMenuClick, isMenuOpen }: { onMenuClick: () => void; isMenuOpen: boolean }) => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border safe-area-top">
    <div className="flex items-center justify-between px-4 h-14">
      <h1 className="text-lg font-bold text-primary">Fokus Salim</h1>
      <button
        onClick={onMenuClick}
        className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Menu"
      >
        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
    </div>
  </header>
);

// Mobile Menu Component
const MobileMenu = ({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: any }) => {
  if (!isOpen) return null;

  const menuItems = [
    { label: "Beranda", href: "#beranda" },
    { label: "Program", href: "#program" },
    { label: "Jadwal", href: "#jadwal" },
    { label: "Konten", href: "#konten" },
    { label: "Galeri", href: "#galeri" },
  ];

  return (
    <div className="fixed inset-0 z-40 pt-14 bg-background animate-fade-in">
      <nav className="flex flex-col p-4 gap-1">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="px-4 py-3 text-base font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            {item.label}
          </a>
        ))}
        <div className="border-t border-border my-4" />
        {user ? (
          <Button asChild className="w-full">
            <Link to="/dashboard" onClick={onClose}>
              Dashboard
            </Link>
          </Button>
        ) : (
          <>
            <Button variant="outline" asChild className="w-full">
              <Link to="/login" onClick={onClose}>Masuk</Link>
            </Button>
            <Button asChild className="w-full mt-2">
              <Link to="/register" onClick={onClose}>Daftar</Link>
            </Button>
          </>
        )}
      </nav>
    </div>
  );
};

// Hero Section
const HeroSection = () => (
  <section id="beranda" className="pt-20 pb-10 px-4 bg-gradient-to-b from-primary/5 to-background">
    <div className="max-w-sm mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Fokus Salim</h2>
      <p className="text-muted-foreground mb-6">
        Komunitas dakwah & pembinaan umat
      </p>
      <Button size="lg" className="w-full max-w-xs" asChild>
        <Link to="/register">
          Gabung Komunitas
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>
    </div>
  </section>
);

// Icon mapping
const iconMap: Record<string, any> = {
  BookOpen, MessageCircle, BookMarked, Heart, Users, Calendar, Wallet,
  Handshake, Star, Award, Target, Lightbulb, Shield, Zap
};

// Homepage content interface
interface HomepageContent {
  id: string;
  section: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

// Program Grid (2x2)
const ProgramSection = ({ 
  isAdmin, 
  content,
  onRefresh 
}: { 
  isAdmin: boolean; 
  content: HomepageContent[];
  onRefresh: () => void;
}) => {
  const { toast } = useToast();
  const programs = content.filter(c => c.section === "programs");
  
  // Default programs if no content from DB
  const defaultPrograms = [
    { icon: "BookOpen", title: "Kajian Rutin", description: "Kajian mingguan" },
    { icon: "MessageCircle", title: "RKS", description: "Ruang Konsultasi" },
    { icon: "BookMarked", title: "Tahsin & Tahfizh", description: "Belajar Al-Qur'an" },
    { icon: "Heart", title: "Sosial", description: "Kegiatan amal" },
  ];

  const displayPrograms = programs.length > 0 
    ? programs.map(p => ({ ...p, icon: p.icon }))
    : defaultPrograms.map((p, i) => ({ 
        id: `default-${i}`, 
        section: "programs",
        title: p.title, 
        description: p.description, 
        icon: p.icon,
        sort_order: i,
        is_active: true
      }));

  const handleDelete = async (id: string) => {
    if (id.startsWith("default-")) return;
    const { error } = await supabase.from("homepage_content").delete().eq("id", id);
    if (error) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Konten dihapus" });
      onRefresh();
    }
  };

  return (
    <section id="program" className="py-8 px-4">
      <div className="flex items-center justify-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">Program Utama</h3>
        {isAdmin && (
          <HomepageContentForm 
            defaultSection="programs" 
            onSuccess={onRefresh}
            trigger={
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <Plus className="w-4 h-4" />
              </Button>
            }
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {displayPrograms.map((program) => {
          const IconComponent = iconMap[program.icon] || Star;
          return (
            <div
              key={program.id}
              className="bg-card rounded-xl p-4 text-center border border-border card-hover relative group"
            >
              {isAdmin && !program.id.startsWith("default-") && (
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <HomepageContentForm 
                    content={program}
                    onSuccess={onRefresh}
                    trigger={
                      <Button size="icon" variant="ghost" className="h-6 w-6">
                        <Pencil className="w-3 h-3" />
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus konten?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Konten "{program.title}" akan dihapus permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(program.id)}>
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-sm text-foreground">{program.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{program.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// Schedule Section
interface Event {
  id: string;
  title: string;
  event_date: string;
  location?: string;
  description?: string;
}

const ScheduleSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from("events")
        .select("id, title, event_date, location, description")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(3);
      
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <section id="jadwal" className="py-8 px-4 bg-muted/30">
      <div className="max-w-sm mx-auto">
        <h3 className="text-lg font-semibold mb-4 text-center">Jadwal Terdekat</h3>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            Belum ada jadwal kegiatan
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {formatDate(event.event_date)}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {event.title}
                    </h4>
                    {event.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs h-8">
                    Daftar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// Content Section (Quote + Article)
const ContentSection = ({ 
  isAdmin, 
  content,
  onRefresh 
}: { 
  isAdmin: boolean; 
  content: HomepageContent[];
  onRefresh: () => void;
}) => {
  const { toast } = useToast();
  const quotes = content.filter(c => c.section === "quotes");
  const articles = content.filter(c => c.section === "articles");

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("homepage_content").delete().eq("id", id);
    if (error) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Konten dihapus" });
      onRefresh();
    }
  };

  return (
    <section id="konten" className="py-8 px-4">
      <div className="max-w-sm mx-auto">
        <h3 className="text-lg font-semibold mb-4 text-center">Konten Terbaru</h3>
        
        {/* Quote */}
        <div className="relative group">
          {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <HomepageContentForm 
                defaultSection="quotes" 
                onSuccess={onRefresh}
                trigger={
                  <Button size="icon" variant="ghost" className="h-6 w-6 bg-background/80">
                    <Plus className="w-3 h-3" />
                  </Button>
                }
              />
            </div>
          )}
          {quotes.length > 0 ? (
            quotes.slice(0, 1).map(quote => (
              <div key={quote.id} className="bg-primary/5 rounded-xl p-5 mb-4 border border-primary/10 relative group">
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <HomepageContentForm 
                      content={quote}
                      onSuccess={onRefresh}
                      trigger={
                        <Button size="icon" variant="ghost" className="h-6 w-6 bg-background/80">
                          <Pencil className="w-3 h-3" />
                        </Button>
                      }
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-6 w-6 bg-background/80 text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus quote?</AlertDialogTitle>
                          <AlertDialogDescription>Quote ini akan dihapus permanen.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(quote.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                <p className="text-sm text-foreground italic leading-relaxed">
                  "{quote.description}"
                </p>
                <p className="text-xs text-muted-foreground mt-2">— {quote.title}</p>
              </div>
            ))
          ) : (
            <div className="bg-primary/5 rounded-xl p-5 mb-4 border border-primary/10">
              <p className="text-sm text-foreground italic leading-relaxed">
                "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya."
              </p>
              <p className="text-xs text-muted-foreground mt-2">— HR. Ahmad</p>
            </div>
          )}
        </div>

        {/* Latest Article */}
        <div className="relative group">
          {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <HomepageContentForm 
                defaultSection="articles" 
                onSuccess={onRefresh}
                trigger={
                  <Button size="icon" variant="ghost" className="h-6 w-6 bg-background/80">
                    <Plus className="w-3 h-3" />
                  </Button>
                }
              />
            </div>
          )}
          {articles.length > 0 ? (
            articles.slice(0, 1).map(article => (
              <div key={article.id} className="bg-card rounded-xl p-4 border border-border relative group">
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <HomepageContentForm 
                      content={article}
                      onSuccess={onRefresh}
                      trigger={
                        <Button size="icon" variant="ghost" className="h-6 w-6 bg-background/80">
                          <Pencil className="w-3 h-3" />
                        </Button>
                      }
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-6 w-6 bg-background/80 text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus artikel?</AlertDialogTitle>
                          <AlertDialogDescription>Artikel ini akan dihapus permanen.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(article.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                <span className="text-xs font-medium text-primary">Artikel</span>
                <h4 className="font-medium text-sm text-foreground mt-1 mb-2">{article.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{article.description}</p>
              </div>
            ))
          ) : (
            <div className="bg-card rounded-xl p-4 border border-border">
              <span className="text-xs font-medium text-primary">Artikel</span>
              <h4 className="font-medium text-sm text-foreground mt-1 mb-2">
                Keutamaan Menjaga Silaturahmi dalam Islam
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Silaturahmi merupakan salah satu ibadah yang memiliki banyak keutamaan...
              </p>
            </div>
          )}
        </div>

        <Button variant="ghost" className="w-full mt-4 text-sm" asChild>
          <a href="#" className="flex items-center justify-center gap-1">
            Lihat Semua
            <ChevronRight className="w-4 h-4" />
          </a>
        </Button>
      </div>
    </section>
  );
};

// Gallery Image Interface
interface GalleryImage {
  id: string;
  title: string | null;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

// Gallery Section (Horizontal Scroll)
const GallerySection = ({ isAdmin }: { isAdmin: boolean }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<GalleryImage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchImages = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    
    if (!error && data) {
      setImages(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleEdit = (image: GalleryImage) => {
    setEditData(image);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", deleteId);
      
      if (error) throw error;
      toast.success("Gambar berhasil dihapus");
      fetchImages();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus gambar");
    } finally {
      setDeleteId(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditData(null);
  };

  // Fallback images when database is empty
  const fallbackImages = [
    "https://images.unsplash.com/photo-1584286595398-a59511e0649f?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=300&h=200&fit=crop",
  ];

  const displayImages = images.length > 0 ? images : fallbackImages.map((url, i) => ({
    id: `fallback-${i}`,
    title: null,
    image_url: url,
    sort_order: i,
    is_active: true
  }));

  return (
    <section id="galeri" className="py-8 bg-muted/30">
      <div className="flex items-center justify-between px-4 mb-4">
        <h3 className="text-lg font-semibold">Galeri Kegiatan</h3>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-40 h-28 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar">
          {displayImages.map((img) => (
            <div
              key={img.id}
              className="shrink-0 w-40 h-28 rounded-lg overflow-hidden bg-muted relative group"
            >
              <img
                src={img.image_url}
                alt={img.title || "Galeri Kegiatan"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {isAdmin && !img.id.startsWith("fallback") && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(img)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeleteId(img.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {img.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-xs text-white truncate">{img.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !isLoading && isAdmin && (
        <p className="text-center text-sm text-muted-foreground mt-2 px-4">
          Belum ada gambar. Klik "Tambah" untuk menambahkan gambar galeri.
        </p>
      )}

      <GalleryForm
        open={showForm}
        onOpenChange={handleCloseForm}
        editData={editData}
        onSuccess={fetchImages}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Gambar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus gambar ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

// CTA Section
const CTASection = () => (
  <section className="py-10 px-4 bg-primary">
    <div className="max-w-sm mx-auto text-center">
      <h3 className="text-xl font-bold text-primary-foreground mb-2">
        Bergabung Bersama Kami
      </h3>
      <p className="text-primary-foreground/80 text-sm mb-6">
        Jadilah bagian dari komunitas dakwah
      </p>
      <div className="flex flex-col gap-3">
        <Button size="lg" variant="secondary" className="w-full" asChild>
          <Link to="/register">
            Gabung Fokus Salim
          </Link>
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className="w-full bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
          asChild
        >
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
            <Phone className="w-4 h-4 mr-2" />
            Hubungi Admin
          </a>
        </Button>
      </div>
    </div>
  </section>
);

// Mini Footer
const MiniFooter = () => (
  <footer className="py-6 px-4 bg-card border-t border-border safe-area-bottom">
    <div className="max-w-sm mx-auto">
      <div className="flex justify-center gap-4 mb-4">
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
          aria-label="WhatsApp"
        >
          <Phone className="w-5 h-5 text-foreground" />
        </a>
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
          aria-label="Instagram"
        >
          <Instagram className="w-5 h-5 text-foreground" />
        </a>
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
          aria-label="YouTube"
        >
          <Youtube className="w-5 h-5 text-foreground" />
        </a>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        © 2024 Fokus Salim. All rights reserved.
      </p>
    </div>
  </footer>
);

// Main Index Component
const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [homepageContent, setHomepageContent] = useState<HomepageContent[]>([]);
  const { user } = useAuth();
  const { isAdminOrPengurus } = useUserRole();

  const fetchContent = async () => {
    const { data } = await supabase
      .from("homepage_content")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    setHomepageContent(data || []);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return (
    <>
      <Helmet>
        <title>Fokus Salim - Komunitas Dakwah & Pembinaan Umat</title>
        <meta
          name="description"
          content="Fokus Salim adalah komunitas dakwah dan pembinaan umat yang fokus pada kajian Islam, konsultasi keislaman, pembinaan akhlak, dan kegiatan sosial."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <TopBar 
          onMenuClick={() => setIsMenuOpen(!isMenuOpen)} 
          isMenuOpen={isMenuOpen} 
        />
        <MobileMenu 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          user={user}
        />
        
        <main>
          <HeroSection />
          <ProgramSection isAdmin={isAdminOrPengurus} content={homepageContent} onRefresh={fetchContent} />
          <ScheduleSection />
          <ContentSection isAdmin={isAdminOrPengurus} content={homepageContent} onRefresh={fetchContent} />
          <GallerySection isAdmin={isAdminOrPengurus} />
          <CTASection />
        </main>
        
        <MiniFooter />
      </div>
    </>
  );
};

export default Index;