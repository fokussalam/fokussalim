import { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import ContactSettingsForm from "@/components/forms/ContactSettingsForm";

interface SiteSetting {
  key: string;
  value: string;
}

const ContactSection = () => {
  const { user } = useAuth();
  const { isAdmin, isPengurus } = useUserRole();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const canEdit = user && (isAdmin || isPengurus);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((item: SiteSetting) => {
          settingsMap[item.key] = item.value;
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const contactInfo = [
    {
      icon: MapPin,
      title: "Alamat",
      details: [
        settings.contact_address_1 || "Jl. Pendidikan No. 123",
        settings.contact_address_2 || "Kelurahan Berkah, Kec. Barokah",
        settings.contact_address_3 || "Kota Islami, 12345",
      ].filter(Boolean),
    },
    {
      icon: Phone,
      title: "Telepon",
      details: [
        settings.contact_phone_1 || "+62 812-3456-7890",
        settings.contact_phone_2,
      ].filter(Boolean),
    },
    {
      icon: Mail,
      title: "Email",
      details: [
        settings.contact_email_1 || "info@tamanquran.id",
        settings.contact_email_2,
      ].filter(Boolean),
    },
    {
      icon: Clock,
      title: "Jam Operasional",
      details: [
        settings.contact_hours_1 || "Senin - Jumat: 08:00 - 17:00",
        settings.contact_hours_2,
      ].filter(Boolean),
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
          {canEdit && (
            <div className="mt-4">
              <ContactSettingsForm onSuccess={fetchSettings} />
            </div>
          )}
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
