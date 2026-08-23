"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getListBillsQueryKey,
  useCreateBill,
  useDeleteBill,
  useListBills,
  useListProducts,
  getGetInventorySummaryQueryKey,
  getListProductsQueryKey,
} from "@barakah/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { FileText, Plus, Receipt, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAppLocale } from "@/lib/i18n";
import { extractBillItemsFromFile } from "@/lib/bill-ocr";

const billItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Product name is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().min(0, "Price must be positive"),
});

const billFormSchema = z.object({
  billNumber: z.string().optional(),
  supplierName: z.string().min(2, "Supplier name is required"),
  billDate: z.string().optional(),
  notes: z.string().optional(),
  total: z.coerce.number().min(0).optional(),
  items: z.array(billItemSchema).min(1, "Add at least one item"),
});

type BillFormValues = z.infer<typeof billFormSchema>;

const emptyItem = { productId: "", productName: "", quantity: 1, unitPrice: 0 };

export function Bills() {
  const { t } = useAppLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewBillId, setViewBillId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<"success" | "failed" | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [openProductRow, setOpenProductRow] = useState<number | null>(null);
  const [rowProductSearch, setRowProductSearch] = useState<Record<number, string>>({});

  const { data: bills, isLoading, error } = useListBills();
  const viewBill = useMemo(() => bills?.find((b) => b.id === viewBillId) ?? null, [bills, viewBillId]);
  const { data: allProducts } = useListProducts();
  const createBill = useCreateBill();
  const deleteBill = useDeleteBill();

  const getFilteredProducts = (query: string) => {
    if (!query.trim()) return (allProducts ?? []).slice(0, 10);
    const q = query.toLowerCase();
    return (allProducts ?? []).filter((p) =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    ).slice(0, 10);
  };

  const form = useForm({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      billNumber: "",
      supplierName: "",
      billDate: "",
      notes: "",
      total: 0,
      items: [emptyItem],
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem, replace: replaceItems } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const [isTotalManual, setIsTotalManual] = useState(false);
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

  const resetForm = () => {
    form.reset({ billNumber: "", supplierName: "", billDate: "", notes: "", total: 0, items: [emptyItem] });
    setRowProductSearch({});
    setSourceFileName(null);
    setUploadNotice(null);
    setIsTotalManual(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setUploadNotice(null);
    setSourceFileName(file.name);
    try {
      const extracted = await extractBillItemsFromFile(file);
      if (extracted.length > 0) {
        replaceItems(extracted.map((item) => ({
          productId: "",
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })));
        setUploadNotice("success");
      } else {
        setUploadNotice("failed");
      }
    } catch (error) {
      setUploadNotice("failed");
      toast({
        title: t("bills.extractionFailed"),
        description: getApiErrorMessage(error, t("bills.checkForm")),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createBill.mutateAsync({
        data: {
          billNumber: values.billNumber || undefined,
          supplierName: values.supplierName,
          billDate: values.billDate ? new Date(values.billDate).toISOString() : undefined,
          notes: values.notes || undefined,
          total: values.total,
          sourceFileName: sourceFileName ?? undefined,
          items: values.items.map((item) => ({
            productId: item.productId ? Number(item.productId) : undefined,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
      toast({
        title: t("bills.billRecorded"),
        description: t("bills.billSaved").replace("{name}", values.supplierName),
      });
      resetForm();
      setIsAddOpen(false);
    } catch (error) {
      toast({
        title: t("bills.unableToSaveBill"),
        description: getApiErrorMessage(error, t("bills.checkForm")),
        variant: "destructive",
      });
    }
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBill.mutateAsync({ id: deleteTarget.id });
      await queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: t("bills.unableToSaveBill"), description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("bills.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("bills.description")}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> {t("bills.addBill")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-140 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("bills.addNewBill")}</DialogTitle>
              <DialogDescription>{t("bills.addBillDescription")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-2 pt-2">
              <label
                htmlFor="bill-upload"
                className="flex items-center justify-center gap-2 border border-dashed border-border rounded-md py-4 cursor-pointer hover:bg-accent transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? t("bills.processingUpload") : t("bills.uploadBill")}
              </label>
              <input
                id="bill-upload"
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileUpload}
              />
              <p className="text-xs text-muted-foreground">{t("bills.uploadBillHint")}</p>
              {uploadNotice === "success" && (
                <p className="text-xs text-primary">{t("bills.extractedItemsNotice")}</p>
              )}
              {uploadNotice === "failed" && (
                <p className="text-xs text-destructive">{t("bills.extractionFailed")}</p>
              )}
            </div>

            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="supplierName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("bills.supplierName")}</FormLabel>
                      <FormControl><Input placeholder={t("bills.supplierNamePlaceholder")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="billNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("bills.billNumber")}</FormLabel>
                      <FormControl><Input placeholder={t("bills.billNumberPlaceholder")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="billDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bills.billDate")}</FormLabel>
                    <FormControl><Input type="date" placeholder={t("bills.billDate")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="space-y-3">
                  <p className="text-sm font-medium leading-none">{t("sales.productItem")}</p>
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
                      <div key={itemField.id} className="relative grid grid-cols-[1fr_70px_110px_auto] gap-2 items-start">
                        <FormField
                          control={form.control}
                          name={`items.${index}.productName`}
                          render={({ field }) => (
                            <FormItem className="relative">
                              <FormControl>
                                <Input
                                  placeholder={t("sales.searchProductOrCustom")}
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
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" min="0" step="1" placeholder={t("sales.itemQuantity")} {...field} value={field.value as number} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" min="0" step="0.01" placeholder={t("sales.itemUnitPrice")} {...field} value={field.value as number} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendItem(emptyItem)}
                  >
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

                <Button type="submit" className="w-full" disabled={createBill.isPending}>
                  {createBill.isPending ? t("bills.saving") : t("bills.saveBill")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={Boolean(viewBillId)} onOpenChange={(open) => !open && setViewBillId(null)}>
        <DialogContent className="sm:max-w-140 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewBill?.billNumber}</DialogTitle>
            <DialogDescription>
              {viewBill ? `${viewBill.supplierName} — ${format(parseISO(viewBill.billDate), "MMM d, yyyy")}` : ""}
            </DialogDescription>
          </DialogHeader>
          {viewBill ? (
            <div className="space-y-4">
              {viewBill.sourceFileName ? (
                <Badge variant="outline" className="text-xs gap-1 w-fit">
                  <FileText className="w-3 h-3" /> {viewBill.sourceFileName}
                </Badge>
              ) : null}
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>{t("bills.productName")}</TableHead>
                    <TableHead className="text-right">{t("bills.quantity")}</TableHead>
                    <TableHead className="text-right">{t("bills.unitPrice")}</TableHead>
                    <TableHead className="text-right">{t("bills.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(viewBill.items ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatMoney(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatMoney(item.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                  {(viewBill.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        {t("bills.noBills")}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
              {viewBill.notes ? (
                <p className="text-sm text-muted-foreground">{viewBill.notes}</p>
              ) : null}
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
                <span className="text-sm font-medium">{t("bills.total")}</span>
                <span className="text-lg font-bold">{formatMoney(viewBill.total)}</span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bills.deleteBillTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bills.deleteBillDescription").replace("{name}", deleteTarget?.name ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("bills.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("bills.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /> {t("bills.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>{t("bills.billNumber")}</TableHead>
                  <TableHead>{t("bills.supplierName")}</TableHead>
                  <TableHead>{t("bills.billDate")}</TableHead>
                  <TableHead>{t("bills.sourceFile")}</TableHead>
                  <TableHead className="text-right">{t("bills.total")}</TableHead>
                  <TableHead className="text-right">{t("bills.delete")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(bills ?? []).map((bill) => (
                  <TableRow
                    key={bill.id}
                    className="hover:bg-muted/20 cursor-pointer"
                    onClick={() => setViewBillId(bill.id)}
                  >
                    <TableCell className="font-mono text-xs">{bill.billNumber}</TableCell>
                    <TableCell>{bill.supplierName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(parseISO(bill.billDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {bill.sourceFileName ? (
                        <Badge variant="outline" className="text-xs gap-1">
                          <FileText className="w-3 h-3" /> {bill.sourceFileName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(bill.total)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: bill.id, name: bill.billNumber });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && (bills ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {error ? t("bills.billsUnavailable") : t("bills.noBills")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
