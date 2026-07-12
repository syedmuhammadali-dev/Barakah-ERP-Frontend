export function computeAdjustedStock(currentStock: number, delta: number): number {
  return Math.max(0, currentStock + delta);
}
