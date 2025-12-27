import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ContactSection = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Alamat",
      details: ["Jl. Pendidikan No. 123", "Kelurahan Berkah, Kec. Barokah", "Kota Islami, 12345"],
    },
    {
      icon: Phone,
      title: "Telepon",
      details: ["+62 812-3456-7890", "+62 21-1234567"],
    },
    {
      icon: Mail,
      title: "Email",
      details: ["info@tamanquran.id", "pendaftaran@tamanquran.id"],
    },
    {
      icon: Clock,
      title: "Jam Operasional",
      details: ["Senin - Jumat: 08:00 - 17:00", "Sabtu: 08:00 - 12:00"],
    },
  ];

  return (
    <section id="kontak" className="py-24 bg-muted/30 islamic-pattern">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Hubungi Kami
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Mari Bergabung Bersama Kami
          </h2>
          <p className="text-muted-foreground text-lg">
            Hubungi kami untuk informasi lebih lanjut mengenai program dan pendaftaran santri baru.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="grid sm:grid-cols-2 gap-6">
            {contactInfo.map((item, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-3">{item.title}</h3>
                  <div className="space-y-1">
                    {item.details.map((detail, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        {detail}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Kirim Pesan</h3>
              <form className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nama"
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Keperluan
                  </label>
                  <select className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                    <option value="">Pilih keperluan</option>
                    <option value="pendaftaran">Pendaftaran Santri Baru</option>
                    <option value="informasi">Informasi Program</option>
                    <option value="kunjungan">Jadwal Kunjungan</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Pesan
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tulis pesan Anda..."
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                  />
                </div>
                <Button className="w-full" size="lg">
                  <Send className="w-4 h-4 mr-2" />
                  Kirim Pesan
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
