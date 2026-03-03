import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, BorderStyle, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import mammoth from "mammoth";
import { Question } from "@/types/exam";

const typeLabels: Record<string, string> = {
  TF: "Benar/Salah", MC: "Pilihan Ganda", MR: "Jawaban Ganda",
  TI: "Isian Singkat", MG: "Menjodohkan", SEQ: "Urutan", NUMG: "Numerik",
};

const borders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
} as const;

const makeCell = (text: string, bold = false, width?: number) =>
  new TableCell({
    borders,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20 })] })],
  });

export const exportToWord = async (questions: Question[], filename: string) => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      makeCell("No", true, 5),
      makeCell("ID", true, 8),
      makeCell("Tipe", true, 10),
      makeCell("Soal", true, 25),
      makeCell("Jawaban 1", true, 13),
      makeCell("Jawaban 2", true, 13),
      makeCell("Jawaban 3", true, 13),
      makeCell("Jawaban 4", true, 13),
    ],
  });

  const dataRows = questions.map((q, i) =>
    new TableRow({
      children: [
        makeCell(String(i + 1), false, 5),
        makeCell(q.question_id, false, 8),
        makeCell(typeLabels[q.question_type] || q.question_type, false, 10),
        makeCell(q.question_text, false, 25),
        makeCell(q.answer_1, false, 13),
        makeCell(q.answer_2, false, 13),
        makeCell(q.answer_3, false, 13),
        makeCell(q.answer_4, false, 13),
      ],
    })
  );

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Bank Soal", bold: true, size: 28 })],
        }),
        new Paragraph({ text: "" }),
        new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "Catatan: Jawaban benar ditandai dengan tanda * di awal.", italics: true, size: 18 })],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
};

export const importFromWord = async (file: File): Promise<any[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;

  // Parse the text - expect tab or multi-space separated values
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Find header line
  const headerIdx = lines.findIndex(l =>
    l.toLowerCase().includes("question_id") || l.toLowerCase().includes("id") && l.toLowerCase().includes("soal")
  );

  if (headerIdx === -1) {
    // Try parsing as structured blocks: "1. Soal: ... \n Jawaban: ..."
    return parseBlockFormat(lines);
  }

  const headers = lines[headerIdx].split(/\t+|\s{2,}/);
  const dataLines = lines.slice(headerIdx + 1);

  return dataLines.map(line => {
    const cols = line.split(/\t+|\s{2,}/);
    const row: any = {};
    headers.forEach((h, i) => {
      row[h.trim()] = cols[i]?.trim() || "";
    });
    return row;
  }).filter(row => row.question_text || row.question_id);
};

function parseBlockFormat(lines: string[]): any[] {
  const questions: any[] = [];
  let current: any = null;

  for (const line of lines) {
    // Match numbered question pattern: "1." or "Q1."
    const numMatch = line.match(/^(\d+|Q\d+)[.)]\s*(.*)/i);
    if (numMatch) {
      if (current) questions.push(current);
      current = {
        question_id: "",
        question_type: "MC",
        question_text: numMatch[2],
        answer_1: "", answer_2: "", answer_3: "", answer_4: "",
        points: "10",
      };
      continue;
    }

    if (!current) continue;

    // Match answer options: "A." "B." "C." "D." or "a)" "b)" etc.
    const ansMatch = line.match(/^([A-Da-d])[.)]\s*(.*)/);
    if (ansMatch) {
      const idx = ansMatch[1].toLowerCase().charCodeAt(0) - 96; // a=1, b=2...
      if (idx >= 1 && idx <= 4) {
        current[`answer_${idx}`] = ansMatch[2];
      }
      continue;
    }

    // Append to question text if no pattern matched
    if (current && !current.answer_1) {
      current.question_text += " " + line;
    }
  }

  if (current) questions.push(current);

  return questions.map((q, i) => ({
    ...q,
    question_id: q.question_id || `Q${i + 1}`,
  }));
}
