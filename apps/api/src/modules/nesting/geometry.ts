export function areaSqIn(widthIn: number, depthIn: number) {
  return Number((widthIn * depthIn).toFixed(3));
}

export function overlaps(
  a: { xIn: number; yIn: number; widthIn: number; depthIn: number },
  b: { xIn: number; yIn: number; widthIn: number; depthIn: number }
) {
  return !(
    a.xIn + a.widthIn <= b.xIn ||
    b.xIn + b.widthIn <= a.xIn ||
    a.yIn + a.depthIn <= b.yIn ||
    b.yIn + b.depthIn <= a.yIn
  );
}
