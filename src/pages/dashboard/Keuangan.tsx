import { useEffect, useState, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { TransactionExport } from "@/components/forms/TransactionExport";
import { TransactionUpload } from "@/components/forms/TransactionUpload";
import { DeleteDialog } from "@/components/forms/DeleteDialog";
import { TrendingUp, TrendingDown, Wallet, Receipt, Pencil, Trash2, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

const CATEGORY_CONFIG = {
  semua: { label: "Semua", color: "bg-primary/10 text-primary" },
  kas_safa: { label: "Kas Safa", color: "bg-blue-100 text-blue-700" },
  kas_hit: { label: "Kas Hit", color: "bg-purple-100 text-purple-700" },
  kas_ips: { label: "Kas IPS", color: "bg-orange-100 text-orange-700" },
  kas_qurban: { label: "Kas Qurban", color: "bg-emerald-100 text-emerald-700" },
  kas_umroh: { label: "Kas Umroh", color: "bg-cyan-100 text-cyan-700" },
  kas_dll: { label: "Kas Lainnya", color: "bg-gray-100 text-gray-700" },
  umum: { label: "Umum", color: "bg-amber-100 text-amber-700" },
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    iuran_bulanan: "Iuran Bulanan",
    infaq: "Infaq",
    donasi: "Donasi",
    konsumsi: "Konsumsi",
    transport: "Transport",
    peralatan: "Peralatan",
    lainnya: "Lainnya",
    kas_safa: "Kas Safa",
    kas_hit: "Kas Hit",
    kas_ips: "Kas IPS",
    kas_qurban: "Kas Qurban",
    kas_umroh: "Kas Umroh",
    kas_dll: "Kas Lainnya",
  };
  return labels[category] || category;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export default function Keuangan() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("semua");
  const { isAdminOrPengurus } = useUserRole();
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("transactions").select("*").order("transaction_date", { ascending: false });
    if (error) console.error("Error fetching transactions:", error);
    else setTransactions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast({ title: "Gagal", description: "Gagal menghapus transaksi.", variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Transaksi berhasil dihapus." });
      fetchTransactions();
    }
  };

  // Group transactions by category folder
  const kasCategories = ["kas_safa", "kas_hit", "kas_ips", "kas_qurban", "kas_umroh", "kas_dll"];
  
  const filteredTransactions = useMemo(() => {
    if (activeTab === "semua") return transactions;
    if (activeTab === "umum") return transactions.filter((t) => !kasCategories.includes(t.category));
    return transactions.filter((t) => t.category === activeTab);
  }, [transactions, activeTab]);

  // Calculate totals for each category
  const categoryTotals = useMemo(() => {
    const totals: Record<string, { income: number; expense: number; balance: number }> = {};
    
    // Initialize all categories
    ["semua", "umum", ...kasCategories].forEach((cat) => {
      totals[cat] = { income: 0, expense: 0, balance: 0 };
    });

    transactions.forEach((t) => {
      const amount = Number(t.amount);
      const isIncome = t.type === "pemasukan";
      
      // Add to semua (all)
      if (isIncome) totals.semua.income += amount;
      else totals.semua.expense += amount;
      
      // Add to specific category
      if (kasCategories.includes(t.category)) {
        if (isIncome) totals[t.category].income += amount;
        else totals[t.category].expense += amount;
      } else {
        // Add to umum (general)
        if (isIncome) totals.umum.income += amount;
        else totals.umum.expense += amount;
      }
    });

    // Calculate balances
    Object.keys(totals).forEach((key) => {
      totals[key].balance = totals[key].income - totals[key].expense;
    });

    return totals;
  }, [transactions]);

  const currentTotals = categoryTotals[activeTab] || { income: 0, expense: 0, balance: 0 };

  return (
    <>
      <Helmet><title>Keuangan - Fokus Salim | Komunitas Pengajian</title></Helmet>
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Keuangan</h1>
              <p className="text-sm text-muted-foreground">
                {isAdminOrPengurus ? "Kelola keuangan komunitas" : "Lihat transparansi keuangan komunitas"}
              </p>
            </div>
            {isAdminOrPengurus && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <TransactionExport transactions={filteredTransactions} />
                <TransactionUpload onSuccess={fetchTransactions} />
                <TransactionForm onSuccess={fetchTransactions} />
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex h-auto p-1 bg-muted/50">
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const total = categoryTotals[key];
                  const hasData = total && (total.income > 0 || total.expense > 0);
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="flex flex-col items-center gap-1 px-3 py-2 min-w-[80px] data-[state=active]:bg-background"
                    >
                      <div className="flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium whitespace-nowrap">{config.label}</span>
                      </div>
                      {hasData && (
                        <span className={`text-[10px] font-medium ${total.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {new Intl.NumberFormat("id-ID", { notation: "compact", compactDisplay: "short" }).format(total.balance)}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pemasukan</CardTitle>
                  <div className="p-2 rounded-lg bg-emerald-100"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-emerald-600 truncate">
                    {loading ? "..." : formatCurrency(currentTotals.income)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran</CardTitle>
                  <div className="p-2 rounded-lg bg-red-100"><TrendingDown className="w-4 h-4 text-red-600" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                    {loading ? "..." : formatCurrency(currentTotals.expense)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Saldo {activeTab !== "semua" ? CATEGORY_CONFIG[activeTab as keyof typeof CATEGORY_CONFIG]?.label : "Total"}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10"><Wallet className="w-4 h-4 text-primary" /></div>
                </CardHeader>
                <CardContent>
                  <div className={`text-lg sm:text-2xl font-bold truncate ${currentTotals.balance >= 0 ? "text-primary" : "text-red-600"}`}>
                    {loading ? "..." : formatCurrency(currentTotals.balance)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Riwayat Transaksi
                  {activeTab !== "semua" && (
                    <Badge variant="secondary" className={CATEGORY_CONFIG[activeTab as keyof typeof CATEGORY_CONFIG]?.color}>
                      {CATEGORY_CONFIG[activeTab as keyof typeof CATEGORY_CONFIG]?.label}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 bg-muted rounded" />
                          <div className="h-3 w-16 bg-muted rounded" />
                        </div>
                        <div className="h-4 w-20 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Belum Ada Transaksi</h3>
                    <p className="text-muted-foreground">
                      {activeTab === "semua"
                        ? "Catat transaksi pertama komunitas Anda."
                        : `Belum ada transaksi untuk ${CATEGORY_CONFIG[activeTab as keyof typeof CATEGORY_CONFIG]?.label}.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction) => (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        isAdminOrPengurus={isAdminOrPengurus}
                        onEdit={fetchTransactions}
                        onDelete={() => handleDelete(transaction.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </DashboardLayout>
    </>
  );
}

function TransactionItem({
  transaction,
  isAdminOrPengurus,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  isAdminOrPengurus: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const isIncome = transaction.type === "pemasukan";

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isIncome ? "bg-emerald-100" : "bg-red-100"}`}>
        {isIncome ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={`text-xs ${isIncome ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
            {getCategoryLabel(transaction.category ?? "")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-1">{transaction.description || "-"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(transaction.transaction_date), "d MMM yyyy", { locale: id })}</p>
      </div>
      <div className={`text-sm sm:text-base font-semibold text-right flex-shrink-0 ${isIncome ? "text-emerald-600" : "text-red-600"}`}>
        {isIncome ? "+" : "-"}
        <span className="hidden sm:inline">{formatCurrency(Number(transaction.amount))}</span>
        <span className="sm:hidden">{new Intl.NumberFormat("id-ID", { notation: "compact", compactDisplay: "short" }).format(Number(transaction.amount))}</span>
      </div>
      {isAdminOrPengurus && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <TransactionForm
            transaction={transaction}
            onSuccess={onEdit}
            trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-4 h-4" /></Button>}
          />
          <DeleteDialog
            title="Hapus Transaksi?"
            description="Transaksi ini akan dihapus secara permanen."
            onDelete={onDelete}
            trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>}
          />
        </div>
      )}
    </div>
  );
}
