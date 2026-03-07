export function formatAxis(value: number) {
  return value.toFixed(3);
}

export function formatComment(value: string) {
  return value.replace(/[()]/g, "").trim();
}
