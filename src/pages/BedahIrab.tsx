import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Send, History, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { IrabSubmissionForm } from "@/components/irab/IrabSubmissionForm";
import { IrabHistory } from "@/components/irab/IrabHistory";
import { IrabReview } from "@/components/irab/IrabReview";

const BedahIrab = () => {
  const { user } = useAuth();
  const { isAdminOrPengurus } = useUserRole();
  const [refreshKey, setRefreshKey] = useState(0);

  const showHistory = !!user;
  const showReview = isAdminOrPengurus;
  const tabCount = 1 + (showHistory ? 1 : 0) + (showReview ? 1 : 0);

  return (
    <>
      <Helmet>
        <title>Bedah I'rab - Taman Quran Salim</title>
        <meta name="description" content="Analisis i'rab otomatis teks Arab. Pelajari kedudukan kata, jenis kata, dan tanda i'rab dengan bantuan AI." />
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
              <h1 className="text-lg font-bold">Bedah I'rab</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Tabs defaultValue="submit" className="space-y-4">
            <TabsList className={`grid w-full grid-cols-${tabCount}`}>
              <TabsTrigger value="submit" className="gap-1.5 text-xs sm:text-sm">
                <Send className="w-3.5 h-3.5" /> Analisis
              </TabsTrigger>
              {showHistory && (
                <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
                  <History className="w-3.5 h-3.5" /> Riwayat
                </TabsTrigger>
              )}
              {showReview && (
                <TabsTrigger value="review" className="gap-1.5 text-xs sm:text-sm">
                  <ClipboardCheck className="w-3.5 h-3.5" /> Review
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="submit">
              <IrabSubmissionForm onSubmitted={() => setRefreshKey(k => k + 1)} />
            </TabsContent>

            {showHistory && (
              <TabsContent value="history">
                <IrabHistory refreshKey={refreshKey} />
              </TabsContent>
            )}

            {showReview && (
              <TabsContent value="review">
                <IrabReview />
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default BedahIrab;
