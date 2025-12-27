import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import ProgramsSection from "@/components/sections/ProgramsSection";
import AnnouncementsSection from "@/components/sections/AnnouncementsSection";
import ContactSection from "@/components/sections/ContactSection";
import Footer from "@/components/layout/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Taman Qur'an - Lembaga Pendidikan Al-Qur'an | Tahsin, Tahfidz & Akhlak</title>
        <meta
          name="description"
          content="Taman Qur'an adalah lembaga pendidikan Al-Qur'an terpercaya dengan program Tahsin, Tahfidz, dan pembinaan Akhlak untuk membentuk generasi Qur'ani yang berakhlak mulia."
        />
        <meta
          name="keywords"
          content="Taman Quran, belajar Al-Quran, tahsin, tahfidz, hafalan quran, pendidikan islam"
        />
        <link rel="canonical" href="https://tamanquran.id" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <AboutSection />
          <ProgramsSection />
          <AnnouncementsSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
