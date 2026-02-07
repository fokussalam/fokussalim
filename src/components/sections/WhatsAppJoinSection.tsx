import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, ExternalLink, Settings, Loader2 } from "lucide-react";

interface WhatsAppJoinSectionProps {
  isAdmin: boolean;
}

export function WhatsAppJoinSection({ isAdmin }: WhatsAppJoinSectionProps) {
  const [waGroupLink, setWaGroupLink] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchWaGroupLink = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "whatsapp_group_link")
      .single();
    
    if (error) {
      console.error("Error fetching WA group link:", error);
    } else {
      setWaGroupLink(data?.value || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWaGroupLink();
  }, []);

  if (loading) {
    return (
      <section className="py-6 px-4">
        <div className="max-w-sm mx-auto">
          <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 rounded-xl p-4 border border-green-500/20 animate-pulse">
            <div className="h-5 w-32 bg-muted rounded mb-2" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
        </div>
      </section>
    );
  }

  if (!waGroupLink && !isAdmin) {
    return null;
  }

  return (
    <section className="py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 rounded-xl p-4 border border-green-500/20 relative">
          {isAdmin && (
            <div className="absolute top-2 right-2">
              <EditWaLinkDialog currentLink={waGroupLink} onSuccess={fetchWaGroupLink} />
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4 text-green-600" />
                Gabung Grup Kegiatan
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Info jadwal & pengumuman terbaru
              </p>
            </div>
            
            {waGroupLink ? (
              <Button 
                size="sm"
                className="shrink-0 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                asChild
              >
                <a href={waGroupLink} target="_blank" rel="noopener noreferrer">
                  Gabung
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Belum diatur</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Edit WA Link Dialog
function EditWaLinkDialog({ currentLink, onSuccess }: { currentLink: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState(currentLink);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLink(currentLink);
  }, [currentLink]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: link })
        .eq("key", "whatsapp_group_link");

      if (error) throw error;

      toast({ title: "Berhasil", description: "Link grup WhatsApp berhasil diperbarui." });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating WA link:", error);
      toast({ title: "Gagal", description: "Gagal memperbarui link.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80">
          <Settings className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Link Grup WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wa-link-home">Link Grup WhatsApp</Label>
            <Input
              id="wa-link-home"
              placeholder="https://chat.whatsapp.com/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Masukkan link undangan grup WhatsApp (format: https://chat.whatsapp.com/...)
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
