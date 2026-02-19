import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useExam } from "@/context/ExamContext";
import { db, ref, get, set } from "@/lib/firebase";
import { Question } from "@/types/exam";
import { buildScoreRecord } from "@/lib/scoring";
import QuestionCard from "@/components/QuestionCard";
import NavigationPanel from "@/components/NavigationPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Send, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Exam = () => {
  const { student } = useExam();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [violations, setViolations] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (!student) {
      navigate("/");
      return;
    }

    const load = async () => {
      try {
        // Check if already taken
        const scoreSnap = await get(ref(db, `scores/${student.student_id}`));
        if (scoreSnap.exists()) {
          setAlreadyTaken(true);
          setLoading(false);
          return;
        }
        // Load questions
        const qSnap = await get(ref(db, "questions"));
        if (qSnap.exists()) {
          setQuestions(qSnap.val());
        }
      } catch {
        toast({ title: "Error", description: "Gagal memuat soal", variant: "destructive" });
      }
      setLoading(false);
    };
    load();
  }, [student]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Security: visibility change
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        setViolations((v) => {
          const next = v + 1;
          toast({
            title: `⚠️ Pelanggaran ${next}/5`,
            description: "Jangan berpindah tab! Jawaban akan otomatis terkirim setelah 5 pelanggaran.",
            variant: "destructive",
          });
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Security: keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && ["p", "s", "c", "u"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        setViolations((v) => v + 1);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Security: context menu
  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleSubmit = useCallback(async () => {
    if (!student || hasSubmitted.current) return;
    hasSubmitted.current = true;
    setSubmitting(true);

    const duration = formatTime(elapsed);
    const { record, totalPoints, maxPoints } = buildScoreRecord(student.student_id, questions, answers, duration);

    try {
      await set(ref(db, `scores/${student.student_id}`), record);
      navigate("/result", {
        state: { score: record, totalPoints, maxPoints, student },
      });
    } catch {
      toast({ title: "Error", description: "Gagal mengirim jawaban", variant: "destructive" });
      hasSubmitted.current = false;
      setSubmitting(false);
    }
  }, [student, questions, answers, elapsed, navigate]);

  // Auto-submit on 5 violations
  useEffect(() => {
    if (violations >= 5 && !hasSubmitted.current) {
      toast({ title: "⛔ Auto Submit", description: "Jawaban otomatis terkirim karena pelanggaran.", variant: "destructive" });
      handleSubmit();
    }
  }, [violations, handleSubmit]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (alreadyTaken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertTriangle className="w-16 h-16 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Ujian Sudah Dikerjakan</h2>
          <p className="text-muted-foreground mb-4">Anda hanya dapat mengerjakan ujian satu kali.</p>
          <Button onClick={() => navigate("/")}>Kembali</Button>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const answeredMap: Record<string, boolean> = {};
  questions.forEach((q) => {
    const a = answers[q.question_id];
    answeredMap[q.question_id] = a !== undefined && a !== "" && (Array.isArray(a) ? a.length > 0 : true);
  });

  return (
    <div className="min-h-screen bg-background no-select">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">{formatTime(elapsed)}</span>
          </div>
          <h1 className="text-sm font-bold hidden sm:block">CBT SMP Negeri 1 Purbalingga</h1>
          <div className="flex items-center gap-2">
            {violations > 0 && (
              <span className="text-xs bg-destructive/80 px-2 py-0.5 rounded-full">
                ⚠️ {violations}/5
              </span>
            )}
            <span className="text-xs opacity-80">
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <QuestionCard
              question={currentQ}
              index={currentIndex}
              answer={answers[currentQ.question_id]}
              onChange={(val) => setAnswers((prev) => ({ ...prev, [currentQ.question_id]: val }))}
            />
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex((i) => i + 1)} className="gap-1">
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1 bg-success hover:bg-success/90 text-success-foreground"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Kirim Jawaban
            </Button>
          )}
        </div>
      </div>

      <NavigationPanel
        total={questions.length}
        current={currentIndex}
        answered={answeredMap}
        questionIds={questions.map((q) => q.question_id)}
        onNavigate={setCurrentIndex}
      />
    </div>
  );
};

export default Exam;
