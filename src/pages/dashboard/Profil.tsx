import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { User, Phone, MapPin, Calendar, Loader2, Save, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Profil() {
  const { profile, loading: profileLoading } = useProfile();
  const { isAdmin, isPengurus, isAnggota } = useUserRole();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = () => {
    if (isAdmin) return "Admin";
    if (isPengurus) return "Pengurus";
    if (isAnggota) return "Anggota";
    return "Anggota";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aktif": return "Aktif";
      case "tidak_aktif": return "Tidak Aktif";
      case "pending": return "Menunggu Persetujuan";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aktif": return "bg-emerald-100 text-emerald-700";
      case "tidak_aktif": return "bg-red-100 text-red-700";
      case "pending": return "bg-amber-100 text-amber-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "Nama lengkap wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone?.trim() || null,
          address: formData.address?.trim() || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Berhasil!",
        description: "Profil berhasil diperbarui.",
      });
      setIsEditing(false);
      
      // Refresh the page to get updated data
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Gagal",
        description: error.message || "Terjadi kesalahan saat memperbarui profil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    }
    setIsEditing(false);
  };

  if (profileLoading) {
    return (
      <>
        <Helmet>
          <title>Profil Saya - Salim</title>
        </Helmet>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Helmet>
          <title>Profil Saya - Salim</title>
        </Helmet>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <User className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Profil tidak ditemukan</h2>
            <p className="text-muted-foreground">Silakan hubungi admin untuk bantuan.</p>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profil Saya - Salim</title>
      </Helmet>

      <DashboardLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Profil Saya</h1>
              <p className="text-muted-foreground">Kelola informasi profil Anda</p>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nama Lengkap</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-xl">{profile.full_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span className="capitalize">{getRoleLabel()}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(profile.status)}`}>
                          {getStatusLabel(profile.status)}
                        </span>
                      </CardDescription>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  Nomor Telepon
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 08123456789"
                  />
                ) : (
                  <p className="text-foreground">{profile.phone || "-"}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Alamat
                </Label>
                {isEditing ? (
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Masukkan alamat lengkap"
                    rows={3}
                  />
                ) : (
                  <p className="text-foreground">{profile.address || "-"}</p>
                )}
              </div>

              {/* Join Date - Read Only */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Tanggal Bergabung
                </Label>
                <p className="text-foreground">
                  {profile.join_date
                    ? format(new Date(profile.join_date), "d MMMM yyyy", { locale: id })
                    : format(new Date(profile.created_at), "d MMMM yyyy", { locale: id })}
                </p>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Simpan
                      </>
                    )}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" disabled={saving}>
                    Batal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}
