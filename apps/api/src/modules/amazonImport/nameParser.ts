export function deriveCustomerLastName(fullName: string): string {
  const tokens = fullName
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return "UNKNOWN";
  }

  return (tokens.at(-1) ?? "UNKNOWN").toUpperCase();
}
