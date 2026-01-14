import { AuthForm } from "@/components/auth/AuthForm";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import logoSalim from "@/assets/logo-salim.png";

export default function Login() {
  return (
    <>
      <Helmet>
        <title>Masuk - Salim | SALAM FM 97.4</title>
        <meta name="description" content="Masuk ke akun Salim Anda untuk mengelola kegiatan komunitas." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Link to="/" className="mb-8">
          <img src={logoSalim} alt="Salim - SALAM FM 97.4" className="h-20 w-auto object-contain" />
        </Link>

        <AuthForm mode="login" />
      </div>
    </>
  );
}
