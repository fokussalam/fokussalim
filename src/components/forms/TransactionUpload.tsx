import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface TransactionUploadProps {
  onSuccess?: () => void;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

const VALID_TYPES = ["pemasukan", "pengeluaran"];
const VALID_CATEGORIES = [
  "iuran_bulanan", "infaq", "donasi", "konsumsi", "transport", "peralatan", "lainnya",
  "kas_safa", "kas_hit", "kas_ips", "kas_qurban", "kas_umroh", "kas_dll"
];

export function TransactionUpload({ onSuccess }: TransactionUploadProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const templateData = [
      {
        tanggal: format(new Date(), "yyyy-MM-dd"),
        jenis: "pemasukan",
        kategori: "iuran_bulanan",
        jumlah: 100000,
        keterangan: "Contoh iuran bulanan",
      },
      {
        tanggal: format(new Date(), "yyyy-MM-dd"),
        jenis: "pengeluaran",
        kategori: "konsumsi",
        jumlah: 50000,
        keterangan: "Contoh pengeluaran konsumsi",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    // Add instruction sheet
    const instructions = [
      ["PETUNJUK PENGISIAN TEMPLATE"],
      [""],
      ["Kolom yang wajib diisi:"],
      ["1. tanggal - Format: YYYY-MM-DD (contoh: 2026-01-15)"],
      ["2. jenis - Pilihan: pemasukan atau pengeluaran"],
      ["3. kategori - Pilihan sesuai jenis:"],
      ["   - Pemasukan: iuran_bulanan, infaq, donasi, kas_safa, kas_hit, kas_ips, kas_qurban, kas_umroh, kas_dll, lainnya"],
      ["   - Pengeluaran: konsumsi, transport, peralatan, kas_safa, kas_hit, kas_ips, kas_qurban, kas_umroh, kas_dll, lainnya"],
      ["4. jumlah - Angka tanpa format (contoh: 100000)"],
      ["5. keterangan - Opsional, deskripsi transaksi"],
      [""],
      ["KATEGORI KAS:"],
      ["- kas_safa: Kas Safa"],
      ["- kas_hit: Kas Hit"],
      ["- kas_ips: Kas IPS"],
      ["- kas_qurban: Kas Qurban"],
      ["- kas_umroh: Kas Umroh"],
      ["- kas_dll: Kas Lainnya"],
      [""],
      ["PENTING:"],
      ["- Pastikan format tanggal benar"],
      ["- Kategori kas bisa digunakan untuk pemasukan maupun pengeluaran"],
      ["- Jumlah harus berupa angka positif"],
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Petunjuk");

    // Set column widths
    ws["!cols"] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 35 },
    ];

    XLSX.writeFile(wb, "Template_Upload_Transaksi.xlsx");
  };

  const parseExcelDate = (value: any): string | null => {
    if (!value) return null;

    // If it's a number (Excel serial date)
    if (typeof value === "number") {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
      }
    }

    // If it's a string
    if (typeof value === "string") {
      const dateStr = value.trim();
      // Try parsing YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      // Try parsing DD/MM/YYYY
      const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (ddmmyyyy) {
        return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
      }
    }

    // If it's a Date object
    if (value instanceof Date) {
      return format(value, "yyyy-MM-dd");
    }

    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak ditemukan");

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        throw new Error("File kosong atau format tidak valid");
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i] as Record<string, any>;
        const rowNum = i + 2; // Excel row number (1-indexed + header)

        try {
          // Validate required fields
          const tanggal = parseExcelDate(row.tanggal);
          const jenis = String(row.jenis || "").toLowerCase().trim();
          const kategori = String(row.kategori || "").toLowerCase().trim();
          const jumlah = Number(row.jumlah);
          const keterangan = String(row.keterangan || "").trim();

          if (!tanggal) {
            errors.push(`Baris ${rowNum}: Format tanggal tidak valid`);
            failed++;
            continue;
          }

          if (!VALID_TYPES.includes(jenis)) {
            errors.push(`Baris ${rowNum}: Jenis transaksi tidak valid (${jenis})`);
            failed++;
            continue;
          }

          if (!VALID_CATEGORIES.includes(kategori)) {
            errors.push(`Baris ${rowNum}: Kategori tidak valid (${kategori})`);
            failed++;
            continue;
          }

          // Validate category matches type
          const kasCategories = ["kas_safa", "kas_hit", "kas_ips", "kas_qurban", "kas_umroh", "kas_dll"];
          const incomeCategories = ["iuran_bulanan", "infaq", "donasi", "lainnya", ...kasCategories];
          const expenseCategories = ["konsumsi", "transport", "peralatan", "lainnya", ...kasCategories];
          
          if (jenis === "pemasukan" && !incomeCategories.includes(kategori)) {
            errors.push(`Baris ${rowNum}: Kategori ${kategori} tidak valid untuk pemasukan`);
            failed++;
            continue;
          }
          
          if (jenis === "pengeluaran" && !expenseCategories.includes(kategori)) {
            errors.push(`Baris ${rowNum}: Kategori ${kategori} tidak valid untuk pengeluaran`);
            failed++;
            continue;
          }

          if (isNaN(jumlah) || jumlah <= 0) {
            errors.push(`Baris ${rowNum}: Jumlah tidak valid`);
            failed++;
            continue;
          }

          // Insert to database
          const { error } = await supabase.from("transactions").insert({
            type: jenis as "pemasukan" | "pengeluaran",
            category: kategori as any,
            amount: jumlah,
            transaction_date: tanggal,
            description: keterangan || null,
            recorded_by: user.id,
          });

          if (error) {
            errors.push(`Baris ${rowNum}: ${error.message}`);
            failed++;
          } else {
            success++;
          }
        } catch (err: any) {
          errors.push(`Baris ${rowNum}: ${err.message}`);
          failed++;
        }
      }

      setResult({ success, failed, errors: errors.slice(0, 10) });

      if (success > 0) {
        toast({
          title: "Upload Berhasil",
          description: `${success} transaksi berhasil ditambahkan${failed > 0 ? `, ${failed} gagal` : ""}`,
        });
        onSuccess?.();
      } else if (failed > 0) {
        toast({
          title: "Upload Gagal",
          description: "Tidak ada transaksi yang berhasil ditambahkan",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memproses file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const resetAndClose = () => {
    setResult(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetAndClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Upload</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Transaksi</DialogTitle>
          <DialogDescription>
            Upload file Excel untuk menambahkan transaksi secara massal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">Template Excel</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Download template untuk format yang benar
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Memproses file...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Klik atau drop file Excel</p>
                  <p className="text-xs text-muted-foreground">.xlsx atau .xls</p>
                </div>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex gap-4">
                {result.success > 0 && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{result.success} berhasil</span>
                  </div>
                )}
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{result.failed} gagal</span>
                  </div>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">Error:</p>
                      <ul className="text-xs text-red-700 dark:text-red-300 space-y-0.5">
                        {result.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {result.failed > 10 && (
                          <li className="italic">...dan {result.failed - 10} error lainnya</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={resetAndClose}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
