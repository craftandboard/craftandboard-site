function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function textCommand(x: number, y: number, fontSize: number, text: string) {
  return `BT /F1 ${fontSize} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET`;
}

function pageStream(commands: string[]) {
  return `0.3 w\n${commands.join("\n")}\n`;
}

function buildPdfDocument(pageContents: string[], pageSize = { width: 612, height: 792 }) {
  const objects: string[] = [];

  const catalogObjectId = 1;
  const pagesObjectId = 2;
  const fontObjectId = 3;
  let nextObjectId = 4;

  const pageRefs: number[] = [];

  objects[catalogObjectId] = `<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`;
  objects[fontObjectId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;

  for (const content of pageContents) {
    const pageObjectId = nextObjectId++;
    const contentObjectId = nextObjectId++;
    pageRefs.push(pageObjectId);

    objects[contentObjectId] = `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}endstream`;
    objects[pageObjectId] =
      `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${pageSize.width} ${pageSize.height}] ` +
      `/Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
  }

  objects[pagesObjectId] = `<< /Type /Pages /Count ${pageRefs.length} /Kids [${pageRefs.map((id) => `${id} 0 R`).join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (let id = 1; id < objects.length; id += 1) {
    if (!objects[id]) continue;
    offsets[id] = Buffer.byteLength(pdf, "utf8");
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let id = 1; id < objects.length; id += 1) {
    const offset = offsets[id] ?? 0;
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export function buildPackingSlipPdf(input: {
  order: {
    id: string;
    source: string;
    status: string;
    customerName: string;
    shipByDate?: string;
    jobCount: number;
    partCount: number;
  };
  parts: Array<{
    labelCode: string;
    scanCode: string;
    material: string;
    width: number;
    depth: number;
    thickness: number;
    batchCode?: string;
    status: string;
  }>;
}) {
  const lines: string[] = [
    `Packing Slip - ${input.order.id}`,
    `Source: ${input.order.source}`,
    `Status: ${input.order.status}`,
    `Customer: ${input.order.customerName}`,
    `Ship By: ${input.order.shipByDate ?? "Not set"}`,
    `Jobs: ${input.order.jobCount}`,
    `Parts: ${input.order.partCount}`,
    "",
    "Included Parts"
  ];

  for (const part of input.parts) {
    lines.push(
      `${part.labelCode} | ${part.scanCode} | ${part.material} | ${part.width}" x ${part.depth}" x ${part.thickness}" | Batch ${part.batchCode ?? "UNBATCHED"} | ${part.status}`
    );
  }

  const linesPerPage = 42;
  const pages: string[] = [];

  for (let start = 0; start < lines.length; start += linesPerPage) {
    const pageLines = lines.slice(start, start + linesPerPage);
    const commands = pageLines.map((line, index) =>
      textCommand(40, 760 - index * 16, index === 0 ? 16 : 10, line)
    );
    pages.push(pageStream(commands));
  }

  return buildPdfDocument(pages);
}
