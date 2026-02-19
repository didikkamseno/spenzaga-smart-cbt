import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExam } from "@/context/ExamContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { User, BookOpen, ArrowRight } from "lucide-react";

const Confirmation = () => {
  const { student } = useExam();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  if (!student) {
    navigate("/");
    return null;
  }

  const infoItems = [
    { label: "No. Absen", value: student.absen },
    { label: "NIS", value: student.nis },
    { label: "Nama", value: student.name },
    { label: "Kelas", value: student.class },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-xl border-0 animate-fade-in">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-primary">Konfirmasi Data</h1>
          <p className="text-muted-foreground text-sm">
            Periksa data Anda sebelum memulai ujian
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-6">
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
            {infoItems.map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">
                Saya menyatakan bahwa saya akan mengerjakan ujian ini dengan
                <strong> jujur</strong>, <strong>mandiri</strong>, dan tidak akan
                menyalin jawaban dari sumber manapun.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(c) => setAgreed(c === true)}
            />
            <label htmlFor="agree" className="text-sm cursor-pointer text-foreground">
              Saya menyetujui pernyataan kejujuran di atas
            </label>
          </div>

          <Button
            className="w-full h-12 text-base font-semibold gap-2"
            disabled={!agreed}
            onClick={() => navigate("/exam")}
          >
            Mulai Ujian
            <ArrowRight className="w-5 h-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Confirmation;
