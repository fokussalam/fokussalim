import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const BedahTajwid = () => {
  return (
    <>
      <Helmet>
        <title>Bedah Tajwid - Taman Quran Salim</title>
        <meta name="description" content="Belajar tajwid Al-Quran bersama Taman Quran Salim" />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
          <div className="flex items-center h-14 px-4 gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <h1 className="text-lg font-bold">Bedah Tajwid</h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Bedah Tajwid</h2>
            <p className="text-muted-foreground">
              Halaman ini sedang dalam pengembangan. Nantikan konten belajar tajwid yang lengkap dan interaktif.
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

export default BedahTajwid;
