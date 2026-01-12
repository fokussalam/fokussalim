import { AuthForm } from "@/components/auth/AuthForm";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import logoSalim from "@/assets/logo-taman-quran.png";

export default function Login() {
  return (
    <>
      <Helmet>
        <title>Masuk - Salim | Komunitas Pengajian</title>
        <meta name="description" content="Masuk ke akun Salim Anda untuk mengelola kegiatan komunitas pengajian." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Link to="/" className="flex items-center gap-3 mb-8">
          <img src={logoSalim} alt="Salim" className="w-16 h-16 rounded-full" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">Salim</h1>
            <p className="text-sm text-muted-foreground">Komunitas Pengajian</p>
          </div>
        </Link>

        <AuthForm mode="login" />
      </div>
    </>
  );
}
