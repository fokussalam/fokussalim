import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, Wallet, TrendingUp } from "lucide-react";

interface Stats {
  totalMembers: number;
  totalEvents: number;
  totalIncome: number;
  totalExpense: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    totalEvents: 0,
    totalIncome: 0,
    totalExpense: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total members
        const { count: membersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "aktif");

        // Fetch total events
        const { count: eventsCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true });

        // Fetch income
        const { data: incomeData } = await supabase
          .from("transactions")
          .select("amount")
          .eq("type", "pemasukan");

        // Fetch expense
        const { data: expenseData } = await supabase
          .from("transactions")
          .select("amount")
          .eq("type", "pengeluaran");

        const totalIncome = incomeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const totalExpense = expenseData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        setStats({
          totalMembers: membersCount || 0,
          totalEvents: eventsCount || 0,
          totalIncome,
          totalExpense,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: "Total Anggota",
      value: stats.totalMembers,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Kegiatan",
      value: stats.totalEvents,
      icon: Calendar,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Pemasukan",
      value: formatCurrency(stats.totalIncome),
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Pengeluaran",
      value: formatCurrency(stats.totalExpense),
      icon: Wallet,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - Salim | Komunitas Pengajian</title>
      </Helmet>

      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Selamat datang di Salim - Komunitas Pengajian
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${loading ? "animate-pulse" : ""}`}>
                    {loading ? "..." : stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kegiatan Mendatang</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Belum ada kegiatan yang dijadwalkan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saldo Kas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(stats.totalIncome - stats.totalExpense)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Total saldo komunitas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
