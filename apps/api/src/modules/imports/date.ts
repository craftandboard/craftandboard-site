export function parseInputDate(value: string): Date {
  const trimmed = value.trim();
  const isoCandidate = new Date(trimmed);

  if (!Number.isNaN(isoCandidate.getTime())) {
    return isoCandidate;
  }

  const mmDash = /^(\d{2})-(\d{2})-(\d{4})$/;
  const mmSlash = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = trimmed.match(mmDash) ?? trimmed.match(mmSlash);

  if (match) {
    const [, month, day, year] = match;
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }

  throw new Error(`Unable to parse date value: ${value}`);
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDateLabel(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${month}/${day}/${year}`;
}
