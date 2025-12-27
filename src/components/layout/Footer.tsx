import { BookOpen, MapPin, Phone, Mail, Facebook, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  const quickLinks = [
    { label: "Beranda", href: "#beranda" },
    { label: "Profil", href: "#profil" },
    { label: "Program", href: "#program" },
    { label: "Pengumuman", href: "#pengumuman" },
    { label: "Kontak", href: "#kontak" },
  ];

  const programs = [
    { label: "Tahsin (Perbaikan Bacaan)", href: "#" },
    { label: "Tahfidz (Hafalan)", href: "#" },
    { label: "Pembinaan Akhlak", href: "#" },
    { label: "Kelas Weekend", href: "#" },
  ];

  return (
    <footer className="bg-foreground text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Taman Qur'an</h3>
                <p className="text-sm text-primary-foreground/70">Membentuk Generasi Qur'ani</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
              Lembaga pendidikan Al-Qur'an yang berkomitmen mencetak generasi yang 
              cinta Al-Qur'an dan berakhlak mulia.
            </p>
            <div className="flex items-center gap-3">
              {[Facebook, Instagram, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">Tautan Cepat</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/80 hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-bold text-lg mb-6">Program Kami</h4>
            <ul className="space-y-3">
              {programs.map((program, index) => (
                <li key={index}>
                  <a
                    href={program.href}
                    className="text-primary-foreground/80 hover:text-primary transition-colors text-sm"
                  >
                    {program.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-6">Kontak</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-primary-foreground/80 text-sm">
                  Jl. Pendidikan No. 123, Kota Islami
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-primary-foreground/80 text-sm">
                  +62 812-3456-7890
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-primary-foreground/80 text-sm">
                  info@tamanquran.id
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
            <p>© 2024 Taman Qur'an. Hak Cipta Dilindungi.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Kebijakan Privasi
              </a>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Syarat & Ketentuan
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
