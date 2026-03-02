import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Home,
  BookOpen,
  Loader2,
} from "lucide-react";

interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  surah: { number: number; name: string; englishName: string };
  juz: number;
  page: number;
}

interface TranslationAyah {
  number: number;
  numberInSurah: number;
  text: string;
  surah: { number: number; name: string };
}

const TOTAL_PAGES = 604;

const SURAH_LIST = [
  { number: 1, name: "الفاتحة", latin: "Al-Fatihah", startPage: 1 },
  { number: 2, name: "البقرة", latin: "Al-Baqarah", startPage: 2 },
  { number: 3, name: "آل عمران", latin: "Ali 'Imran", startPage: 50 },
  { number: 4, name: "النساء", latin: "An-Nisa'", startPage: 77 },
  { number: 5, name: "المائدة", latin: "Al-Ma'idah", startPage: 106 },
  { number: 6, name: "الأنعام", latin: "Al-An'am", startPage: 128 },
  { number: 7, name: "الأعراف", latin: "Al-A'raf", startPage: 151 },
  { number: 8, name: "الأنفال", latin: "Al-Anfal", startPage: 177 },
  { number: 9, name: "التوبة", latin: "At-Tawbah", startPage: 187 },
  { number: 10, name: "يونس", latin: "Yunus", startPage: 208 },
  { number: 11, name: "هود", latin: "Hud", startPage: 221 },
  { number: 12, name: "يوسف", latin: "Yusuf", startPage: 235 },
  { number: 13, name: "الرعد", latin: "Ar-Ra'd", startPage: 249 },
  { number: 14, name: "إبراهيم", latin: "Ibrahim", startPage: 255 },
  { number: 15, name: "الحجر", latin: "Al-Hijr", startPage: 262 },
  { number: 16, name: "النحل", latin: "An-Nahl", startPage: 267 },
  { number: 17, name: "الإسراء", latin: "Al-Isra'", startPage: 282 },
  { number: 18, name: "الكهف", latin: "Al-Kahf", startPage: 293 },
  { number: 19, name: "مريم", latin: "Maryam", startPage: 305 },
  { number: 20, name: "طه", latin: "Taha", startPage: 312 },
  { number: 21, name: "الأنبياء", latin: "Al-Anbiya'", startPage: 322 },
  { number: 22, name: "الحج", latin: "Al-Hajj", startPage: 332 },
  { number: 23, name: "المؤمنون", latin: "Al-Mu'minun", startPage: 342 },
  { number: 24, name: "النور", latin: "An-Nur", startPage: 350 },
  { number: 25, name: "الفرقان", latin: "Al-Furqan", startPage: 359 },
  { number: 26, name: "الشعراء", latin: "Ash-Shu'ara'", startPage: 367 },
  { number: 27, name: "النمل", latin: "An-Naml", startPage: 377 },
  { number: 28, name: "القصص", latin: "Al-Qasas", startPage: 385 },
  { number: 29, name: "العنكبوت", latin: "Al-'Ankabut", startPage: 396 },
  { number: 30, name: "الروم", latin: "Ar-Rum", startPage: 404 },
  { number: 31, name: "لقمان", latin: "Luqman", startPage: 411 },
  { number: 32, name: "السجدة", latin: "As-Sajdah", startPage: 415 },
  { number: 33, name: "الأحزاب", latin: "Al-Ahzab", startPage: 418 },
  { number: 34, name: "سبأ", latin: "Saba'", startPage: 428 },
  { number: 35, name: "فاطر", latin: "Fatir", startPage: 434 },
  { number: 36, name: "يس", latin: "Ya-Sin", startPage: 440 },
  { number: 37, name: "الصافات", latin: "As-Saffat", startPage: 446 },
  { number: 38, name: "ص", latin: "Sad", startPage: 453 },
  { number: 39, name: "الزمر", latin: "Az-Zumar", startPage: 458 },
  { number: 40, name: "غافر", latin: "Ghafir", startPage: 467 },
  { number: 41, name: "فصلت", latin: "Fussilat", startPage: 477 },
  { number: 42, name: "الشورى", latin: "Ash-Shura", startPage: 483 },
  { number: 43, name: "الزخرف", latin: "Az-Zukhruf", startPage: 489 },
  { number: 44, name: "الدخان", latin: "Ad-Dukhan", startPage: 496 },
  { number: 45, name: "الجاثية", latin: "Al-Jathiyah", startPage: 499 },
  { number: 46, name: "الأحقاف", latin: "Al-Ahqaf", startPage: 502 },
  { number: 47, name: "محمد", latin: "Muhammad", startPage: 507 },
  { number: 48, name: "الفتح", latin: "Al-Fath", startPage: 511 },
  { number: 49, name: "الحجرات", latin: "Al-Hujurat", startPage: 515 },
  { number: 50, name: "ق", latin: "Qaf", startPage: 518 },
  { number: 51, name: "الذاريات", latin: "Adh-Dhariyat", startPage: 520 },
  { number: 52, name: "الطور", latin: "At-Tur", startPage: 523 },
  { number: 53, name: "النجم", latin: "An-Najm", startPage: 526 },
  { number: 54, name: "القمر", latin: "Al-Qamar", startPage: 528 },
  { number: 55, name: "الرحمن", latin: "Ar-Rahman", startPage: 531 },
  { number: 56, name: "الواقعة", latin: "Al-Waqi'ah", startPage: 534 },
  { number: 57, name: "الحديد", latin: "Al-Hadid", startPage: 537 },
  { number: 58, name: "المجادلة", latin: "Al-Mujadalah", startPage: 542 },
  { number: 59, name: "الحشر", latin: "Al-Hashr", startPage: 545 },
  { number: 60, name: "الممتحنة", latin: "Al-Mumtahanah", startPage: 549 },
  { number: 61, name: "الصف", latin: "As-Saff", startPage: 551 },
  { number: 62, name: "الجمعة", latin: "Al-Jumu'ah", startPage: 553 },
  { number: 63, name: "المنافقون", latin: "Al-Munafiqun", startPage: 554 },
  { number: 64, name: "التغابن", latin: "At-Taghabun", startPage: 556 },
  { number: 65, name: "الطلاق", latin: "At-Talaq", startPage: 558 },
  { number: 66, name: "التحريم", latin: "At-Tahrim", startPage: 560 },
  { number: 67, name: "الملك", latin: "Al-Mulk", startPage: 562 },
  { number: 68, name: "القلم", latin: "Al-Qalam", startPage: 564 },
  { number: 69, name: "الحاقة", latin: "Al-Haqqah", startPage: 566 },
  { number: 70, name: "المعارج", latin: "Al-Ma'arij", startPage: 568 },
  { number: 71, name: "نوح", latin: "Nuh", startPage: 570 },
  { number: 72, name: "الجن", latin: "Al-Jinn", startPage: 572 },
  { number: 73, name: "المزمل", latin: "Al-Muzzammil", startPage: 574 },
  { number: 74, name: "المدثر", latin: "Al-Muddaththir", startPage: 575 },
  { number: 75, name: "القيامة", latin: "Al-Qiyamah", startPage: 577 },
  { number: 76, name: "الإنسان", latin: "Al-Insan", startPage: 578 },
  { number: 77, name: "المرسلات", latin: "Al-Mursalat", startPage: 580 },
  { number: 78, name: "النبأ", latin: "An-Naba'", startPage: 582 },
  { number: 79, name: "النازعات", latin: "An-Nazi'at", startPage: 583 },
  { number: 80, name: "عبس", latin: "'Abasa", startPage: 585 },
  { number: 81, name: "التكوير", latin: "At-Takwir", startPage: 586 },
  { number: 82, name: "الانفطار", latin: "Al-Infitar", startPage: 587 },
  { number: 83, name: "المطففين", latin: "Al-Mutaffifin", startPage: 587 },
  { number: 84, name: "الانشقاق", latin: "Al-Inshiqaq", startPage: 589 },
  { number: 85, name: "البروج", latin: "Al-Buruj", startPage: 590 },
  { number: 86, name: "الطارق", latin: "At-Tariq", startPage: 591 },
  { number: 87, name: "الأعلى", latin: "Al-A'la", startPage: 591 },
  { number: 88, name: "الغاشية", latin: "Al-Ghashiyah", startPage: 592 },
  { number: 89, name: "الفجر", latin: "Al-Fajr", startPage: 593 },
  { number: 90, name: "البلد", latin: "Al-Balad", startPage: 594 },
  { number: 91, name: "الشمس", latin: "Ash-Shams", startPage: 595 },
  { number: 92, name: "الليل", latin: "Al-Layl", startPage: 595 },
  { number: 93, name: "الضحى", latin: "Ad-Duha", startPage: 596 },
  { number: 94, name: "الشرح", latin: "Ash-Sharh", startPage: 596 },
  { number: 95, name: "التين", latin: "At-Tin", startPage: 597 },
  { number: 96, name: "العلق", latin: "Al-'Alaq", startPage: 597 },
  { number: 97, name: "القدر", latin: "Al-Qadr", startPage: 598 },
  { number: 98, name: "البينة", latin: "Al-Bayyinah", startPage: 598 },
  { number: 99, name: "الزلزلة", latin: "Az-Zalzalah", startPage: 599 },
  { number: 100, name: "العاديات", latin: "Al-'Adiyat", startPage: 599 },
  { number: 101, name: "القارعة", latin: "Al-Qari'ah", startPage: 600 },
  { number: 102, name: "التكاثر", latin: "At-Takathur", startPage: 600 },
  { number: 103, name: "العصر", latin: "Al-'Asr", startPage: 601 },
  { number: 104, name: "الهمزة", latin: "Al-Humazah", startPage: 601 },
  { number: 105, name: "الفيل", latin: "Al-Fil", startPage: 601 },
  { number: 106, name: "قريش", latin: "Quraysh", startPage: 602 },
  { number: 107, name: "الماعون", latin: "Al-Ma'un", startPage: 602 },
  { number: 108, name: "الكوثر", latin: "Al-Kawthar", startPage: 602 },
  { number: 109, name: "الكافرون", latin: "Al-Kafirun", startPage: 603 },
  { number: 110, name: "النصر", latin: "An-Nasr", startPage: 603 },
  { number: 111, name: "المسد", latin: "Al-Masad", startPage: 603 },
  { number: 112, name: "الإخلاص", latin: "Al-Ikhlas", startPage: 604 },
  { number: 113, name: "الفلق", latin: "Al-Falaq", startPage: 604 },
  { number: 114, name: "الناس", latin: "An-Nas", startPage: 604 },
];

