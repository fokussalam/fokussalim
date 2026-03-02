import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduledQuizList } from "@/components/quiz/ScheduledQuizList";
import { QuizArchive } from "@/components/quiz/QuizArchive";
import { Calendar, History } from "lucide-react";

export default function Kuis() {
  return (
    <>
      <Helmet>
        <title>Kuis - Salim | Komunitas Pengajian</title>
      </Helmet>

      <DashboardLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Kuis</h1>
            <p className="text-muted-foreground mt-1">
              Uji pengetahuan Anda dengan berbagai jenis kuis
            </p>
          </div>

          <Tabs defaultValue="scheduled" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scheduled" className="flex items-center gap-1 text-xs sm:text-sm">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Kuis</span> Terjadwal
              </TabsTrigger>
              <TabsTrigger value="archive" className="flex items-center gap-1 text-xs sm:text-sm">
                <History className="w-3 h-3 sm:w-4 sm:h-4" />
                Arsip
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scheduled" className="mt-6">
              <ScheduledQuizList />
            </TabsContent>

            <TabsContent value="archive" className="mt-6">
              <QuizArchive />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </>
  );
}