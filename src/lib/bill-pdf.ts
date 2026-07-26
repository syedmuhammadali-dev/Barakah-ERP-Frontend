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

export function generateBillPdf(bill: BillData): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 50;

  doc.setFontSize(18);
  doc.text(bill.shopName, marginX, y);
  y += 20;
  doc.setFontSize(12);
  doc.text(bill.labels.billTitle, marginX, y);
  y += 25;

  doc.setFontSize(10);
  doc.text(`${bill.labels.billInvoice}: ${bill.invoiceId}`, marginX, y);
  y += 15;
  doc.text(`${bill.labels.billDate}: ${new Date(bill.saleDate).toLocaleString()}`, marginX, y);
  y += 15;
  doc.text(`${bill.labels.billCustomer}: ${bill.customerName}`, marginX, y);
  y += 15;
  doc.text(`${bill.labels.billPayment}: ${bill.paymentMethodLabel}`, marginX, y);
  y += 25;

  const colItem = marginX;
  const colQty = 320;
  const colPrice = 380;
  const colTotal = 470;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(bill.labels.billItem, colItem, y);
  doc.text(bill.labels.billQty, colQty, y);
  doc.text(bill.labels.billUnitPrice, colPrice, y);
  doc.text(bill.labels.billTotal, colTotal, y);
  y += 8;
  doc.line(marginX, y, 555, y);
  y += 14;
  doc.setFont("helvetica", "normal");

  for (const item of bill.items) {
    const lineTotal = item.lineTotal ?? item.quantity * item.unitPrice;
    doc.text(item.productName, colItem, y, { maxWidth: 270 });
    doc.text(String(item.quantity), colQty, y);
    doc.text(formatMoney(item.unitPrice), colPrice, y);
    doc.text(formatMoney(lineTotal), colTotal, y);
    y += 18;
  }

  y += 10;
  doc.line(marginX, y, 555, y);
  y += 20;

  if (bill.discount > 0) {
    doc.text(`${bill.labels.billDiscount}: ${formatMoney(bill.discount)}`, colPrice, y);
    y += 18;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`${bill.labels.billGrandTotal}: ${formatMoney(bill.total)}`, colPrice, y);

  doc.save(`${bill.invoiceId}.pdf`);
}
