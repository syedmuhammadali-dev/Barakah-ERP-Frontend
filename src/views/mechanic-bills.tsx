"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Bike, CheckCircle2, Download, Eye, Pencil, Plus, Trash2, Wrench } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { useAppLocale } from "@/lib/i18n";
import { generateBillPdf, type BillData } from "@/lib/bill-pdf";
import { InvoicePreviewDialog } from "@/components/invoice-preview-dialog";
import { useGetBusinessProfile, useListProducts } from "@barakah/api-client-react";

type MechanicBillStatus = "pending" | "done";

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
  status: MechanicBillStatus;
  createdAt: string;
  items?: MechanicBillItem[];
}

const itemSchema = z.object({
  productId: z.string().optional(),
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

const emptyItem = { productId: "", productName: "", quantity: 1, unitPrice: 0 };

const defaultFormValues: FormValues = {
  customerName: "",
  bikeNumber: "",
  customerPhone: "",
  mechanicName: "",
  notes: "",
  total: 0,
  items: [emptyItem],
};

function mechanicBillsQueryKey(status: string) {
  return ["/api/mechanic-bills", status];
}

export function MechanicBills() {
  const { t } = useAppLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | MechanicBillStatus>("all");
  const [previewBill, setPreviewBill] = useState<BillData | null>(null);
  const [openProductRow, setOpenProductRow] = useState<number | null>(null);
  const [rowProductSearch, setRowProductSearch] = useState<Record<number, string>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTotalManual, setIsTotalManual] = useState(false);

  const { data: bills, isLoading, error } = useQuery({
    queryKey: mechanicBillsQueryKey(statusFilter),
    queryFn: () => apiRequest<MechanicBill[]>(
      statusFilter === "all" ? "/api/mechanic-bills" : `/api/mechanic-bills?status=${statusFilter}`,
    ),
  });
  const { data: businessProfile } = useGetBusinessProfile({ query: { queryKey: ["businessProfile"], retry: false } });
  const { data: allProducts } = useListProducts();

  const getFilteredProducts = (query: string) => {
    if (!query.trim()) return (allProducts ?? []).slice(0, 10);
    const q = query.toLowerCase();
    return (allProducts ?? []).filter((p) =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    ).slice(0, 10);
  };

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
          ? selectedBill.items.map((i) => ({ productId: "", productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice }))
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
      setRowProductSearch({});

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

      await queryClient.invalidateQueries({ queryKey: ["/api/mechanic-bills"] });
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
      await queryClient.invalidateQueries({ queryKey: ["/api/mechanic-bills"] });
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

  const buildMechanicBillData = (bill: MechanicBill): BillData => ({
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

  const handleGenerateInvoice = (bill: MechanicBill) => {
    generateBillPdf(buildMechanicBillData(bill));
  };

  const toggleStatus = async (bill: MechanicBill, e?: MouseEvent) => {
    e?.stopPropagation();
    const nextStatus: MechanicBillStatus = bill.status === "done" ? "pending" : "done";
    try {
      await apiRequest(`/api/mechanic-bills/${bill.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/mechanic-bills"] });
      if (nextStatus === "done") {
        await queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
        toast({ title: t("mechanicBills.markedDone"), description: t("mechanicBills.markedDoneDescription") });
      }
    } catch (err) {
      toast({
        title: t("mechanicBills.saveFailed"),
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("mechanicBills.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("mechanicBills.description")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | MechanicBillStatus)}>
            <SelectTrigger className="w-40 bg-muted/50 border-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("mechanicBills.filterAllStatus")}</SelectItem>
              <SelectItem value="pending">{t("mechanicBills.statusPending")}</SelectItem>
              <SelectItem value="done">{t("mechanicBills.statusDone")}</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" /> {t("mechanicBills.addBill")}
          </Button>
        </div>
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
                {itemFields.map((itemField, index) => {
                  const query = rowProductSearch[index] ?? form.getValues(`items.${index}.productName`) ?? "";
                  const options = openProductRow === index ? getFilteredProducts(query) : [];
                  return (
                  <div key={itemField.id} className="grid grid-cols-[1fr_70px_110px_auto] gap-2 items-start">
                    <FormField control={form.control} name={`items.${index}.productName`} render={({ field }) => (
                      <FormItem className="relative">
                        <FormControl>
                          <Input
                            placeholder={t("mechanicBills.itemPlaceholder")}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setRowProductSearch((prev) => ({ ...prev, [index]: e.target.value }));
                              form.setValue(`items.${index}.productId`, "");
                              setOpenProductRow(index);
                            }}
                            onFocus={() => setOpenProductRow(index)}
                            onBlur={() => setTimeout(() => setOpenProductRow((cur) => (cur === index ? null : cur)), 200)}
                          />
                        </FormControl>
                        {options.length > 0 && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {options.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  field.onChange(p.name);
                                  form.setValue(`items.${index}.productId`, String(p.id));
                                  form.setValue(`items.${index}.unitPrice`, p.salePrice);
                                  setRowProductSearch((prev) => ({ ...prev, [index]: p.name }));
                                  setOpenProductRow(null);
                                }}
                              >
                                <span className="font-medium">{p.name}</span>
                                <span className="text-muted-foreground ml-2 text-xs">{p.sku}</span>
                              </button>
                            ))}
                          </div>
                        )}
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
                  );
                })}
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

              {selectedBill ? (
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
                  <span className="text-sm font-medium">{t("mechanicBills.statusPending")}/{t("mechanicBills.statusDone")}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedBill.status === "done" ? "outline" : "default"}
                    onClick={(e) => toggleStatus(selectedBill, e)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {selectedBill.status === "done" ? t("mechanicBills.markPending") : t("mechanicBills.markDone")}
                  </Button>
                </div>
              ) : null}

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
                  <Button type="button" variant="outline" onClick={() => setPreviewBill(buildMechanicBillData(selectedBill))}>
                    <Eye className="h-4 w-4 mr-2" /> {t("mechanicBills.previewInvoice")}
                  </Button>
                ) : null}
                {selectedBill ? (
                  <Button type="button" variant="outline" onClick={() => handleGenerateInvoice(selectedBill)}>
                    <Download className="h-4 w-4 mr-2" /> {t("mechanicBills.downloadInvoice")}
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
              className={`cursor-pointer transition-colors ${bill.status === "done" ? "border-green-500/40 hover:border-green-500/60" : "border-destructive/40 hover:border-destructive/60"}`}
              onClick={() => openEditDialog(bill.id)}
            >
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{bill.jobNumber}</div>
                    <div className="font-semibold">{bill.customerName}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={t("mechanicBills.previewInvoice")} onClick={(e) => { e.stopPropagation(); setPreviewBill(buildMechanicBillData(bill)); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={t("mechanicBills.downloadInvoice")} onClick={(e) => { e.stopPropagation(); handleGenerateInvoice(bill); }}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => { e.stopPropagation(); openEditDialog(bill.id); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={bill.status === "done"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"}
                    variant="outline"
                  >
                    {bill.status === "done" ? t("mechanicBills.statusDone") : t("mechanicBills.statusPending")}
                  </Badge>
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
                <Button
                  type="button"
                  size="sm"
                  variant={bill.status === "done" ? "outline" : "default"}
                  className="w-full"
                  onClick={(e) => toggleStatus(bill, e)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {bill.status === "done" ? t("mechanicBills.markPending") : t("mechanicBills.markDone")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InvoicePreviewDialog bill={previewBill} onOpenChange={(open) => !open && setPreviewBill(null)} />
    </div>
  );
}
