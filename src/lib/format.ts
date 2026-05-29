export function toNumber(value: unknown, fallback = 0): number {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function formatMoney(value: unknown, currency = "SAR"): string {
  return `${currency} ${toNumber(value).toLocaleString()}`;
}

export function formatPercent(value: unknown, digits = 1): string {
  return `${toNumber(value).toFixed(digits)}%`;
}

export function formatDateValue(
  value: string | Date | null | undefined,
  fallback = "N/A",
): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : date.toLocaleDateString("en-PK");
}
