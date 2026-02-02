import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Lock, Bell, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function Pengaturan() {
  const { profile } = useProfile();
  const { user } = useAuth();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Password baru tidak cocok");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setChangingPassword(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    
    setChangingPassword(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-muted-foreground text-sm">Kelola akun dan preferensi Anda</p>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Informasi Akun</CardTitle>
            </div>
            <CardDescription>Detail akun yang terdaftar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Nama Lengkap</Label>
              <p className="text-sm font-medium">{profile?.full_name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Telepon</Label>
              <p className="text-sm font-medium">{profile?.phone || "-"}</p>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Untuk mengubah informasi profil, kunjungi halaman <a href="/dashboard/profil" className="text-primary hover:underline">Profil</a>
            </p>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Ubah Password</CardTitle>
            </div>
            <CardDescription>Perbarui password akun Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
              />
            </div>
            <Button 
              onClick={handleChangePassword} 
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              {changingPassword ? "Mengubah..." : "Ubah Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Keamanan</CardTitle>
            </div>
            <CardDescription>Pengaturan keamanan akun</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Login dengan Email</Label>
                <p className="text-xs text-muted-foreground">Akun terdaftar dengan email</p>
              </div>
              <Switch checked disabled />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Terakhir Login</Label>
              <p className="text-sm font-medium">
                {user?.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleString('id-ID')
                  : "-"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
