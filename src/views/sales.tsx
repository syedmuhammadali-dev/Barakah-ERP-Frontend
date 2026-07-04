"use client";

import { useMemo, useState } from "react";
import {
  getGetSalesSummaryQueryKey,
  getListSalesQueryKey,
  useCreateSale,
  useGetSalesSummary,
  useListSales,
  useListSalesmen,
} from "@barakah/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Banknote, CreditCard, Download, Search, ShieldCheck, ShoppingCart, Wallet } from "lucide-react";
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
import { Label } from "@/components/ui/label";
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
import { formatMoney, formatPercent } from "@/lib/format";
import { useAppLocale } from "@/lib/i18n";

const saleFormSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  salesmanId: z.string().optional(),
  paymentMethod: z.enum(["cash", "card", "credit"]),
  discount: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0, "Total must be positive"),
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

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerName: "",
      salesmanId: "none",
      paymentMethod: "cash",
      discount: 0,
      total: 0,
    },
  });

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
          customerName: values.customerName,
          salesmanId:
            values.salesmanId && values.salesmanId !== "none"
              ? Number(values.salesmanId)
              : undefined,
          paymentMethod: values.paymentMethod,
          discount: values.discount,
          total: values.total,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetSalesSummaryQueryKey() });
      toast({
        title: "Sale recorded",
        description: `${values.customerName} invoice has been saved.`,
      });
      form.reset();
      setIsAddOpen(false);
    } catch {
      toast({
        title: "Unable to save sale",
        description: "Please check the form and try again.",
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
      case "credit":
        return <Wallet className="w-4 h-4 text-amber-500" />;
      default:
        return <Banknote className="w-4 h-4" />;
    }
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
            <DialogContent className="sm:max-w-[520px]">
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
                          <Input placeholder="Ahmed Traders" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                                <SelectValue placeholder="Assign salesman" />
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
                                <SelectValue placeholder="Select payment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="credit">Credit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="total"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("sales.totalPkr")}</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("sales.discount")}</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createSale.isPending}>
                    {createSale.isPending ? "Saving..." : t("sales.saveSale")}
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
                vs yesterday
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
                  : "N/A"}
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
              <SelectTrigger className="w-full sm:w-[150px] bg-muted/50 border-none">
                <SelectValue placeholder="Status" />
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-muted/20 cursor-pointer">
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
                      <div className="flex items-center gap-2 text-sm capitalize">
                        {getPaymentIcon(sale.paymentMethod)}
                        {sale.paymentMethod}
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
                        {sale.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!salesLoading && filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
