import * as XLSX from "xlsx";
import { apiRequest } from "@/lib/api";

/**
 * Shape returned by GET /api/export/data — every table the signed-in user
 * owns. Never includes password hashes/salts or session tokens (enforced
 * server-side, not just by omission here).
 */
export interface ExportedData {
  exportedAt: string;
  user: Record<string, unknown> | null;
  business: Record<string, unknown> | null;
  subscription: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  products: Record<string, unknown>[];
  sales: Record<string, unknown>[];
  saleItems: Record<string, unknown>[];
  bills: Record<string, unknown>[];
  billItems: Record<string, unknown>[];
  suppliers: Record<string, unknown>[];
  supplierReturns: Record<string, unknown>[];
  salesmen: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  zakatRecords: Record<string, unknown>[];
}

const SHEET_LABELS: Record<keyof Omit<ExportedData, "exportedAt">, string> = {
  user: "User",
  business: "Business",
  subscription: "Subscription",
  settings: "Settings",
  products: "Products",
  sales: "Sales",
  saleItems: "Sale Items",
  bills: "Bills",
  billItems: "Bill Items",
  suppliers: "Suppliers",
  supplierReturns: "Supplier Returns",
  salesmen: "Salesmen",
  customers: "Customers",
  zakatRecords: "Zakat Records",
};

export async function fetchExportData(): Promise<ExportedData> {
  return apiRequest<ExportedData>("/api/export/data");
}

function toRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (value && typeof value === "object") return [value as Record<string, unknown>];
  return [];
}

export function buildWorkbook(data: ExportedData): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  for (const [key, label] of Object.entries(SHEET_LABELS) as [keyof typeof SHEET_LABELS, string][]) {
    const rows = toRows(data[key]);
    const sheet = rows.length > 0 ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([["No data"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, label.slice(0, 31));
  }
  return workbook;
}

export async function exportAllDataToExcel(filenamePrefix = "barakah-export"): Promise<void> {
  const data = await fetchExportData();
  const workbook = buildWorkbook(data);
  const stamp = data.exportedAt.slice(0, 10);
  XLSX.writeFile(workbook, `${filenamePrefix}-${stamp}.xlsx`);
}

/**
 * Parses an uploaded .xlsx File entirely in the browser — nothing is sent
 * anywhere, nothing is persisted. Used by the data-viewer page, whose
 * displayed data lives only in component state and disappears on
 * navigation or reload.
 */
export async function readWorkbookFile(file: File): Promise<Record<string, Record<string, unknown>[]>> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const result: Record<string, Record<string, unknown>[]> = {};
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    result[sheetName] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  }
  return result;
}
