import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  allTransactions?: Transaction[];
}

const CATEGORY_CONFIG: Record<string, { label: string; color: [number, number, number] }> = {
  kas_safa: { label: "Kas Safa", color: [59, 130, 246] },
  kas_hit: { label: "Kas Hit", color: [147, 51, 234] },
  kas_ips: { label: "Kas IPS", color: [249, 115, 22] },
  kas_qurban: { label: "Kas Qurban", color: [16, 185, 129] },
  kas_umroh: { label: "Kas Umroh", color: [6, 182, 212] },
  kas_dll: { label: "Kas Lainnya", color: [107, 114, 128] },
  umum: { label: "Umum", color: [245, 158, 11] },
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
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const kasCategories = ["kas_safa", "kas_hit", "kas_ips", "kas_qurban", "kas_umroh", "kas_dll"];

export function TransactionExport({ transactions, allTransactions }: TransactionExportProps) {
  const [loading, setLoading] = useState(false);

  // Use allTransactions for complete report, fallback to transactions
  const dataSource = allTransactions || transactions;

  const prepareData = (data: Transaction[]) => {
    return data.map((t, index) => ({
      No: index + 1,
      Tanggal: format(new Date(t.transaction_date), "d MMM yyyy", { locale: id }),
      Jenis: t.type === "pemasukan" ? "Pemasukan" : "Pengeluaran",
      Kategori: getCategoryLabel(t.category),
      Keterangan: t.description || "-",
      Jumlah: Number(t.amount),
    }));
  };

  const calculateTotals = (data: Transaction[]) => {
    const income = data.filter((t) => t.type === "pemasukan").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = data.filter((t) => t.type === "pengeluaran").reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  };

  const groupTransactionsByCategory = (data: Transaction[]) => {
    const grouped: Record<string, Transaction[]> = {
      umum: [],
      kas_safa: [],
      kas_hit: [],
      kas_ips: [],
      kas_qurban: [],
      kas_umroh: [],
      kas_dll: [],
    };

    data.forEach((t) => {
      if (kasCategories.includes(t.category)) {
        grouped[t.category].push(t);
      } else {
        grouped.umum.push(t);
      }
    });

    return grouped;
  };

  // Export current tab only
  const exportToExcel = async () => {
    setLoading(true);
    try {
      const data = prepareData(transactions);
      const totals = calculateTotals(transactions);

      const summaryData = [
        ...data,
        { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "", Jumlah: "" as any },
        { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "Total Pemasukan", Jumlah: totals.income },
        { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "Total Pengeluaran", Jumlah: totals.expense },
        { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "Saldo", Jumlah: totals.balance },
      ];

      const ws = XLSX.utils.json_to_sheet(summaryData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");

      ws["!cols"] = [{ wch: 5 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 18 }];

      XLSX.writeFile(wb, `Laporan_Keuangan_${format(new Date(), "yyyyMMdd")}.xlsx`);
    } finally {
      setLoading(false);
    }
  };

  // Export ALL categories in separate sheets
  const exportAllToExcel = async () => {
    setLoading(true);
    try {
      const grouped = groupTransactionsByCategory(dataSource);
      const wb = XLSX.utils.book_new();

      // Add summary sheet first
      const summaryRows: any[] = [
        { Kategori: "RINGKASAN LAPORAN KEUANGAN", Pemasukan: "", Pengeluaran: "", Saldo: "" },
        { Kategori: `Tanggal: ${format(new Date(), "d MMMM yyyy", { locale: id })}`, Pemasukan: "", Pengeluaran: "", Saldo: "" },
        { Kategori: "", Pemasukan: "", Pengeluaran: "", Saldo: "" },
        { Kategori: "Kategori", Pemasukan: "Pemasukan", Pengeluaran: "Pengeluaran", Saldo: "Saldo" },
      ];

      let grandTotalIncome = 0;
      let grandTotalExpense = 0;

      Object.entries(grouped).forEach(([key, trans]) => {
        if (trans.length > 0) {
          const totals = calculateTotals(trans);
          grandTotalIncome += totals.income;
          grandTotalExpense += totals.expense;
          summaryRows.push({
            Kategori: CATEGORY_CONFIG[key]?.label || key,
            Pemasukan: totals.income,
            Pengeluaran: totals.expense,
            Saldo: totals.balance,
          });
        }
      });

      summaryRows.push({ Kategori: "", Pemasukan: "", Pengeluaran: "", Saldo: "" });
      summaryRows.push({
        Kategori: "TOTAL KESELURUHAN",
        Pemasukan: grandTotalIncome,
        Pengeluaran: grandTotalExpense,
        Saldo: grandTotalIncome - grandTotalExpense,
      });

      const summaryWs = XLSX.utils.json_to_sheet(summaryRows, { skipHeader: true });
      summaryWs["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, "Ringkasan");

      // Add individual category sheets
      Object.entries(grouped).forEach(([key, trans]) => {
        if (trans.length > 0) {
          const data = prepareData(trans);
          const totals = calculateTotals(trans);

          const sheetData = [
            ...data,
            { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "", Jumlah: "" as any },
            { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "Total Pemasukan", Jumlah: totals.income },
            { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "Total Pengeluaran", Jumlah: totals.expense },
            { No: "", Tanggal: "", Jenis: "", Kategori: "", Keterangan: "Saldo", Jumlah: totals.balance },
          ];

          const ws = XLSX.utils.json_to_sheet(sheetData);
          ws["!cols"] = [{ wch: 5 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 18 }];
          XLSX.utils.book_append_sheet(wb, ws, CATEGORY_CONFIG[key]?.label || key);
        }
      });

      XLSX.writeFile(wb, `Laporan_Keuangan_Lengkap_${format(new Date(), "yyyyMMdd")}.xlsx`);
    } finally {
      setLoading(false);
    }
  };

  // Export current tab to PDF
  const exportToPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const totals = calculateTotals(transactions);

      doc.setFontSize(18);
      doc.text("Laporan Keuangan", pageWidth / 2, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text("Salim - Komunitas Pengajian", pageWidth / 2, 28, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Periode: ${format(new Date(), "MMMM yyyy", { locale: id })}`, pageWidth / 2, 35, { align: "center" });

      doc.setFillColor(16, 185, 129);
      doc.rect(14, 42, 55, 18, "F");
      doc.setFillColor(239, 68, 68);
      doc.rect(77, 42, 55, 18, "F");
      doc.setFillColor(59, 130, 246);
      doc.rect(140, 42, 55, 18, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("Pemasukan", 41.5, 48, { align: "center" });
      doc.text("Pengeluaran", 104.5, 48, { align: "center" });
      doc.text("Saldo", 167.5, 48, { align: "center" });
      doc.setFontSize(10);
      doc.text(formatCurrency(totals.income), 41.5, 56, { align: "center" });
      doc.text(formatCurrency(totals.expense), 104.5, 56, { align: "center" });
      doc.text(formatCurrency(totals.balance), 167.5, 56, { align: "center" });

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

      addFooter(doc);
      doc.save(`Laporan_Keuangan_${format(new Date(), "yyyyMMdd")}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  // Export ALL categories to single PDF with sections
  const exportAllToPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const grouped = groupTransactionsByCategory(dataSource);

      // Title page with summary
      doc.setFontSize(20);
      doc.text("LAPORAN KEUANGAN LENGKAP", pageWidth / 2, 25, { align: "center" });
      doc.setFontSize(14);
      doc.text("Fokus Salim - Komunitas Pengajian", pageWidth / 2, 35, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Tanggal: ${format(new Date(), "d MMMM yyyy", { locale: id })}`, pageWidth / 2, 45, { align: "center" });

      // Summary table
      let grandTotalIncome = 0;
      let grandTotalExpense = 0;
      const summaryData: any[] = [];

      Object.entries(grouped).forEach(([key, trans]) => {
        if (trans.length > 0) {
          const totals = calculateTotals(trans);
          grandTotalIncome += totals.income;
          grandTotalExpense += totals.expense;
          summaryData.push([
            CATEGORY_CONFIG[key]?.label || key,
            formatCurrency(totals.income),
            formatCurrency(totals.expense),
            formatCurrency(totals.balance),
            trans.length,
          ]);
        }
      });

      summaryData.push([
        "TOTAL KESELURUHAN",
        formatCurrency(grandTotalIncome),
        formatCurrency(grandTotalExpense),
        formatCurrency(grandTotalIncome - grandTotalExpense),
        dataSource.length,
      ]);

      autoTable(doc, {
        startY: 55,
        head: [["Kategori", "Pemasukan", "Pengeluaran", "Saldo", "Transaksi"]],
        body: summaryData,
        headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: (data) => {
          if (data.row.index === summaryData.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [226, 232, 240];
          }
        },
      });

      // Add individual category sections
      Object.entries(grouped).forEach(([key, trans]) => {
        if (trans.length > 0) {
          doc.addPage();
          const config = CATEGORY_CONFIG[key];
          const totals = calculateTotals(trans);

          // Category header
          doc.setFillColor(...(config?.color || [107, 114, 128]));
          doc.rect(0, 0, pageWidth, 35, "F");

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(16);
          doc.text(config?.label || key, pageWidth / 2, 15, { align: "center" });
          doc.setFontSize(10);
          doc.text(`${trans.length} Transaksi`, pageWidth / 2, 23, { align: "center" });
          doc.text(`Saldo: ${formatCurrency(totals.balance)}`, pageWidth / 2, 30, { align: "center" });

          // Summary boxes
          doc.setFillColor(16, 185, 129);
          doc.rect(14, 42, 55, 16, "F");
          doc.setFillColor(239, 68, 68);
          doc.rect(77, 42, 55, 16, "F");
          doc.setFillColor(59, 130, 246);
          doc.rect(140, 42, 55, 16, "F");

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.text("Pemasukan", 41.5, 48, { align: "center" });
          doc.text("Pengeluaran", 104.5, 48, { align: "center" });
          doc.text("Saldo", 167.5, 48, { align: "center" });
          doc.setFontSize(9);
          doc.text(formatCurrency(totals.income), 41.5, 55, { align: "center" });
          doc.text(formatCurrency(totals.expense), 104.5, 55, { align: "center" });
          doc.text(formatCurrency(totals.balance), 167.5, 55, { align: "center" });

          // Transaction table
          doc.setTextColor(0, 0, 0);
          const tableData = trans.map((t, index) => [
            index + 1,
            format(new Date(t.transaction_date), "d MMM yyyy", { locale: id }),
            t.type === "pemasukan" ? "Pemasukan" : "Pengeluaran",
            getCategoryLabel(t.category),
            t.description || "-",
            formatCurrency(Number(t.amount)),
          ]);

          autoTable(doc, {
            startY: 65,
            head: [["No", "Tanggal", "Jenis", "Sub Kategori", "Keterangan", "Jumlah"]],
            body: tableData,
            headStyles: { fillColor: config?.color || [107, 114, 128], fontSize: 9 },
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
        }
      });

      addFooter(doc);
      doc.save(`Laporan_Keuangan_Lengkap_${format(new Date(), "yyyyMMdd")}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  const addFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
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
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading || dataSource.length === 0}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline ml-2">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={exportToExcel} disabled={transactions.length === 0}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Excel (Tab Ini)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} disabled={transactions.length === 0}>
          <FileText className="w-4 h-4 mr-2" />
          PDF (Tab Ini)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAllToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-primary" />
          <span className="font-medium">Excel Lengkap (Semua Kas)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAllToPDF}>
          <FileText className="w-4 h-4 mr-2 text-primary" />
          <span className="font-medium">PDF Lengkap (Semua Kas)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
