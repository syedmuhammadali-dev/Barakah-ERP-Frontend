export function computeAdjustedStock(currentStock: number, delta: number): number {
  return Math.max(0, currentStock + delta);
}

export interface PriceCodeMapEntry {
  digit: string;
  letter: string;
}

/** Encodes a price's digits using the shop's custom digit->letter cipher
 *  (Settings > Price Code Language). Digits without a mapping pass through
 *  unchanged so a partial mapping still produces a readable code. */
export function encodePriceCode(
  value: number,
  map: PriceCodeMapEntry[],
): string {
  const lookup = new Map(map.map((entry) => [entry.digit, entry.letter]));
  const rounded = Math.round(value);
  return String(rounded)
    .split("")
    .map((char) => lookup.get(char) ?? char)
    .join("");
}
