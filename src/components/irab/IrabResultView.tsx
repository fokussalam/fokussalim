import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AnalysisWord {
  word: string;
  word_type: string;
  irab_position: string;
  irab_sign: string;
  explanation: string;
}

interface Props {
  arabicText: string;
  sentenceType: string;
  words: AnalysisWord[];
  comment?: string | null;
  status?: string;
}

const typeColor = (type: string) => {
  if (type === "Isim") return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  if (type === "Fi'il") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
};

export function IrabResultView({ arabicText, sentenceType, words, comment, status }: Props) {
  return (
    <div className="space-y-4">
      {/* Arabic Text */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-2xl font-arabic leading-loose text-foreground text-center" dir="rtl">
            {arabicText}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="outline" className="text-sm">{sentenceType}</Badge>
            {status && (
              <Badge variant={status === "auto_reviewed" ? "outline" : "default"} className="text-xs">
                {status === "auto_reviewed" ? "Analisis AI" : status === "reviewed" ? "Dinilai Ustadz" : "Menunggu"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Table */}
      {words.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Analisis I'rab</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kata</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Kedudukan</TableHead>
                  <TableHead>Tanda I'rab</TableHead>
                  <TableHead>Penjelasan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {words.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-arabic text-lg" dir="rtl">{item.word}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor(item.word_type)}`}>
                        {item.word_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{item.irab_position}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.irab_sign}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">{item.explanation || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Comment */}
      {comment && (
        <Card>
          <CardContent className="pt-6">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Catatan:</p>
              <p className="text-sm text-muted-foreground">{comment}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
