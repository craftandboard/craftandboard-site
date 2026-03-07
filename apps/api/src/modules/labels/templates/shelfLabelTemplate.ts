export const SHELF_LABEL_PRINT_CSS = `
  @page { size: auto; margin: 0.2in; }
  body { font-family: Arial, Helvetica, sans-serif; background: #f3f6f4; margin: 0; padding: 24px; color: #111; }
  .shelf-label-batch { display: flex; flex-direction: column; gap: 16px; }
  .shelf-label {
    width: 4in;
    min-width: 4in;
    height: 2in;
    background: #fff;
    border: 2px solid #111;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .shelf-label__row { display: grid; }
  .shelf-label__row--top { grid-template-columns: 0.88in 1.5in 0.7in 0.92in; min-height: 0.48in; }
  .shelf-label__row--middle { grid-template-columns: 0.4in 1.55in 1.02in 1.03in; min-height: 0.72in; }
  .shelf-label__row--bottom { grid-template-columns: 2.95in 1.05in; min-height: 0.8in; }
  .label-cell { border-right: 1.5px solid #111; border-bottom: 1.5px solid #111; padding: 0.07in 0.08in; overflow: hidden; }
  .no-right { border-right: none; }
  .row-bottom { border-bottom: none; }
  .meta-label { font-size: 0.11in; font-weight: 700; letter-spacing: 0.01in; text-transform: uppercase; }
  .meta-value { margin-top: 0.03in; font-size: 0.23in; font-weight: 800; line-height: 1.05; }
  .name-value { font-size: 0.28in; }
  .dim-value { font-size: 0.26in; }
  .ship-value { font-size: 0.24in; }
  .vertical-shelf {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.24in;
    font-weight: 900;
    letter-spacing: 0.03in;
  }
  .barcode-wrap { display: flex; flex-direction: column; gap: 0.03in; justify-content: center; height: 100%; }
  .barcode-svg svg { width: 100%; height: 0.38in; }
  .barcode-text { font-size: 0.14in; font-weight: 700; letter-spacing: 0.01in; word-break: break-all; }
  .muted-empty { color: #666; }
  .print-toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
  @media print {
    body { background: #fff; padding: 0; }
    .print-toolbar { display: none; }
    .shelf-label-batch { gap: 0.08in; }
  }
`;
