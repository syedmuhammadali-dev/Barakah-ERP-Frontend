export interface ExtractedBillItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

/** Matches a trailing "<name> <qty> <price>" or "<name> <price>" pattern per line. */
const LINE_WITH_QTY_AND_PRICE = /^(.+?)\s+(\d+(?:\.\d+)?)\s+[x×]?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*$/;
const LINE_WITH_PRICE_ONLY = /^(.+?)\s+(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*$/;

function parseNumber(value: string): number {
  return Number(value.replace(/,/g, ""));
}

/** Best-effort line parser for OCR'd bill text — never throws, returns whatever it can find. */
export function parseBillText(rawText: string): ExtractedBillItem[] {
  const items: ExtractedBillItem[] = [];

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length < 3) continue;
    // Skip obvious header/footer/total lines
    if (/^(total|sub ?total|grand total|invoice|bill|date|tax|discount|received|thank you)/i.test(line)) {
      continue;
    }

    const withQty = line.match(LINE_WITH_QTY_AND_PRICE);
    if (withQty) {
      const [, name, qty, price] = withQty;
      const quantity = parseNumber(qty);
      const unitPrice = parseNumber(price);
      if (name.trim().length > 1 && quantity > 0 && unitPrice >= 0) {
        items.push({ productName: name.trim(), quantity, unitPrice });
        continue;
      }
    }

    const priceOnly = line.match(LINE_WITH_PRICE_ONLY);
    if (priceOnly) {
      const [, name, price] = priceOnly;
      const unitPrice = parseNumber(price);
      if (name.trim().length > 1 && unitPrice > 0) {
        items.push({ productName: name.trim(), quantity: 1, unitPrice });
      }
    }
  }

  return items;
}

async function extractTextFromImage(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  let fullText = "";

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += `${pageText}\n`;
  }

  if (fullText.trim().length > 20) {
    return fullText;
  }

  // Scanned/image-only PDF — render the first page to a canvas and OCR it.
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) return fullText;
  await page.render({ canvasContext: context, viewport, canvas }).promise;

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return fullText;
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(blob);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

/** Extracts candidate line items from an uploaded bill image or PDF. Never throws —
 *  returns an empty array if extraction fails, so the caller can fall back to manual entry. */
export async function extractBillItemsFromFile(file: File): Promise<ExtractedBillItem[]> {
  try {
    const text = file.type === "application/pdf"
      ? await extractTextFromPdf(file)
      : await extractTextFromImage(file);
    return parseBillText(text);
  } catch (error) {
    console.error("Bill OCR extraction failed:", error);
    return [];
  }
}