const JUZ_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

export default function Mushaf() {
  const [page, setPage] = useState(1);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [translations, setTranslations] = useState<TranslationAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState("1");

  const currentJuz = [...JUZ_PAGES].reverse().findIndex((p) => p <= page);
  const juzNumber = currentJuz >= 0 ? JUZ_PAGES.length - currentJuz : 1;
  const currentSurah = SURAH_LIST.filter((s) => s.startPage <= page).pop();

  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const [arabicRes, transRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/page/${pageNum}/id.indonesian`),
      ]);

      if (!arabicRes.ok || !transRes.ok) throw new Error("Gagal memuat data");

      const arabicData = await arabicRes.json();
      const transData = await transRes.json();

      setAyahs(arabicData.data.ayahs || []);
      setTranslations(transData.data.ayahs || []);
    } catch (err) {
      setError("Gagal memuat halaman. Periksa koneksi internet Anda.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(page);
    setPageInput(page.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, fetchPage]);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= TOTAL_PAGES) setPage(p);
  };

  const handlePageInput = () => {
    const num = parseInt(pageInput);
    if (!isNaN(num) && num >= 1 && num <= TOTAL_PAGES) setPage(num);
  };

  // Group ayahs by surah for display
  const groupedAyahs = ayahs.reduce<{ surahName: string; surahNumber: number; ayahs: { arabic: Ayah; translation: TranslationAyah }[] }[]>(
    (groups, ayah, idx) => {
      const translation = translations[idx];
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.surahNumber === ayah.surah.number) {
        lastGroup.ayahs.push({ arabic: ayah, translation });
      } else {
        groups.push({
          surahName: ayah.surah.name,
          surahNumber: ayah.surah.number,
          ayahs: [{ arabic: ayah, translation }],
        });
      }
      return groups;
    },
    []
  );

  return (
    <>
      <Helmet>
        <title>Mushaf Al-Quran - Fokus Salim</title>
        <meta name="description" content="Baca Mushaf Al-Quran Madinah dengan terjemahan Bahasa Indonesia" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-1" />
                  Beranda
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h1 className="text-base font-bold text-foreground">Mushaf Al-Quran</h1>
              </div>
              <div className="w-20" />
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => goToPage(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1.5 flex-1 justify-center">
                <Input
                  type="number"
                  min={1}
                  max={TOTAL_PAGES}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePageInput()}
                  onBlur={handlePageInput}
                  className="w-16 h-8 text-center text-sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">/ {TOTAL_PAGES}</span>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => goToPage(page + 1)}
                disabled={page === TOTAL_PAGES}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => goToPage(TOTAL_PAGES)}
                disabled={page === TOTAL_PAGES}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick nav */}
            <div className="flex items-center gap-2 mt-2">
              <Select
                value={currentSurah?.number.toString() || ""}
                onValueChange={(val) => {
                  const s = SURAH_LIST.find((s) => s.number.toString() === val);
                  if (s) goToPage(s.startPage);
                }}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Pilih Surah" />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-64">
                  {SURAH_LIST.map((s) => (
                    <SelectItem key={s.number} value={s.number.toString()} className="text-xs">
                      {s.number}. {s.latin} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={juzNumber.toString()}
                onValueChange={(val) => goToPage(JUZ_PAGES[parseInt(val) - 1])}
              >
                <SelectTrigger className="h-8 text-xs w-24">
                  <SelectValue placeholder="Juz" />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-64">
                  {JUZ_PAGES.map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()} className="text-xs">
                      Juz {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto px-4 py-6">
          {/* Page info badge */}
          <div className="flex items-center justify-center gap-3 mb-6 text-xs text-muted-foreground">
            <span>Halaman {page}</span>
            <span>•</span>
            <span>Juz {juzNumber}</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => fetchPage(page)}>Coba Lagi</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedAyahs.map((group) => (
                <div key={`${group.surahNumber}-${group.ayahs[0].arabic.numberInSurah}`}>
                  {/* Surah header when new surah starts on this page */}
                  {group.ayahs[0].arabic.numberInSurah === 1 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 text-center">
                      <h2 className="text-xl font-bold text-foreground font-arabic">
                        {group.surahName}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {SURAH_LIST.find((s) => s.number === group.surahNumber)?.latin} — Surah ke-{group.surahNumber}
                      </p>
                      {/* Bismillah (not for At-Tawbah) */}
                      {group.surahNumber !== 9 && group.surahNumber !== 1 && (
                        <p className="text-lg mt-3 font-arabic text-foreground leading-loose">
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                        </p>
                      )}
                    </div>
                  )}

                  {/* Ayahs */}
                  {group.ayahs.map(({ arabic, translation }) => (
                    <div
                      key={arabic.number}
                      className="border-b border-border/50 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
                    >
                      {/* Ayah number badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {arabic.numberInSurah}
                        </span>
                      </div>

                      {/* Arabic text */}
                      <p
                        className="text-right text-xl leading-[2.5] font-arabic text-foreground mb-3"
                        dir="rtl"
                      >
                        {arabic.text}
                      </p>

                      {/* Translation */}
                      <p className="text-sm text-muted-foreground leading-relaxed pl-10">
                        {translation?.text}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Bottom navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Sebelumnya
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {TOTAL_PAGES}
            </span>
            <Button
              variant="outline"
              onClick={() => goToPage(page + 1)}
              disabled={page === TOTAL_PAGES}
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
