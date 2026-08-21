"use client";

import { useMemo, useState } from "react";
import {
  getGetSalesSummaryQueryKey,
  getListSalesQueryKey,
  useCreateSale,
  useGetSalesSummary,
  useListSales,
  useListSalesmen,
  useListProducts,
  useGetBusinessProfile,
} from "@barakah/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Banknote, CreditCard, Download, Plus, Search, ShieldCheck, ShoppingCart, Trash2, Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney, formatPercent } from "@/lib/format";
import { useAppLocale } from "@/lib/i18n";
import { generateBillPdf } from "@/lib/bill-pdf";

const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "jazzcash",
  "easypaisa",
  "sadapay",
  "credit",
  "other",
] as const;

const saleItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Product name is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().min(0, "Price must be positive"),
});

const saleFormSchema = z.object({
  customerName: z.string().optional().default(""),
  salesmanId: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  discount: z.coerce.number().min(0).default(0),
  items: z.array(saleItemSchema).min(1, "Add at least one item"),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

export function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createSale = useCreateSale();
  const { data: salesmen } = useListSalesmen();
  const { data: allProducts } = useListProducts();
  const { data: businessProfile } = useGetBusinessProfile({ query: { queryKey: ["businessProfile"], retry: false } });
  const { t } = useAppLocale();

  const { data: summary, isLoading: summaryLoading, error: summaryError } =
    useGetSalesSummary();
  const {
    data: sales,
    isLoading: salesLoading,
    error: salesError,
  } = useListSales({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const filteredSales = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return sales ?? [];
    }
    return (sales ?? []).filter((sale) =>
      [
        sale.invoiceId,
        sale.customerName,
        sale.salesmanName ?? "",
        sale.paymentMethod,
        sale.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [sales, searchTerm]);

  const [openProductRow, setOpenProductRow] = useState<number | null>(null);
  const [rowProductSearch, setRowProductSearch] = useState<Record<number, string>>({});

  const getFilteredProducts = (query: string) => {
    if (!query.trim()) return (allProducts ?? []).slice(0, 10);
    const q = query.toLowerCase();
    return (allProducts ?? []).filter((p) =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    ).slice(0, 10);
  };

  const form = useForm({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerName: "",
      salesmanId: "none",
      paymentMethod: "cash",
      discount: 0,
      items: [{ productId: "", productName: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discount");
  const computedTotal = useMemo(() => {
    const itemsTotal = (watchedItems ?? []).reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0,
    );
    return Math.max(0, itemsTotal - (Number(watchedDiscount) || 0));
  }, [watchedItems, watchedDiscount]);

  const handleExportCsv = () => {
    const rows = [
      [t("sales.invoiceId"), "Date", t("sales.customer"), t("sales.salesman"), t("sales.payment"), t("sales.total"), t("sales.status")],
      ...filteredSales.map((sale) => [
        sale.invoiceId,
        sale.saleDate,
        sale.customerName,
        sale.salesmanName ?? "",
        sale.paymentMethod,
        String(sale.total),
        sale.status,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replaceAll('"', '""')}"`,
          )
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "barakah-sales.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createSale.mutateAsync({
        data: {
          customerName: values.customerName?.trim() || "Walk-in Customer",
          salesmanId:
            values.salesmanId && values.salesmanId !== "none"
              ? Number(values.salesmanId)
              : undefined,
          paymentMethod: values.paymentMethod,
          discount: values.discount,
          items: values.items.map((item) => ({
            productId: item.productId ? Number(item.productId) : undefined,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetSalesSummaryQueryKey() });
      toast({
        title: t("sales.saleRecorded"),
        description: t("sales.saleSaved").replace("{name}", values.customerName?.trim() || "Walk-in Customer"),
      });
      form.reset({
        customerName: "",
        salesmanId: "none",
        paymentMethod: "cash",
        discount: 0,
        items: [{ productId: "", productName: "", quantity: 1, unitPrice: 0 }],
      });
      setRowProductSearch({});
      setIsAddOpen(false);
    } catch (error) {
      toast({
        title: t("sales.unableToSaveSale"),
        description: getApiErrorMessage(error, t("sales.checkForm")),
        variant: "destructive",
      });
    }
  });

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="w-4 h-4 text-emerald-500" />;
      case "card":
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case "bank_transfer":
        return <CreditCard className="w-4 h-4 text-indigo-500" />;
      case "jazzcash":
      case "easypaisa":
      case "sadapay":
        return <Wallet className="w-4 h-4 text-purple-500" />;
      case "credit":
        return <Wallet className="w-4 h-4 text-amber-500" />;
      default:
        return <Banknote className="w-4 h-4" />;
    }
  };

  const paymentMethodLabel = (method: string): string => {
    switch (method) {
      case "cash": return t("sales.paymentCash");
      case "card": return t("sales.paymentCard");
      case "bank_transfer": return t("sales.paymentBankTransfer");
      case "jazzcash": return t("sales.paymentJazzcash");
      case "easypaisa": return t("sales.paymentEasypaisa");
      case "sadapay": return t("sales.paymentSadapay");
      case "credit": return t("sales.paymentCredit");
      case "other": return t("sales.paymentOther");
      default: return method;
    }
  };

  const statusLabel = (status: string): string => {
    switch (status) {
      case "settled": return t("sales.settled");
      case "pending": return t("sales.pending");
      case "credit": return t("sales.credit");
      case "refunded": return t("sales.refunded");
      default: return status;
    }
  };

  const handleDownloadBill = (sale: NonNullable<typeof sales>[number]) => {
    generateBillPdf({
      shopName: businessProfile?.businessName || t("sales.businessNameFallback"),
      invoiceId: sale.invoiceId,
      customerName: sale.customerName,
      saleDate: sale.saleDate,
      paymentMethodLabel: paymentMethodLabel(sale.paymentMethod),
      items: (sale.items && sale.items.length > 0)
        ? sale.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        }))
        : [{ productName: sale.productName ?? t("sales.na"), quantity: 1, unitPrice: sale.total }],
      discount: sale.discount,
      total: sale.total,
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
          <h1 className="text-3xl font-bold tracking-tight">{t("sales.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("sales.description")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" /> {t("sales.exportCsv")}
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <ShoppingCart className="w-4 h-4 mr-2" /> {t("sales.addSale")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-130">
              <DialogHeader>
                <DialogTitle>{t("sales.addNewSale")}</DialogTitle>
                <DialogDescription>
                  {t("sales.addSaleDescription")}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("sales.customerName")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("sales.customerNamePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <p className="text-sm font-medium leading-none">{t("sales.productItem")}</p>
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
                      onClick={() => appendItem({ productId: "", productName: "", quantity: 1, unitPrice: 0 })}
                    >
                      <Plus className="h-4 w-4 mr-1" /> {t("sales.addItem")}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="salesmanId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("sales.salesman")}</FormLabel>
                          <Select
                            value={field.value ?? "none"}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("sales.assignSalesman")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">{t("sales.noSalesman")}</SelectItem>
                              {(salesmen ?? []).map((salesman) => (
                                <SelectItem key={salesman.id} value={String(salesman.id)}>
                                  {salesman.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("sales.paymentMethod")}</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("sales.selectPayment")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PAYMENT_METHODS.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {paymentMethodLabel(method)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("sales.discount")}</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} value={field.value as number} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium leading-none">{t("sales.totalPkr")}</p>
                      <p className="text-lg font-bold mt-2">{formatMoney(computedTotal)}</p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={createSale.isPending}>
                    {createSale.isPending ? t("sales.saving") : t("sales.saveSale")}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">{t("sales.dailySales")}</p>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <h3 className="text-2xl font-bold mt-1 text-primary">
                {formatMoney(summary?.dailySales)}
              </h3>
            )}
            {summaryLoading ? (
              <Skeleton className="h-4 w-24 mt-2" />
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                <span
                  className={
                    summary?.dailyChange != null && summary.dailyChange >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {summary?.dailyChange != null && summary.dailyChange > 0 ? "+" : ""}
                  {formatPercent(summary?.dailyChange ?? 0, 0)}
                </span>{" "}
                {t("dashboard.vsYesterday")}
              </p>
            )}
            {summaryError ? (
              <p className="text-xs text-destructive mt-2">
                {t("sales.summaryUnavailable")}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">{t("sales.weeklyVolume")}</p>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <h3 className="text-2xl font-bold mt-1">
                {formatMoney(summary?.weeklyVolume)}
              </h3>
            )}
            <p className="text-xs text-muted-foreground mt-2">{t("sales.trailing7Days")}</p>
            {summaryError ? (
              <p className="text-xs text-destructive mt-2">
                {t("sales.volumeUnavailable")}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("sales.averageOrder")}
            </p>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <h3 className="text-2xl font-bold mt-1">
                {formatMoney(summary?.averageOrderValue)}
              </h3>
            )}
            <p className="text-xs text-muted-foreground mt-2">{t("sales.perTransaction")}</p>
            {summaryError ? (
              <p className="text-xs text-destructive mt-2">
                {t("sales.averageUnavailable")}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/20 rounded text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{t("sales.shariaStatus")}</p>
                {summaryLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <h3 className="text-lg font-bold">{summary?.complianceStatus}</h3>
                )}
              </div>
            </div>
            {summaryLoading ? (
              <Skeleton className="h-4 w-32 mt-2" />
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("sales.lastAudit")}{" "}
                {summary?.lastAuditDate
                  ? format(parseISO(summary.lastAuditDate), "MMM d, yyyy")
                  : t("sales.na")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <CardTitle>{t("sales.transactions")}</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("sales.searchInvoice")}
                className="pl-9 bg-muted/50 border-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-37.5 bg-muted/50 border-none">
                <SelectValue placeholder={t("sales.statusFilterPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("sales.allStatus")}</SelectItem>
                <SelectItem value="settled">{t("sales.settled")}</SelectItem>
                <SelectItem value="pending">{t("sales.pending")}</SelectItem>
                <SelectItem value="credit">{t("sales.credit")}</SelectItem>
                <SelectItem value="refunded">{t("sales.refunded")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {salesLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>{t("sales.invoiceId")}</TableHead>
                  <TableHead>{t("sales.dateTime")}</TableHead>
                  <TableHead>{t("sales.customer")}</TableHead>
                  <TableHead>{t("sales.salesman")}</TableHead>
                  <TableHead>{t("sales.payment")}</TableHead>
                  <TableHead className="text-right">{t("sales.total")}</TableHead>
                  <TableHead>{t("sales.status")}</TableHead>
                  <TableHead className="text-right">{t("sales.downloadBill")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-sm font-medium">
                      {sale.invoiceId}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(parseISO(sale.saleDate), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                            {sale.salesmanInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{sale.salesmanName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        {getPaymentIcon(sale.paymentMethod)}
                        {paymentMethodLabel(sale.paymentMethod)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(sale.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          sale.status === "settled"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : sale.status === "credit"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : sale.status === "refunded"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : "bg-secondary/20 text-secondary-foreground border-secondary/30"
                        }
                      >
                        {statusLabel(sale.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadBill(sale)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!salesLoading && filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {salesError ? t("sales.transactionsUnavailable") : t("sales.noTransactions")}
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
