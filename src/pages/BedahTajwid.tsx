import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Send, History, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { TajwidSubmissionForm } from "@/components/tajwid/TajwidSubmissionForm";
import { TajwidHistory } from "@/components/tajwid/TajwidHistory";
import { TajwidReview } from "@/components/tajwid/TajwidReview";

const BedahTajwid = () => {
  const { user } = useAuth();
  const { isAdminOrPengurus } = useUserRole();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <Helmet>
        <title>Bedah Tajwid - Taman Quran Salim</title>
        <meta name="description" content="Belajar tajwid Al-Quran bersama Taman Quran Salim. Kirim bacaan dan dapatkan analisis tajwid dari ustadz." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
          <div className="flex items-center h-14 px-4 gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <h1 className="text-lg font-bold">Bedah Tajwid</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-2xl">
          {!user ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 mx-auto text-primary mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Login untuk Mulai</h2>
              <p className="text-muted-foreground mb-4">Silakan login untuk mengirim bacaan dan melihat riwayat bedah tajwid.</p>
              <Link to="/login">
                <Button>Login</Button>
              </Link>
            </div>
          ) : (
            <Tabs defaultValue="submit" className="space-y-4">
              <TabsList className={`grid w-full ${isAdminOrPengurus ? "grid-cols-3" : "grid-cols-2"}`}>
                <TabsTrigger value="submit" className="gap-1.5 text-xs sm:text-sm">
                  <Send className="w-3.5 h-3.5" /> Kirim
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
                  <History className="w-3.5 h-3.5" /> Riwayat
                </TabsTrigger>
                {isAdminOrPengurus && (
                  <TabsTrigger value="review" className="gap-1.5 text-xs sm:text-sm">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Review
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="submit">
                <TajwidSubmissionForm onSubmitted={() => setRefreshKey(k => k + 1)} />
              </TabsContent>

              <TabsContent value="history">
                <TajwidHistory refreshKey={refreshKey} />
              </TabsContent>

              {isAdminOrPengurus && (
                <TabsContent value="review">
                  <TajwidReview />
                </TabsContent>
              )}
            </Tabs>
          )}
        </main>
      </div>
    </>
  );
};

export default BedahTajwid;
