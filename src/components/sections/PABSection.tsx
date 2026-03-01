import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  BookOpen, Headphones, Plus, Pencil, Trash2, ExternalLink, Star, Video,
  Mic, Radio, Globe, FileText, GraduationCap, Heart, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const iconMap: Record<string, any> = {
  BookOpen, Headphones, Star, Video, Mic, Radio, Globe, FileText, GraduationCap, Heart, MessageCircle
};

interface PABItem {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface PABFormProps {
  item?: PABItem;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

const PABForm = ({ item, onSuccess, trigger }: PABFormProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [url, setUrl] = useState(item?.url || "");
  const [icon, setIcon] = useState(item?.icon || "BookOpen");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }
    setSaving(true);
    const payload = { title, description: description || null, url: url || null, icon };

    const { error } = item
      ? await supabase.from("pab_items").update(payload).eq("id", item.id)
      : await supabase.from("pab_items").insert(payload);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(item ? "Item diperbarui" : "Item ditambahkan");
      setOpen(false);
      onSuccess();
      if (!item) { setTitle(""); setDescription(""); setUrl(""); setIcon("BookOpen"); }
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Tambah"} Item PAB</DialogTitle>
          <DialogDescription>Isi detail item Pusat Akses Belajar</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Judul</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Mushaf Al-Quran" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Deskripsi</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi singkat" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL / Link</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ikon</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(iconMap).map(name => {
                  const Icon = iconMap[name];
                  return (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2"><Icon className="w-4 h-4" />{name}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PABSection = ({ isAdmin }: { isAdmin: boolean }) => {
  const [items, setItems] = useState<PABItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("pab_items")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("pab_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Item dihapus"); fetchItems(); }
  };

  return (
    <section className="py-8 px-4 bg-muted/30">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h3 className="text-lg font-semibold">Pusat Akses Belajar</h3>
          {isAdmin && (
            <PABForm
              onSuccess={fetchItems}
              trigger={
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <Plus className="w-4 h-4" />
                </Button>
              }
            />
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">Belum ada item</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map(item => {
              const Icon = iconMap[item.icon] || BookOpen;
              return (
                <Card
                  key={item.id}
                  className="p-4 text-center card-hover relative group cursor-pointer"
                  onClick={() => item.url && window.open(item.url, "_blank")}
                >
                  {isAdmin && (
                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <PABForm
                        item={item}
                        onSuccess={fetchItems}
                        trigger={
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => e.stopPropagation()}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                        }
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={e => e.stopPropagation()}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus item?</AlertDialogTitle>
                            <AlertDialogDescription>"{item.title}" akan dihapus permanen.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)}>Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                  {item.url && (
                    <ExternalLink className="w-3 h-3 text-muted-foreground mx-auto mt-1.5" />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
