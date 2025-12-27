import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logoTamanQuran from "@/assets/logo-taman-quran.jpg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Beranda", href: "#beranda" },
    { label: "Profil", href: "#profil" },
    { label: "Program", href: "#program" },
    { label: "Pengumuman", href: "#pengumuman" },
    { label: "Kontak", href: "#kontak" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <img 
              src={logoTamanQuran} 
              alt="Logo Taman Qur'an" 
              className="h-12 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-foreground">Taman Qur'an</span>
              <p className="text-xs text-muted-foreground -mt-0.5">Tanamkan Iman, Tanamkan Al Qur'an</p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Masuk
            </Button>
            <Button size="sm">Daftar Sekarang</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4 px-4">
                <Button variant="outline" className="w-full">
                  Masuk
                </Button>
                <Button className="w-full">Daftar Sekarang</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
