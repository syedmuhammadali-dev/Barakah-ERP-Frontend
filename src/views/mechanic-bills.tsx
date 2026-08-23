"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Bike, FileDown, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { useAppLocale } from "@/lib/i18n";
import { generateBillPdf } from "@/lib/bill-pdf";
import { useGetBusinessProfile } from "@barakah/api-client-react";

interface MechanicBillItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface MechanicBill {
  id: number;
  jobNumber: string;
  customerName: string;
  bikeNumber: string | null;
  customerPhone: string | null;
  mechanicName: string | null;
  total: number;
  notes: string | null;
  createdAt: string;
  items?: MechanicBillItem[];
}

const itemSchema = z.object({
  productName: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().min(0, "Price must be positive"),
});

const formSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  bikeNumber: z.string().optional().default(""),
  customerPhone: z.string().optional().default(""),
  mechanicName: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  total: z.coerce.number().min(0).optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
});

type FormValues = z.infer<typeof formSchema>;

const emptyItem = { productName: "", quantity: 1, unitPrice: 0 };

const defaultFormValues: FormValues = {
  customerName: "",
  bikeNumber: "",
  customerPhone: "",
  mechanicName: "",
  notes: "",
  total: 0,
  items: [emptyItem],
};

const MECHANIC_BILLS_QUERY_KEY = ["/api/mechanic-bills"];

