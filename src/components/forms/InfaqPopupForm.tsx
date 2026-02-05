 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Switch } from "@/components/ui/switch";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { toast } from "sonner";
 import { Heart, Save, Loader2 } from "lucide-react";
 
 interface InfaqPopupData {
   id: string;
   title: string;
   description: string | null;
   image_url: string | null;
   bank_name: string | null;
   account_number: string | null;
   account_holder: string | null;
   whatsapp_number: string | null;
   is_active: boolean;
 }
 
 export const InfaqPopupForm = () => {
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [data, setData] = useState<InfaqPopupData | null>(null);
 
   useEffect(() => {
     fetchData();
   }, []);
 
   const fetchData = async () => {
     setLoading(true);
     const { data: popup } = await supabase
       .from("infaq_popup")
       .select("*")
       .limit(1)
       .single();
 
     if (popup) {
       setData(popup as InfaqPopupData);
     }
     setLoading(false);
   };
 
   const handleSave = async () => {
     if (!data) return;
 
     setSaving(true);
     const { error } = await supabase
       .from("infaq_popup")
       .update({
         title: data.title,
         description: data.description,
         image_url: data.image_url,
         bank_name: data.bank_name,
         account_number: data.account_number,
         account_holder: data.account_holder,
         whatsapp_number: data.whatsapp_number,
         is_active: data.is_active,
       })
       .eq("id", data.id);
 
     if (error) {
       toast.error("Gagal menyimpan: " + error.message);
     } else {
       toast.success("Pengaturan popup infak berhasil disimpan");
     }
     setSaving(false);
   };
 
   if (loading) {
     return (
       <Card>
         <CardContent className="flex items-center justify-center py-10">
           <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
         </CardContent>
       </Card>
     );
   }
 
   if (!data) {
     return (
       <Card>
         <CardContent className="py-10 text-center text-muted-foreground">
           Data popup tidak ditemukan
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <div className="flex items-center gap-2">
           <Heart className="w-5 h-5 text-primary" />
           <CardTitle className="text-lg">Popup Infak</CardTitle>
         </div>
         <CardDescription>
           Kelola tampilan popup infak di beranda
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* Active Toggle */}
         <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
           <div className="space-y-0.5">
             <Label>Aktifkan Popup</Label>
             <p className="text-xs text-muted-foreground">
               Popup akan muncul otomatis di beranda
             </p>
           </div>
           <Switch
             checked={data.is_active}
             onCheckedChange={(checked) => setData({ ...data, is_active: checked })}
           />
         </div>
 
         {/* Title */}
         <div className="space-y-2">
           <Label htmlFor="title">Judul</Label>
           <Input
             id="title"
             value={data.title}
             onChange={(e) => setData({ ...data, title: e.target.value })}
             placeholder="Mari Berinfak"
           />
         </div>
 
         {/* Description */}
         <div className="space-y-2">
           <Label htmlFor="description">Deskripsi</Label>
           <Textarea
             id="description"
             value={data.description || ""}
             onChange={(e) => setData({ ...data, description: e.target.value })}
             placeholder="Salurkan infak terbaik Anda..."
             rows={3}
           />
         </div>
 
         {/* Image URL */}
         <div className="space-y-2">
           <Label htmlFor="image_url">URL Gambar (opsional)</Label>
           <Input
             id="image_url"
             value={data.image_url || ""}
             onChange={(e) => setData({ ...data, image_url: e.target.value })}
             placeholder="https://..."
           />
         </div>
 
         {/* Bank Info */}
         <div className="border rounded-lg p-4 space-y-4">
           <Label className="text-sm font-semibold">Informasi Rekening</Label>
           
           <div className="space-y-2">
             <Label htmlFor="bank_name" className="text-xs text-muted-foreground">Nama Bank</Label>
             <Input
               id="bank_name"
               value={data.bank_name || ""}
               onChange={(e) => setData({ ...data, bank_name: e.target.value })}
               placeholder="Bank Syariah Indonesia (BSI)"
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="account_number" className="text-xs text-muted-foreground">Nomor Rekening</Label>
             <Input
               id="account_number"
               value={data.account_number || ""}
               onChange={(e) => setData({ ...data, account_number: e.target.value })}
               placeholder="1234567890"
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="account_holder" className="text-xs text-muted-foreground">Nama Pemilik Rekening</Label>
             <Input
               id="account_holder"
               value={data.account_holder || ""}
               onChange={(e) => setData({ ...data, account_holder: e.target.value })}
               placeholder="Masjid Al-Ikhlas"
             />
           </div>
         </div>
 
         {/* WhatsApp */}
         <div className="space-y-2">
           <Label htmlFor="whatsapp_number">Nomor WhatsApp Konfirmasi</Label>
           <Input
             id="whatsapp_number"
             value={data.whatsapp_number || ""}
             onChange={(e) => setData({ ...data, whatsapp_number: e.target.value })}
             placeholder="628123456789"
           />
           <p className="text-xs text-muted-foreground">
             Format: 628xxx (tanpa tanda + atau spasi)
           </p>
         </div>
 
         {/* Save Button */}
         <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
           {saving ? (
             <>
               <Loader2 className="w-4 h-4 animate-spin" />
               Menyimpan...
             </>
           ) : (
             <>
               <Save className="w-4 h-4" />
               Simpan Perubahan
             </>
           )}
         </Button>
       </CardContent>
     </Card>
   );
 };