import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ScoreRecord, Student } from "@/types/exam";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import html2canvas from "html2canvas";

const Certificate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const certRef = useRef<HTMLDivElement>(null);
  const state = location.state as {
    score: ScoreRecord;
    totalPoints: number;
    maxPoints: number;
    student: Student;
  } | null;

  if (!state) {
    navigate("/");
    return null;
  }

  const { score, totalPoints, maxPoints, student } = state;
  const scoreValue = score.total_score !== undefined ? score.total_score : totalPoints;
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const handleDownload = async () => {
    if (!certRef.current) return;
    // Clone the element to ensure proper rendering on mobile
    const clone = certRef.current.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.width = "800px";
    clone.style.height = "auto";
    document.body.appendChild(clone);

    // Wait for fonts/images to settle
    await new Promise((r) => setTimeout(r, 500));

    const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 800,
      height: clone.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 800,
      windowHeight: clone.scrollHeight,
      logging: false,
    });
    document.body.removeChild(clone);

    const link = document.createElement("a");
    link.download = `Sertifikat_CBT_${student.name.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Sertifikat</h1>
          <Button onClick={handleDownload} className="ml-auto gap-2">
            <Download className="w-4 h-4" /> Download
          </Button>
        </div>

        {/* Certificate */}
        <div className="overflow-auto">
          <div
            ref={certRef}
            style={{
              width: "800px",
              minHeight: "566px",
              padding: "40px",
              background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              position: "relative",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            }}
          >
            {/* Border */}
            <div style={{ position: "absolute", inset: "12px", border: "3px solid #1a4480", borderRadius: "12px" }} />
            <div style={{ position: "absolute", inset: "18px", border: "1px solid #d4a017", borderRadius: "8px" }} />

            <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "20px 40px" }}>
              <img
                src="https://spenzaga.github.io/assets/img/logo.png"
                alt="Logo"
                style={{ width: "60px", height: "60px", margin: "0 auto 12px", display: "block" }}
                crossOrigin="anonymous"
              />
              <h2 style={{ fontSize: "14px", color: "#1a4480", margin: 0, letterSpacing: "2px", textTransform: "uppercase" }}>
                SMP Negeri 1 Purbalingga
              </h2>
              <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1a4480", margin: "16px 0 4px", letterSpacing: "4px" }}>
                SERTIFIKAT
              </h1>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 24px" }}>
                Computer Based Test
              </p>

              <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 8px" }}>
                Diberikan kepada:
              </p>
              <h3 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
                {student.name}
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
                NIS: {student.nis} &nbsp;|&nbsp; Kelas: {student.class}
              </p>

              <table
                  style={{
                    width: "200px",
                    margin: "0 auto",
                    borderCollapse: "collapse",
                    backgroundColor: "#1a4480",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "16px 40px 4px",
                          fontSize: "36px",
                          fontWeight: 800,
                          color: "#ffffff",
                          WebkitTextFillColor: "#ffffff",
                        }}
                      >
                        {scoreValue}
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "0 40px 16px",
                          fontSize: "12px",
                          color: "#cbd5e1",
                          WebkitTextFillColor: "#cbd5e1",
                        }}
                      >
                        Nilai Ujian
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ height: "20px" }} />

              <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 4px" }}>
                Status: <strong>{score.status}</strong>
              </p>
              <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 24px" }}>
                Durasi: {score.duration}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "16px" }}>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Tanggal</p>
                  <p style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600, margin: 0 }}>{today}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Kepala Sekolah</p>
                  <div style={{ borderBottom: "1px solid #cbd5e1", width: "150px", marginBottom: "4px", marginTop: "30px" }} />
                  <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>NIP. _______________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
