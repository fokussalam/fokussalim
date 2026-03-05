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
  Eye,
  EyeOff,
} from "lucide-react";
import { SURAH_LIST, JUZ_PAGES, TOTAL_PAGES } from "@/data/mushafData";

interface UthmaniVerse {
  id: number;
  verse_key: string;
  text_uthmani: string;
}

interface TranslationAyah {
  number: number;
  numberInSurah: number;
  text: string;
  surah: { number: number; name: string };
}

export default function Mushaf() {
  const [page, setPage] = useState(1);
  const [verses, setVerses] = useState<UthmaniVerse[]>([]);
  const [translations, setTranslations] = useState<TranslationAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState("1");
  const [showTranslation, setShowTranslation] = useState(true);

  const currentJuz = [...JUZ_PAGES].reverse().findIndex((p) => p <= page);
  const juzNumber = currentJuz >= 0 ? JUZ_PAGES.length - currentJuz : 1;
  const currentSurah = SURAH_LIST.filter((s) => s.startPage <= page).pop();

  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const [uthmaniRes, translationRes] = await Promise.all([
        fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${pageNum}`),
        fetch(`https://api.alquran.cloud/v1/page/${pageNum}/id.indonesian`),
      ]);

      if (!uthmaniRes.ok) throw new Error("Gagal memuat ayat");
      const uthmaniData = await uthmaniRes.json();
      setVerses(uthmaniData.verses || []);

      if (translationRes.ok) {
        const translationData = await translationRes.json();
        setTranslations(translationData.data?.ayahs || []);
      }
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

  // Group verses by surah
  const groupedVerses = verses.reduce<{ surahNum: number; surahName: string; ayahs: UthmaniVerse[] }[]>(
    (groups, verse) => {
      const [surahStr] = verse.verse_key.split(":");
      const surahNum = parseInt(surahStr);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.surahNum === surahNum) {
        lastGroup.ayahs.push(verse);
      } else {
        const surah = SURAH_LIST.find((s) => s.number === surahNum);
        groups.push({
          surahNum,
          surahName: surah?.latin || `Surah ${surahNum}`,
          ayahs: [verse],
        });
      }
      return groups;
    },
    []
  );

  // Group translations by surah
  const groupedTranslations = translations.reduce<{ surahName: string; surahNumber: number; ayahs: TranslationAyah[] }[]>(
    (groups, ayah) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.surahNumber === ayah.surah.number) {
        lastGroup.ayahs.push(ayah);
      } else {
        groups.push({
          surahName: ayah.surah.name,
          surahNumber: ayah.surah.number,
          ayahs: [ayah],
        });
      }
      return groups;
    },
    []
  );

  return (
    <>
      <Helmet>
        <title>Mushaf Al-Quran Madinah - Fokus Salim</title>
        <meta name="description" content="Baca Mushaf Al-Quran cetakan Madinah dengan terjemahan Bahasa Indonesia" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-1" />
                  Beranda
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h1 className="text-base font-bold text-foreground">Mushaf Madinah</h1>
              </div>
              <Button
                variant={showTranslation ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTranslation(!showTranslation)}
                className="gap-1.5 text-xs"
              >
                {showTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Terjemah</span>
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => goToPage(1)} disabled={page === 1}>
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => goToPage(page - 1)} disabled={page === 1}>
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

              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => goToPage(page + 1)} disabled={page === TOTAL_PAGES}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => goToPage(TOTAL_PAGES)} disabled={page === TOTAL_PAGES}>
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
        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Page info badge */}
          <div className="flex items-center justify-center gap-3 mb-4 text-xs text-muted-foreground">
            <span>Halaman {page}</span>
            <span>•</span>
            <span>Juz {juzNumber}</span>
            {currentSurah && (
              <>
                <span>•</span>
                <span>{currentSurah.latin}</span>
              </>
            )}
          </div>

          {/* Arabic Mushaf Text */}
          <div className="bg-card rounded-xl border border-border p-5 md:p-8 mb-6 shadow-sm">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive text-sm mb-3">{error}</p>
                <Button size="sm" onClick={() => fetchPage(page)}>Coba Lagi</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedVerses.map((group) => {
                  const ayahNum = parseInt(group.ayahs[0].verse_key.split(":")[1]);
                  const isStartOfSurah = ayahNum === 1;
                  const surah = SURAH_LIST.find((s) => s.number === group.surahNum);

                  return (
                    <div key={`${group.surahNum}-${group.ayahs[0].verse_key}`}>
                      {isStartOfSurah && (
                        <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-3 mb-4 text-center">
                          <p className="text-lg font-bold text-primary font-arabic">{surah?.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{surah?.latin} — Surah ke-{group.surahNum}</p>
                          {group.surahNum !== 1 && group.surahNum !== 9 && (
                            <p className="text-xl font-arabic text-foreground mt-3 leading-loose">
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                            </p>
                          )}
                        </div>
                      )}
                      <div className="text-right leading-[3rem] md:leading-[3.5rem]" dir="rtl">
                        {group.ayahs.map((verse) => {
                          const verseNum = verse.verse_key.split(":")[1];
                          return (
                            <span key={verse.id} className="font-arabic text-2xl md:text-3xl text-foreground">
                              {verse.text_uthmani}
                              {" "}
                              <span className="inline-flex items-center justify-center text-primary text-sm font-sans mx-1">
                                ﴿{verseNum}﴾
                              </span>
                              {" "}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Translation Section */}
          {showTranslation && !loading && !error && (
            <div className="bg-card rounded-xl border border-border p-4 md:p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Terjemah Bahasa Indonesia
              </h3>

              <div className="space-y-4">
                {groupedTranslations.map((group) => (
                  <div key={`${group.surahNumber}-${group.ayahs[0].numberInSurah}`}>
                    {group.ayahs[0].numberInSurah === 1 && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 mb-3 text-center">
                        <p className="text-xs font-semibold text-primary">
                          {SURAH_LIST.find((s) => s.number === group.surahNumber)?.latin} — Surah ke-{group.surahNumber}
                        </p>
                      </div>
                    )}
                    {group.ayahs.map((ayah) => (
                      <div key={ayah.number} className="flex gap-3 py-2 border-b border-border/30 last:border-b-0">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                          {ayah.numberInSurah}
                        </span>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                          {ayah.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => goToPage(page - 1)} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Sebelumnya
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {TOTAL_PAGES}
            </span>
            <Button variant="outline" onClick={() => goToPage(page + 1)} disabled={page === TOTAL_PAGES}>
              Selanjutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
