import { jsPDF } from "jspdf";
import { formatMoney } from "@/lib/format";

export interface BillItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface BillData {
  shopName: string;
  invoiceId: string;
  customerName: string;
  saleDate: string;
  paymentMethodLabel: string;
  items: BillItem[];
  discount: number;
  total: number;
  labels: {
    billTitle: string;
    billShop: string;
    billCustomer: string;
    billInvoice: string;
    billDate: string;
    billPayment: string;
    billItem: string;
    billQty: string;
    billUnitPrice: string;
    billTotal: string;
    billDiscount: string;
    billGrandTotal: string;
  };
}

const PRIMARY_RGB: [number, number, number] = [30, 41, 59];
const MUTED_RGB: [number, number, number] = [107, 114, 128];
const BORDER_RGB: [number, number, number] = [226, 232, 240];
const ROW_SHADE_RGB: [number, number, number] = [246, 248, 250];

function buildBillDoc(bill: BillData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const contentRight = pageWidth - marginX;
  let y = 0;

  // Header band
  doc.setFillColor(...PRIMARY_RGB);
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(bill.shopName, marginX, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(bill.labels.billTitle, marginX, 64);
  doc.setFontSize(10);
  doc.text(`${bill.labels.billInvoice}: ${bill.invoiceId}`, contentRight, 42, {
    align: "right",
  });
  doc.text(
    `${bill.labels.billDate}: ${new Date(bill.saleDate).toLocaleString()}`,
    contentRight,
    60,
    { align: "right" },
  );

  y = 122;

  // Customer / payment info box
  doc.setFillColor(...ROW_SHADE_RGB);
  doc.roundedRect(marginX, y - 20, contentRight - marginX, 46, 4, 4, "F");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(bill.labels.billCustomer, marginX + 14, y - 3);
  doc.text(
    bill.labels.billPayment,
    marginX + (contentRight - marginX) / 2,
    y - 3,
  );
  doc.setFont("helvetica", "normal");
  doc.text(bill.customerName || "-", marginX + 14, y + 14);
  doc.text(
    bill.paymentMethodLabel,
    marginX + (contentRight - marginX) / 2,
    y + 14,
  );

  y += 50;

  const colItem = marginX + 8;
  const colQty = pageWidth - 300;
  const colPrice = pageWidth - 210;
  const colTotal = contentRight - 8;
  const tableLeft = marginX;
  const tableRight = contentRight;

  // Table header
  doc.setFillColor(...PRIMARY_RGB);
  doc.rect(tableLeft, y, tableRight - tableLeft, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(bill.labels.billItem, colItem, y + 17);
  doc.text(bill.labels.billQty, colQty, y + 17, { align: "right" });
  doc.text(bill.labels.billUnitPrice, colPrice, y + 17, { align: "right" });
  doc.text(bill.labels.billTotal, colTotal, y + 17, { align: "right" });
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const rowHeight = 24;

  bill.items.forEach((item, index) => {
    const lineTotal = item.lineTotal ?? item.quantity * item.unitPrice;
    if (index % 2 === 1) {
      doc.setFillColor(...ROW_SHADE_RGB);
      doc.rect(tableLeft, y, tableRight - tableLeft, rowHeight, "F");
    }
    doc.setFontSize(10);
    doc.text(item.productName, colItem, y + 16, {
      maxWidth: colQty - colItem - 12,
    });
    doc.text(String(item.quantity), colQty, y + 16, { align: "right" });
    doc.text(formatMoney(item.unitPrice), colPrice, y + 16, { align: "right" });
    doc.text(formatMoney(lineTotal), colTotal, y + 16, { align: "right" });
    y += rowHeight;
  });

  doc.setDrawColor(...BORDER_RGB);
  doc.rect(
    tableLeft,
    y - bill.items.length * rowHeight - 26,
    tableRight - tableLeft,
    bill.items.length * rowHeight + 26,
  );

  y += 16;

  // Totals box, right-aligned
  const totalsBoxWidth = 220;
  const totalsBoxX = tableRight - totalsBoxWidth;
  let totalsY = y;
  const totalsLineHeight = 20;
  const hasDiscount = bill.discount > 0;
  const totalsBoxHeight = (hasDiscount ? 2 : 1) * totalsLineHeight + 20;

  doc.setDrawColor(...BORDER_RGB);
  doc.roundedRect(totalsBoxX, totalsY, totalsBoxWidth, totalsBoxHeight, 4, 4);

  totalsY += 22;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_RGB);
  if (hasDiscount) {
    doc.text(bill.labels.billDiscount, totalsBoxX + 14, totalsY);
    doc.text(`- ${formatMoney(bill.discount)}`, tableRight - 14, totalsY, {
      align: "right",
    });
    totalsY += totalsLineHeight;
  }

  doc.setDrawColor(...BORDER_RGB);
  doc.line(totalsBoxX + 14, totalsY - 12, tableRight - 14, totalsY - 12);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_RGB);
  doc.text(bill.labels.billGrandTotal, totalsBoxX + 14, totalsY + 6);
  doc.text(formatMoney(bill.total), tableRight - 14, totalsY + 6, {
    align: "right",
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...BORDER_RGB);
  doc.line(marginX, pageHeight - 50, contentRight, pageHeight - 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_RGB);
  doc.text(bill.shopName, marginX, pageHeight - 32);
  doc.text(
    bill.labels.billInvoice + ": " + bill.invoiceId,
    contentRight,
    pageHeight - 32,
    { align: "right" },
  );

  return doc;
}

export function generateBillPdf(bill: BillData): void {
  buildBillDoc(bill).save(`${bill.invoiceId}.pdf`);
}

/** Builds the same invoice as a Blob URL for in-page preview (e.g. an
 *  <iframe> inside a dialog) instead of triggering a download. Caller is
 *  responsible for revoking the URL (URL.revokeObjectURL) when done. */
export function getBillPdfPreviewUrl(bill: BillData): string {
  const blob = buildBillDoc(bill).output("blob");
  return URL.createObjectURL(blob);
}