export function MechanicBills() {
  const { t } = useAppLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTotalManual, setIsTotalManual] = useState(false);

  const { data: bills, isLoading, error } = useQuery({
    queryKey: MECHANIC_BILLS_QUERY_KEY,
    queryFn: () => apiRequest<MechanicBill[]>("/api/mechanic-bills"),
  });
  const { data: businessProfile } = useGetBusinessProfile({ query: { queryKey: ["businessProfile"], retry: false } });

  const selectedBill = useMemo(
    () => bills?.find((b) => b.id === selectedId) ?? null,
    [bills, selectedId],
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const computedTotal = useMemo(
    () => (watchedItems ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0),
    [watchedItems],
  );

  useEffect(() => {
    if (!isTotalManual) {
      form.setValue("total", computedTotal);
    }
  }, [computedTotal, isTotalManual, form]);

  useEffect(() => {
    if (!isFormOpen) return;
    if (selectedBill) {
      form.reset({
        customerName: selectedBill.customerName,
        bikeNumber: selectedBill.bikeNumber ?? "",
        customerPhone: selectedBill.customerPhone ?? "",
        mechanicName: selectedBill.mechanicName ?? "",
        notes: selectedBill.notes ?? "",
        total: selectedBill.total,
        items: selectedBill.items && selectedBill.items.length > 0
          ? selectedBill.items.map((i) => ({ productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice }))
          : [emptyItem],
      });
      setIsTotalManual(true);
    } else {
      form.reset(defaultFormValues);
      setIsTotalManual(false);
    }
  }, [isFormOpen, selectedBill, form]);

  const openCreateDialog = () => {
    setSelectedId(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (id: number) => {
    setSelectedId(id);
    setIsFormOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const payload = {
        customerName: values.customerName,
        bikeNumber: values.bikeNumber || null,
        customerPhone: values.customerPhone || null,
        mechanicName: values.mechanicName || null,
        notes: values.notes || null,
        total: values.total,
        items: values.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      if (selectedBill) {
        await apiRequest(`/api/mechanic-bills/${selectedBill.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast({ title: t("mechanicBills.updated"), description: t("mechanicBills.updatedDescription") });
      } else {
        await apiRequest("/api/mechanic-bills", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({ title: t("mechanicBills.created"), description: t("mechanicBills.createdDescription") });
      }

      await queryClient.invalidateQueries({ queryKey: MECHANIC_BILLS_QUERY_KEY });
      setIsFormOpen(false);
      setSelectedId(null);
    } catch (err) {
      toast({
        title: t("mechanicBills.saveFailed"),
        description: getApiErrorMessage(err, t("mechanicBills.checkForm")),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/api/mechanic-bills/${deleteTarget.id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: MECHANIC_BILLS_QUERY_KEY });
      toast({ title: t("mechanicBills.deleted") });
      setDeleteTarget(null);
      if (selectedId === deleteTarget.id) {
        setIsFormOpen(false);
        setSelectedId(null);
      }
    } catch (err) {
      toast({
        title: t("mechanicBills.deleteFailed"),
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const handleGenerateInvoice = (bill: MechanicBill) => {
    generateBillPdf({
      shopName: businessProfile?.businessName || t("sales.businessNameFallback"),
      invoiceId: bill.jobNumber,
      customerName: bill.customerName,
      saleDate: bill.createdAt,
      paymentMethodLabel: bill.mechanicName
        ? `${t("mechanicBills.mechanicName")}: ${bill.mechanicName}`
        : t("mechanicBills.title"),
      items: (bill.items && bill.items.length > 0)
        ? bill.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        }))
        : [{ productName: t("sales.na"), quantity: 1, unitPrice: bill.total }],
      discount: 0,
      total: bill.total,
      labels: {
        billTitle: t("sales.billTitle"),
        billShop: t("sales.billShop"),
        billCustomer: t("sales.billCustomer"),
        billInvoice: t("sales.billInvoice"),
        billDate: t("sales.billDate"),
        billPayment: t("sales.billPayment"),
        billItem: t("sales.billItem"),
        billQty: t("sales.billQty"),
        billUnitPrice: t("sales.billUnitPrice"),
        billTotal: t("sales.billTotal"),
        billDiscount: t("sales.billDiscount"),
        billGrandTotal: t("sales.billGrandTotal"),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("mechanicBills.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("mechanicBills.description")}</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" /> {t("mechanicBills.addBill")}
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setSelectedId(null); }}>
        <DialogContent className="sm:max-w-140 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBill ? t("mechanicBills.editBill") : t("mechanicBills.addNewBill")}</DialogTitle>
            <DialogDescription>
              {selectedBill ? t("mechanicBills.editBillDescription") : t("mechanicBills.addBillDescription")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="customerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("mechanicBills.customerName")}</FormLabel>
                    <FormControl><Input placeholder={t("mechanicBills.customerNamePlaceholder")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bikeNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("mechanicBills.bikeNumber")}</FormLabel>
                    <FormControl><Input placeholder={t("mechanicBills.bikeNumberPlaceholder")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="customerPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("mechanicBills.customerPhone")}</FormLabel>
                    <FormControl><Input placeholder={t("sales.customerPhonePlaceholder")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mechanicName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("mechanicBills.mechanicName")}</FormLabel>
                    <FormControl><Input placeholder={t("mechanicBills.mechanicNamePlaceholder")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_70px_110px_auto] gap-2 px-0.5 text-xs text-muted-foreground">
                  <span>{t("bills.productName")}</span>
                  <span>{t("bills.quantity")}</span>
                  <span>{t("bills.unitPrice")}</span>
                  <span />
                </div>
                {itemFields.map((itemField, index) => (
                  <div key={itemField.id} className="grid grid-cols-[1fr_70px_110px_auto] gap-2 items-start">
                    <FormField control={form.control} name={`items.${index}.productName`} render={({ field }) => (
                      <FormItem>
                        <FormControl><Input placeholder={t("mechanicBills.itemPlaceholder")} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                      <FormItem>
                        <FormControl><Input type="number" min="0" step="1" {...field} value={field.value as number} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                      <FormItem>
                        <FormControl><Input type="number" min="0" step="0.01" {...field} value={field.value as number} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 w-9 p-0 text-destructive"
                      disabled={itemFields.length === 1}
                      onClick={() => removeItem(index)}
                    >
                      <span className="sr-only">{t("sales.removeItem")}</span>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendItem(emptyItem)}>
                  <Plus className="h-4 w-4 mr-1" /> {t("sales.addItem")}
                </Button>
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bills.notes")}</FormLabel>
                  <FormControl><Input placeholder={t("bills.notesPlaceholder")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="total" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3 gap-4">
                    <FormLabel className="text-sm font-medium shrink-0">{t("bills.total")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="text-right text-lg font-bold h-9 max-w-40"
                        {...field}
                        value={field.value as number}
                        onChange={(e) => {
                          setIsTotalManual(true);
                          field.onChange(e.target.valueAsNumber || 0);
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex items-center gap-2">
                {selectedBill ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget({ id: selectedBill.id, name: selectedBill.jobNumber })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> {t("bills.delete")}
                  </Button>
                ) : null}
                {selectedBill ? (
                  <Button type="button" variant="outline" onClick={() => handleGenerateInvoice(selectedBill)}>
                    <FileDown className="h-4 w-4 mr-2" /> {t("mechanicBills.generateInvoice")}
                  </Button>
                ) : null}
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? t("bills.saving") : t("bills.saveBill")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mechanicBills.deleteBillTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("mechanicBills.deleteBillDescription").replace("{name}", deleteTarget?.name ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("bills.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("bills.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : (bills ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error ? t("mechanicBills.billsUnavailable") : t("mechanicBills.noBills")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(bills ?? []).map((bill) => (
            <Card
              key={bill.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => openEditDialog(bill.id)}
            >
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{bill.jobNumber}</div>
                    <div className="font-semibold">{bill.customerName}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => { e.stopPropagation(); openEditDialog(bill.id); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bill.bikeNumber ? (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Bike className="w-3 h-3" /> {bill.bikeNumber}
                    </Badge>
                  ) : null}
                  {bill.mechanicName ? (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Wrench className="w-3 h-3" /> {bill.mechanicName}
                    </Badge>
                  ) : null}
                </div>
                {bill.customerPhone ? (
                  <div className="text-xs text-muted-foreground">{bill.customerPhone}</div>
                ) : null}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(bill.createdAt), "MMM d, yyyy")}
                  </span>
                  <span className="font-bold">{formatMoney(bill.total)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
