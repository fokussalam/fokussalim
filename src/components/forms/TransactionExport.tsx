import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

interface TransactionExportProps {
  transactions: Transaction[];
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    iuran_bulanan: "Iuran Bulanan",
    infaq: "Infaq",
    donasi: "Donasi",
    konsumsi: "Konsumsi",
    transport: "Transport",
    peralatan: "Peralatan",
    lainnya: "Lainnya",
  };
  return labels[category] || category;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export function TransactionExport({ transactions }: TransactionExportProps) {
  const [loading, setLoading] = useState(false);

  const prepareData = () => {
    return transactions.map((t, index) => ({
      No: index + 1,
      Tanggal: format(new Date(t.transaction_date), "d MMM yyyy", { locale: id }),
      Jenis: t.type === "pemasukan" ? "Pemasukan" : "Pengeluaran",
      Kategori: getCategoryLabel(t.category),
      Keterangan: t.description || "-",
      Jumlah: Number(t.amount),
    }));
  };

  const exportToExcel = async () => {
    setLoading(true);
    try {
      const data = prepareData();
      const totalIncome = transactions
        .filter((t) => t.type === "pemasukan")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpense = transactions
        .filter((t) => t.type === "pengeluaran")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Add summary rows
      const summaryData = [
        ...data,
        { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "", Jumlah: "" as any },
        { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "Total Pemasukan", Jumlah: totalIncome },
        { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "Total Pengeluaran", Jumlah: totalExpense },
        { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "Saldo", Jumlah: totalIncome - totalExpense },
      ];

      const ws = XLSX.utils.json_to_sheet(summaryData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");

      // Set column widths
      ws["!cols"] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 30 },
        { wch: 18 },
      ];

      const filename = `Laporan_Keuangan_${format(new Date(), "yyyyMMdd")}.xlsx`;
      XLSX.writeFile(wb, filename);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(18);
      doc.text("Laporan Keuangan", pageWidth / 2, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text("Salim - Komunitas Pengajian", pageWidth / 2, 28, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Periode: ${format(new Date(), "MMMM yyyy", { locale: id })}`, pageWidth / 2, 35, { align: "center" });

      // Calculate totals
      const totalIncome = transactions
        .filter((t) => t.type === "pemasukan")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpense = transactions
        .filter((t) => t.type === "pengeluaran")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Summary boxes
      doc.setFillColor(16, 185, 129); // emerald
      doc.rect(14, 42, 55, 18, "F");
      doc.setFillColor(239, 68, 68); // red
      doc.rect(77, 42, 55, 18, "F");
      doc.setFillColor(59, 130, 246); // blue
      doc.rect(140, 42, 55, 18, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("Pemasukan", 41.5, 48, { align: "center" });
      doc.text("Pengeluaran", 104.5, 48, { align: "center" });
      doc.text("Saldo", 167.5, 48, { align: "center" });
      doc.setFontSize(10);
      doc.text(formatCurrency(totalIncome), 41.5, 56, { align: "center" });
      doc.text(formatCurrency(totalExpense), 104.5, 56, { align: "center" });
      doc.text(formatCurrency(totalIncome - totalExpense), 167.5, 56, { align: "center" });

      // Table
      doc.setTextColor(0, 0, 0);
      const tableData = transactions.map((t, index) => [
        index + 1,
        format(new Date(t.transaction_date), "d MMM yyyy", { locale: id }),
        t.type === "pemasukan" ? "Pemasukan" : "Pengeluaran",
        getCategoryLabel(t.category),
        t.description || "-",
        formatCurrency(Number(t.amount)),
      ]);

      autoTable(doc, {
        startY: 68,
        head: [["No", "Tanggal", "Jenis", "Kategori", "Keterangan", "Jumlah"]],
        body: tableData,
        headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 28 },
          2: { cellWidth: 25 },
          3: { cellWidth: 28 },
          4: { cellWidth: 50 },
          5: { cellWidth: 35, halign: "right" },
        },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Dicetak pada: ${format(new Date(), "d MMMM yyyy HH:mm", { locale: id })}`,
          14,
          doc.internal.pageSize.getHeight() - 10
        );
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 10,
          { align: "right" }
        );
      }

      doc.save(`Laporan_Keuangan_${format(new Date(), "yyyyMMdd")}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading || transactions.length === 0}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline ml-2">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
