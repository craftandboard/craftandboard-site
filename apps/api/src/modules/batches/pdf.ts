function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function textCommand(x: number, y: number, fontSize: number, text: string) {
  return `BT /F1 ${fontSize} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET`;
}

function rectCommand(x: number, y: number, width: number, height: number) {
  return `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`;
}

function pageStream(commands: string[]) {
  return `0.3 w\n${commands.join("\n")}\n`;
}

export function buildPdfDocument(pageContents: string[], pageSize = { width: 612, height: 792 }) {
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

export function buildLabelPdf(input: {
  batchCode: string;
  labels: Array<{
    labelCode: string;
    scanCode: string;
    material: string;
    width: number;
    depth: number;
    edgeBandPattern: string;
    source: string;
  }>;
}) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36;
  const gutter = 18;
  const cardWidth = (pageWidth - margin * 2 - gutter) / 2;
  const cardHeight = 210;
  const rowsPerPage = 3;
  const cardsPerPage = rowsPerPage * 2;
  const pages: string[] = [];

  for (let start = 0; start < input.labels.length; start += cardsPerPage) {
    const pageLabels = input.labels.slice(start, start + cardsPerPage);
    const commands = [
      textCommand(margin, pageHeight - 28, 18, `Craft & Board Labels - ${input.batchCode}`),
      textCommand(margin, pageHeight - 48, 10, `Count ${pageLabels.length} on this page`)
    ];

    pageLabels.forEach((label, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = margin + col * (cardWidth + gutter);
      const top = pageHeight - 78 - row * (cardHeight + gutter);
      const y = top - cardHeight;

      commands.push(rectCommand(x, y, cardWidth, cardHeight));
      commands.push(textCommand(x + 12, top - 24, 12, label.labelCode));
      commands.push(textCommand(x + 12, top - 44, 10, label.scanCode));
      commands.push(textCommand(x + 12, top - 68, 10, `Material: ${label.material}`));
      commands.push(textCommand(x + 12, top - 86, 10, `Size: ${label.width}" x ${label.depth}"`));
      commands.push(textCommand(x + 12, top - 104, 10, `Edge: ${label.edgeBandPattern}`));
      commands.push(textCommand(x + 12, top - 122, 10, `Batch: ${input.batchCode}`));
      commands.push(textCommand(x + 12, top - 140, 10, `Source: ${label.source}`));
    });

    pages.push(pageStream(commands));
  }

  return buildPdfDocument(pages);
}

export function buildTravelerPdf(input: {
  batch: {
    code: string;
    status: string;
    material: string;
    partCount: number;
    jobCount: number;
    source: string;
  };
  sheets: Array<{
    sheetIndex: number;
    material: string;
    sheetWidth: number;
    sheetHeight: number;
    placements: Array<{
      labelCode: string;
      x: number;
      y: number;
      width: number;
      depth: number;
    }>;
  }>;
  parts: Array<{
    labelCode: string;
    scanCode: string;
    material: string;
    width: number;
    depth: number;
    edgeBandPattern: string;
    status: string;
  }>;
}) {
  const lines: string[] = [
    `Batch Traveler - ${input.batch.code}`,
    `Status: ${input.batch.status}`,
    `Material: ${input.batch.material}`,
    `Source: ${input.batch.source}`,
    `Parts: ${input.batch.partCount}`,
    `Jobs: ${input.batch.jobCount}`,
    "",
    "Sheets"
  ];

  if (input.sheets.length === 0) {
    lines.push("No sheet layouts generated.");
  } else {
    for (const sheet of input.sheets) {
      lines.push(
        `Sheet ${sheet.sheetIndex}: ${sheet.material} ${sheet.sheetWidth}" x ${sheet.sheetHeight}" (${sheet.placements.length} placements)`
      );
      for (const placement of sheet.placements.slice(0, 8)) {
        lines.push(
          `  ${placement.labelCode} @ (${placement.x}, ${placement.y}) ${placement.width}" x ${placement.depth}"`
        );
      }
      if (sheet.placements.length > 8) {
        lines.push(`  ... ${sheet.placements.length - 8} more placements`);
      }
    }
  }

  lines.push("", "Included Parts");

  for (const part of input.parts) {
    lines.push(
      `${part.labelCode} | ${part.scanCode} | ${part.material} | ${part.width}" x ${part.depth}" | ${part.edgeBandPattern} | ${part.status}`
    );
  }

  const linesPerPage = 42;
  const pages: string[] = [];

  for (let start = 0; start < lines.length; start += linesPerPage) {
    const pageLines = lines.slice(start, start + linesPerPage);
    const commands = pageLines.map((line, index) => textCommand(40, 760 - index * 16, index === 0 ? 16 : 10, line));
    pages.push(pageStream(commands));
  }

  return buildPdfDocument(pages);
}
