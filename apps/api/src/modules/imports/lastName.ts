const particles = new Set(["de", "del", "della", "di", "du", "la", "le", "st.", "st", "van", "von"]);

export function extractCustomerLastName(fullName: string): string {
  const tokens = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return "Unknown";
  }

  if (tokens.length === 1) {
    return tokens[0];
  }

  const last = tokens.at(-1) ?? tokens[0];
  const previous = tokens.at(-2);

  if (previous && particles.has(previous.toLowerCase())) {
    return `${previous} ${last}`;
  }

  return last;
}
