import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Pencil, Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

const transactionSchema = z.object({
  type: z.enum(["pemasukan", "pengeluaran"], { required_error: "Pilih jenis transaksi" }),
  category: z.enum([
    "iuran_bulanan", "infaq", "donasi", "konsumsi", "transport", "peralatan", "lainnya",
    "kas_safa", "kas_hit", "kas_ips", "kas_qurban", "kas_umroh", "kas_dll"
  ], { required_error: "Pilih kategori" }),
  amount: z.string().min(1, "Jumlah wajib diisi").refine((val) => {
    const num = parseInt(val.replace(/\D/g, ""));
    return !isNaN(num) && num > 0;
  }, "Jumlah harus lebih dari 0").refine((val) => {
    const num = parseInt(val.replace(/\D/g, ""));
    return num <= 1000000000;
  }, "Jumlah maksimal 1 miliar"),
  transaction_date: z.date({ required_error: "Tanggal transaksi wajib diisi" }),
  description: z.string().max(255, "Keterangan maksimal 255 karakter").optional().or(z.literal("")),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  transaction?: Transaction;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const incomeCategories = [
  { value: "iuran_bulanan", label: "Iuran Bulanan" },
  { value: "infaq", label: "Infaq" },
  { value: "donasi", label: "Donasi" },
  { value: "kas_safa", label: "Kas Safa" },
  { value: "kas_hit", label: "Kas Hit" },
  { value: "kas_ips", label: "Kas IPS" },
  { value: "kas_qurban", label: "Kas Qurban" },
  { value: "kas_umroh", label: "Kas Umroh" },
  { value: "kas_dll", label: "Kas Lainnya" },
  { value: "lainnya", label: "Lainnya" },
];

const expenseCategories = [
  { value: "konsumsi", label: "Konsumsi" },
  { value: "transport", label: "Transport" },
  { value: "peralatan", label: "Peralatan" },
  { value: "kas_safa", label: "Kas Safa" },
  { value: "kas_hit", label: "Kas Hit" },
  { value: "kas_ips", label: "Kas IPS" },
  { value: "kas_qurban", label: "Kas Qurban" },
  { value: "kas_umroh", label: "Kas Umroh" },
  { value: "kas_dll", label: "Kas Lainnya" },
  { value: "lainnya", label: "Lainnya" },
];

export function TransactionForm({ transaction, onSuccess, trigger }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEdit = !!transaction;

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "pemasukan",
      category: "iuran_bulanan",
      description: "",
      amount: "",
    },
  });

  const selectedType = form.watch("type");
  const categories = selectedType === "pemasukan" ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (transaction && open) {
      const formattedAmount = new Intl.NumberFormat("id-ID").format(Number(transaction.amount));
      form.reset({
        type: transaction.type,
        category: transaction.category,
        amount: formattedAmount,
        transaction_date: new Date(transaction.transaction_date),
        description: transaction.description || "",
      });
    } else if (!transaction && open) {
      form.reset({
        type: "pemasukan",
        category: "iuran_bulanan",
        description: "",
        amount: "",
      });
    }
  }, [transaction, open, form]);

  const handleTypeChange = (value: "pemasukan" | "pengeluaran") => {
    form.setValue("type", value);
    form.setValue("category", value === "pemasukan" ? "iuran_bulanan" : "konsumsi");
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(numericValue));
  };

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const amount = parseInt(data.amount.replace(/\D/g, ""));

      if (isEdit && transaction) {
        const { error } = await supabase
          .from("transactions")
          .update({
            type: data.type,
            category: data.category,
            amount: amount,
            transaction_date: format(data.transaction_date, "yyyy-MM-dd"),
            description: data.description?.trim() || null,
          })
          .eq("id", transaction.id);

        if (error) throw error;

        toast({ title: "Berhasil!", description: "Transaksi berhasil diperbarui." });
      } else {
        const { error } = await supabase.from("transactions").insert({
          type: data.type,
          category: data.category,
          amount: amount,
          transaction_date: format(data.transaction_date, "yyyy-MM-dd"),
          description: data.description?.trim() || null,
          recorded_by: user?.id || null,
        });

        if (error) throw error;

        toast({ title: "Berhasil!", description: "Transaksi berhasil ditambahkan." });
      }

      form.reset({ type: "pemasukan", category: "iuran_bulanan", description: "", amount: "" });
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast({ title: "Gagal", description: error.message || "Gagal menyimpan transaksi.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            {isEdit ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">{isEdit ? "Edit" : "Tambah Transaksi"}</span>
            <span className="sm:hidden">{isEdit ? "Edit" : "Tambah"}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Transaksi" : "Tambah Transaksi"}</DialogTitle>
          <DialogDescription>{isEdit ? "Perbarui data transaksi." : "Catat transaksi keuangan komunitas."}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Transaksi *</FormLabel>
                  <div className="flex gap-2">
                    <Button type="button" variant={field.value === "pemasukan" ? "default" : "outline"}
                      className={cn("flex-1", field.value === "pemasukan" && "bg-emerald-600 hover:bg-emerald-700")}
                      onClick={() => handleTypeChange("pemasukan")}>Pemasukan</Button>
                    <Button type="button" variant={field.value === "pengeluaran" ? "default" : "outline"}
                      className={cn("flex-1", field.value === "pengeluaran" && "bg-red-600 hover:bg-red-700")}
                      onClick={() => handleTypeChange("pengeluaran")}>Pengeluaran</Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah (Rp) *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                      <Input placeholder="0" className="pl-10" inputMode="numeric" {...field}
                        onChange={(e) => field.onChange(formatCurrency(e.target.value))} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange}
                        disabled={(date) => date > new Date()} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Keterangan transaksi..." className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Batal</Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}