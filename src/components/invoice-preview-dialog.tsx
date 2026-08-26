"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getBillPdfPreviewUrl, type BillData } from "@/lib/bill-pdf";
import { useAppLocale } from "@/lib/i18n";

interface InvoicePreviewDialogProps {
  bill: BillData | null;
  onOpenChange: (open: boolean) => void;
}

/** Renders a sale/bill invoice PDF inline in a dialog (an <iframe> pointed
 *  at a Blob URL) so the user can look before downloading. */
export function InvoicePreviewDialog({ bill, onOpenChange }: InvoicePreviewDialogProps) {
  const { t } = useAppLocale();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!bill) {
      setUrl(null);
      return;
    }
    const objectUrl = getBillPdfPreviewUrl(bill);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [bill]);

  return (
    <Dialog open={Boolean(bill)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("sales.invoicePreview")}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-md border border-border overflow-hidden">
          {url ? (
            <iframe src={url} title="Invoice preview" className="w-full h-full" />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
