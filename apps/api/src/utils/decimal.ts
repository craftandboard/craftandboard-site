export function decimalToNumber(value: { toNumber(): number } | null | undefined) {
  return value ? value.toNumber() : 0;
}

