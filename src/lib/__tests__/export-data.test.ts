import * as XLSX from "xlsx";
import { buildWorkbook, readWorkbookFile, type ExportedData } from "../export-data";

const sampleData: ExportedData = {
  exportedAt: "2026-01-01T00:00:00.000Z",
  user: { id: "u1", email: "a@b.com" },
  business: { businessName: "Test Shop" },
  subscription: null,
  settings: null,
  products: [
    { id: 1, name: "Widget", sku: "SKU1" },
    { id: 2, name: "Gadget", sku: "SKU2" },
  ],
  sales: [],
  saleItems: [],
  bills: [],
  billItems: [],
  suppliers: [],
  supplierReturns: [],
  salesmen: [],
  customers: [],
  zakatRecords: [],
};

function workbookToFile(workbook: XLSX.WorkBook, name: string): File {
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const file = new File([buffer], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  // jsdom (this test environment) doesn't implement File#arrayBuffer, unlike
  // every real browser — polyfill it for the test only.
  if (typeof file.arrayBuffer !== "function") {
    (file as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = () =>
      Promise.resolve(buffer);
  }
  return file;
}

describe("export-data round trip", () => {
  it("builds a workbook with one sheet per table, including empty ones", () => {
    const workbook = buildWorkbook(sampleData);
    expect(workbook.SheetNames).toContain("Products");
    expect(workbook.SheetNames).toContain("Sales");
    expect(workbook.SheetNames).toContain("User");
  });

  it("reads back exactly what was exported, with no server round trip", async () => {
    const workbook = buildWorkbook(sampleData);
    const file = workbookToFile(workbook, "export.xlsx");

    const parsed = await readWorkbookFile(file);

    expect(parsed.Products).toEqual([
      { id: 1, name: "Widget", sku: "SKU1" },
      { id: 2, name: "Gadget", sku: "SKU2" },
    ]);
    expect(parsed.User).toEqual([{ id: "u1", email: "a@b.com" }]);
    // Empty tables still round-trip as a sheet — just with no data rows
    // (the "No data" placeholder becomes the sheet's lone header cell).
    expect(parsed.Sales).toEqual([]);
  });
});
