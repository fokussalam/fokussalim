import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Mushaf from "./pages/Mushaf";
import Murotal from "./pages/Murotal";
import BedahTajwid from "./pages/BedahTajwid";
import BedahIrab from "./pages/BedahIrab";
import Dashboard from "./pages/Dashboard";
import Anggota from "./pages/dashboard/Anggota";
import Kegiatan from "./pages/dashboard/Kegiatan";
import Keuangan from "./pages/dashboard/Keuangan";
import Kuis from "./pages/dashboard/Kuis";
import Profil from "./pages/dashboard/Profil";
import Pengaturan from "./pages/dashboard/Pengaturan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/mushaf" element={<Mushaf />} />
              <Route path="/murotal" element={<Murotal />} />
              <Route path="/bedah-tajwid" element={<BedahTajwid />} />
              <Route path="/bedah-irab" element={<BedahIrab />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/anggota"
                element={
                  <ProtectedRoute>
                    <Anggota />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/kegiatan"
                element={
                  <ProtectedRoute>
                    <Kegiatan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/keuangan"
                element={
                  <ProtectedRoute>
                    <Keuangan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/kuis"
                element={
                  <ProtectedRoute>
                    <Kuis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/profil"
                element={
                  <ProtectedRoute>
                    <Profil />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/pengaturan"
                element={
                  <ProtectedRoute>
                    <Pengaturan />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
