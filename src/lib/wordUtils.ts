import {
  Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
  WidthType, BorderStyle, ShadingType, AlignmentType,
} from "docx";
import mammoth from "mammoth";

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

/**
 * Export rows of data to a .docx file containing a single table.
 * The first row of the table is the header (column keys), so the file
 * can be re-imported with importFromWord.
 */
export const exportToWord = async (
  data: Record<string, any>[],
  filename: string,
  title = filename.replace(/_/g, " ")
) => {
  const columns = data.length ? Object.keys(data[0]) : [];
  const colWidth = columns.length ? Math.floor(14400 / columns.length) : 14400;

  const headerRow = new TableRow({
    tableHeader: true,
    children: columns.map((c) => new TableCell({
      borders: cellBorders,
      width: { size: colWidth, type: WidthType.DXA },
      shading: { fill: "D5E8F0", type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: c, bold: true })] })],
    })),
  });

  const bodyRows = data.map((row) => new TableRow({
    children: columns.map((c) => new TableCell({
      borders: cellBorders,
      width: { size: colWidth, type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun(String(row[c] ?? ""))] })],
    })),
  }));

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840, orientation: "landscape" as any },
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [new TextRun({ text: title, bold: true, size: 28 })],
        }),
        ...(columns.length
          ? [new Table({
              width: { size: colWidth * columns.length, type: WidthType.DXA },
              columnWidths: columns.map(() => colWidth),
              rows: [headerRow, ...bodyRows],
            })]
          : [new Paragraph("Tidak ada data")]),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/**
 * Import rows from a .docx file. Reads the first table; the first row is
 * treated as the header. Returns array of objects keyed by header text.
 */
export const importFromWord = async (file: File): Promise<Record<string, string>[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  const docEl = new DOMParser().parseFromString(html, "text/html");
  const table = docEl.querySelector("table");
  if (!table) throw new Error("Tabel tidak ditemukan dalam dokumen");

  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length < 2) throw new Error("Tabel tidak memiliki data");

  const cellText = (r: Element) =>
    Array.from(r.querySelectorAll("th,td")).map((c) => (c.textContent || "").trim());

  const headers = cellText(rows[0]);
  return rows.slice(1).map((r) => {
    const cells = cellText(r);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = cells[i] ?? ""; });
    return obj;
  });
};
