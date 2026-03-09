import { buildPdfDocument } from "../batches/pdf.js";

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function textCommand(x: number, y: number, fontSize: number, text: string) {
  return `BT /F1 ${fontSize} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET`;
}

function rectCommand(x: number, y: number, width: number, height: number) {
  return `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`;
}

export function buildRemnantLabelPdf(input: {
  code: string;
  materialLabel: string;
  lengthIn: number;
  widthIn: number;
  status: string;
  locationLabel?: string;
  createdDate: string;
}) {
  const pageWidth = 288;
  const pageHeight = 216;
  const commands = [
    rectCommand(16, 16, pageWidth - 32, pageHeight - 32),
    textCommand(28, 182, 18, "Craft & Board Remnant"),
    textCommand(28, 158, 14, input.code),
    textCommand(28, 136, 11, `Material: ${input.materialLabel}`),
    textCommand(28, 118, 11, `Size: ${input.lengthIn.toFixed(2)}" × ${input.widthIn.toFixed(2)}"`),
    textCommand(28, 100, 11, `Status: ${input.status}`),
    textCommand(28, 82, 11, `Location: ${input.locationLabel || "Unassigned"}`),
    textCommand(28, 64, 11, `Created: ${input.createdDate}`),
    textCommand(28, 42, 9, `Barcode-ready code: ${input.code}`)
  ];

  return buildPdfDocument([`0.3 w\n${commands.join("\n")}\n`], { width: pageWidth, height: pageHeight });
}
