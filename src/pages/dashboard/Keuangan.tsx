import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { TransactionExport } from "@/components/forms/TransactionExport";
import { TransactionUpload } from "@/components/forms/TransactionUpload";
import { DeleteDialog } from "@/components/forms/DeleteDialog";
import { TrendingUp, TrendingDown, Wallet, Receipt, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

export default function Keuangan() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
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

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const totalIncome = transactions.filter((t) => t.type === "pemasukan").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "pengeluaran").reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = { iuran_bulanan: "Iuran Bulanan", infaq: "Infaq", donasi: "Donasi", konsumsi: "Konsumsi", transport: "Transport", peralatan: "Peralatan", lainnya: "Lainnya" };
    return labels[category] || category;
  };

  return (
    <>
      <Helmet><title>Keuangan - Salim | Komunitas Pengajian</title></Helmet>
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Keuangan</h1>
              <p className="text-sm text-muted-foreground">Kelola keuangan komunitas</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <TransactionExport transactions={transactions} />
              {isAdminOrPengurus && (
                <>
                  <TransactionUpload onSuccess={fetchTransactions} />
                  <TransactionForm onSuccess={fetchTransactions} />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pemasukan</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-100"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-emerald-600 truncate">{loading ? "..." : formatCurrency(totalIncome)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran</CardTitle>
                <div className="p-2 rounded-lg bg-red-100"><TrendingDown className="w-4 h-4 text-red-600" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-red-600 truncate">{loading ? "..." : formatCurrency(totalExpense)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Kas</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10"><Wallet className="w-4 h-4 text-primary" /></div>
              </CardHeader>
              <CardContent>
                <div className={`text-lg sm:text-2xl font-bold truncate ${balance >= 0 ? "text-primary" : "text-red-600"}`}>{loading ? "..." : formatCurrency(balance)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5" />Riwayat Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2"><div className="h-4 w-24 bg-muted rounded" /><div className="h-3 w-16 bg-muted rounded" /></div>
                      <div className="h-4 w-20 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Belum Ada Transaksi</h3>
                  <p className="text-muted-foreground">Catat transaksi pertama komunitas Anda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      formatCurrency={formatCurrency}
                      getCategoryLabel={getCategoryLabel}
                      isAdminOrPengurus={isAdminOrPengurus}
                      onEdit={fetchTransactions}
                      onDelete={() => handleDelete(transaction.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}

function TransactionItem({ transaction, formatCurrency, getCategoryLabel, isAdminOrPengurus, onEdit, onDelete }: {
  transaction: Transaction;
  formatCurrency: (amount: number) => string;
  getCategoryLabel: (category: string) => string;
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