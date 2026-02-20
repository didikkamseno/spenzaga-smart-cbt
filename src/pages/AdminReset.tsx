import { useState, useEffect } from "react";
import { db, ref, get, set } from "@/lib/firebase";
import { Student } from "@/types/exam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RotateCcw, Lock, Unlock, Loader2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminReset = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [examBlocked, setExamBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studSnap, scoreSnap, configSnap] = await Promise.all([
        get(ref(db, "students")),
        get(ref(db, "scores")),
        get(ref(db, "config/exam_blocked")),
      ]);
      if (studSnap.exists()) { const d = studSnap.val(); setStudents(Array.isArray(d) ? d : Object.values(d)); }
      if (scoreSnap.exists()) { const d = scoreSnap.val(); setScores(Array.isArray(d) ? d : Object.values(d)); }
      if (configSnap.exists()) setExamBlocked(configSnap.val());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const scoreMap = new Map(scores.map((s) => [s.student_id, s]));

  const resetStudent = async (studentId: string) => {
    if (!confirm("Reset hasil ujian siswa ini? Data skor akan dihapus.")) return;
    const updated = scores.filter((s) => s.student_id !== studentId);
    await set(ref(db, "scores"), updated.length > 0 ? updated : null);
    setScores(updated);
    toast({ title: "Berhasil", description: "Hasil ujian siswa telah direset" });
  };

  const resetAll = async () => {
    if (!confirm("Reset SEMUA hasil ujian? Tindakan ini tidak dapat dibatalkan!")) return;
    await set(ref(db, "scores"), null);
    setScores([]);
    toast({ title: "Berhasil", description: "Semua hasil ujian telah direset" });
  };

  const toggleBlock = async (blocked: boolean) => {
    await set(ref(db, "config/exam_blocked"), blocked);
    setExamBlocked(blocked);
    toast({
      title: blocked ? "Ujian Diblokir" : "Ujian Dibuka",
      description: blocked ? "Siswa tidak dapat mengakses ujian" : "Siswa dapat mengakses ujian",
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Access control */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {examBlocked ? <Lock className="w-4 h-4 text-destructive" /> : <Unlock className="w-4 h-4 text-success" />}
            Kontrol Akses Ujian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Status Ujian</p>
              <p className="text-xs text-muted-foreground">
                {examBlocked ? "Ujian diblokir — siswa tidak dapat mengakses" : "Ujian terbuka — siswa dapat mengerjakan"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${examBlocked ? "text-destructive" : "text-success"}`}>
                {examBlocked ? "Diblokir" : "Terbuka"}
              </span>
              <Switch checked={!examBlocked} onCheckedChange={(checked) => toggleBlock(!checked)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset all */}
      <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-sm">Reset Semua Hasil Ujian</p>
              <p className="text-xs text-muted-foreground">Menghapus semua data skor. Tidak dapat dibatalkan.</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={resetAll} className="gap-1.5">
            <RotateCcw className="w-4 h-4" />Reset Semua
          </Button>
        </CardContent>
      </Card>

      {/* Per student reset */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">Reset Per Siswa</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, i) => {
                const hasScore = scoreMap.has(s.student_id);
                return (
                  <TableRow key={s.student_id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{s.nis}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.class}</TableCell>
                    <TableCell className="text-center">
                      {hasScore ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" />Belum
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!hasScore}
                        onClick={() => resetStudent(s.student_id)}
                        className="gap-1.5"
                      >
                        <RotateCcw className="w-3 h-3" />Reset
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReset;
