"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useGetRevenueReport, useGetInventoryDistribution, useGetTopProducts, useListSalesmen, useListProducts, useListSupplierReturns, useListSales, useGetDashboardOverview } from "@barakah/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { format, parseISO } from "date-fns";
import { Download, FileText, FileSpreadsheet, BarChart4, Package, Undo2, Calculator, Users, Eye, EyeOff, ChevronDown, ChevronRight, Sparkles, CalendarDays, TrendingUp } from "lucide-react";
import { GetRevenueReportPeriod } from "@barakah/api-client-react";
import { formatMoney, formatPercent } from "@/lib/format";
import { useAppLocale } from "@/lib/i18n";

interface SalesOverview {
  todayTotal: number;
  monthTotal: number;
  lastMonthTotal: number;
  accountCreatedYear: number;
  currentYear: number;
}
interface DailySalesItem { date: string; day: number; total: number; }
interface MonthlySalesItem { month: number; label: string; total: number; }

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function Reports() {
  const { t } = useAppLocale();
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [section, setSection] = useState("sales");

  const { data: report, isLoading, error } = useGetRevenueReport({ period: period as GetRevenueReportPeriod });
  const { data: distribution } = useGetInventoryDistribution();
  const { data: topProducts } = useGetTopProducts();
  const { data: salesmen } = useListSalesmen();
  const { data: products } = useListProducts();
  const { data: returns } = useListSupplierReturns();
  const { data: overview } = useGetDashboardOverview();

  const [hideMonthly, setHideMonthly] = useState(false);
  const [hideDaily, setHideDaily] = useState(false);
  const [isDailyTableOpen, setIsDailyTableOpen] = useState(false);
  const [isMonthlyTableOpen, setIsMonthlyTableOpen] = useState(false);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [growPrompt, setGrowPrompt] = useState("");

  const { data: salesOverview } = useQuery<SalesOverview>({
    queryKey: ["/api/reports/sales-overview"],
    queryFn: () => apiRequest("/api/reports/sales-overview"),
  });
  const { data: dailySales, isLoading: dailySalesLoading } = useQuery<DailySalesItem[]>({
    queryKey: ["/api/reports/daily-sales"],
    queryFn: () => apiRequest("/api/reports/daily-sales"),
    enabled: isDailyTableOpen,
  });
  const { data: monthlySales, isLoading: monthlySalesLoading } = useQuery<MonthlySalesItem[]>({
    queryKey: ["/api/reports/monthly-sales", salesOverview?.currentYear],
    queryFn: () => apiRequest(`/api/reports/monthly-sales?year=${salesOverview?.currentYear}`),
    enabled: isMonthlyTableOpen && salesOverview != null,
  });
  const { data: expandedYearSales, isLoading: expandedYearLoading } = useQuery<MonthlySalesItem[]>({
    queryKey: ["/api/reports/monthly-sales", expandedYear],
    queryFn: () => apiRequest(`/api/reports/monthly-sales?year=${expandedYear}`),
    enabled: expandedYear != null,
  });
  const growMutation = useMutation({
    mutationFn: (prompt: string) =>
      apiRequest<{ reply: string }>("/api/reports/grow-business", {
        method: "POST",
        body: JSON.stringify({ prompt: prompt.trim() || undefined }),
      }),
  });

  const years = salesOverview
    ? Array.from(
        { length: salesOverview.currentYear - salesOverview.accountCreatedYear + 1 },
        (_, i) => salesOverview.currentYear - i,
      )
    : [];

  const downloadCsv = () => {
    if (section === "sales") {
      const rows = [
        [t("reports.date"), t("reports.invoiceId"), t("reports.customer"), t("reports.status"), t("reports.grossSales"), t("reports.zakatEst")],
        ...(report?.invoices ?? []).map((invoice) => [
          invoice.date,
          invoice.invoiceId,
          invoice.customer,
          invoice.status,
          String(invoice.grossSales),
          String(invoice.zakatAmount),
        ]),
      ];
      const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `barakah-report-${period}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("reports.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("reports.description")}
            <span className="ml-2 text-primary">• {section === "sales" ? t("reports.salesAnalysis") : section === "inventory" ? t("reports.inventoryStock") : section === "returns" ? t("reports.returnAudits") : section === "zakat" ? t("reports.zakatCompliance") : t("reports.salesmanKpis")}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="border-border" onClick={() => window.print()}>
            <FileText className="w-4 h-4 mr-2" /> {t("reports.pdf")}
          </Button>
          <Button type="button" variant="outline" size="sm" className="border-border" onClick={downloadCsv}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> {t("reports.excel")}
          </Button>
          <Button type="button" variant="outline" size="sm" className="border-border" onClick={downloadCsv}>
            <Download className="w-4 h-4 mr-2" /> {t("reports.csv")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 space-y-2 shrink-0">
          <Card className="bg-card">
            <div className="flex flex-col p-2">
              <Button type="button" variant="ghost" className={`justify-start ${section === "sales" ? "bg-secondary/50 font-medium" : "text-muted-foreground font-normal"}`} onClick={() => setSection("sales")}>
                {t("reports.salesAnalysis")}
              </Button>
              <Button type="button" variant="ghost" className={`justify-start ${section === "inventory" ? "bg-secondary/50 font-medium" : "text-muted-foreground font-normal"}`} onClick={() => setSection("inventory")}>
                {t("reports.inventoryStock")}
              </Button>
              <Button type="button" variant="ghost" className={`justify-start ${section === "returns" ? "bg-secondary/50 font-medium" : "text-muted-foreground font-normal"}`} onClick={() => setSection("returns")}>
                {t("reports.returnAudits")}
              </Button>
              <Button type="button" variant="ghost" className={`justify-start ${section === "zakat" ? "bg-secondary/50 font-medium" : "text-muted-foreground font-normal"}`} onClick={() => setSection("zakat")}>
                {t("reports.zakatCompliance")}
              </Button>
              <Button type="button" variant="ghost" className={`justify-start ${section === "salesmen" ? "bg-secondary/50 font-medium" : "text-muted-foreground font-normal"}`} onClick={() => setSection("salesmen")}>
                {t("reports.salesmanKpis")}
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex-1 space-y-6">
          {section === "sales" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setIsMonthlyTableOpen(true)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">{t("reports.monthlySales")}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); setHideMonthly((v) => !v); }}
                      >
                        {hideMonthly ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <h3 className="text-3xl font-bold mt-1 text-primary">
                      {hideMonthly ? "••••••" : formatMoney(salesOverview?.monthTotal)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("reports.lastMonth")}: {hideMonthly ? "••••••" : formatMoney(salesOverview?.lastMonthTotal)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setIsDailyTableOpen(true)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">{t("reports.todaySales")}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); setHideDaily((v) => !v); }}
                      >
                        {hideDaily ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <h3 className="text-3xl font-bold mt-1">
                      {hideDaily ? "••••••" : formatMoney(salesOverview?.todayTotal)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">{t("reports.clickForDailyBreakdown")}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" /> {t("reports.yearlyBreakdown")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {years.map((year) => (
                    <div key={year} className="border border-border/50 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left"
                        onClick={() => setExpandedYear((y) => (y === year ? null : year))}
                      >
                        <span className="font-medium">{year}</span>
                        {expandedYear === year ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {expandedYear === year && (
                        <div className="p-3 pt-0 space-y-1">
                          {expandedYearLoading ? (
                            <Skeleton className="h-24 w-full" />
                          ) : (
                            (expandedYearSales ?? []).map((m) => (
                              <div key={m.month} className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0">
                                <span className="text-muted-foreground">{m.label}</span>
                                <span className="font-medium">{formatMoney(m.total)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {years.length === 0 ? <p className="text-sm text-muted-foreground">{t("reports.na")}</p> : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> {t("reports.monthlyTrend")} ({salesOverview?.currentYear})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 pl-0">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlySales ?? []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> {t("reports.askAiTitle")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t("reports.askAiDescription")}</p>
                  <Textarea
                    placeholder={t("reports.askAiPlaceholder")}
                    value={growPrompt}
                    onChange={(e) => setGrowPrompt(e.target.value)}
                    rows={3}
                  />
                  <Button
                    type="button"
                    onClick={() => growMutation.mutate(growPrompt)}
                    disabled={growMutation.isPending}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {growMutation.isPending ? t("reports.askAiLoading") : t("reports.askAiButton")}
                  </Button>
                  {growMutation.data ? (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm whitespace-pre-line">
                      {growMutation.data.reply}
                    </div>
                  ) : null}
                  {growMutation.isError ? (
                    <p className="text-sm text-destructive">{t("reports.askAiFailed")}</p>
                  ) : null}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">{t("reports.totalRevenue")}</p>
                    {isLoading ? <Skeleton className="h-8 w-40 mt-1" /> : (
                      <h3 className="text-3xl font-bold mt-1 text-primary">{formatMoney(report?.totalRevenue)}</h3>
                    )}
                    {error ? <p className="text-xs text-destructive mt-2">{t("reports.reportUnavailable")}</p> : null}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">{t("reports.netProfit")}</p>
                    {isLoading ? <Skeleton className="h-8 w-40 mt-1" /> : (
                      <h3 className="text-3xl font-bold mt-1">{formatMoney(report?.netProfit)}</h3>
                    )}
                    {error ? <p className="text-xs text-destructive mt-2">{t("reports.profitUnavailable")}</p> : null}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart4 className="w-5 h-5 text-primary" /> {t("reports.revenueGrowth")}
                  </CardTitle>
                  <Select value={period} onValueChange={(v: "week" | "month" | "year") => setPeriod(v)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">{t("reports.thisWeek")}</SelectItem>
                      <SelectItem value="month">{t("reports.thisMonth")}</SelectItem>
                      <SelectItem value="year">{t("reports.thisYear")}</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="pt-4 pl-0">
                  {isLoading ? <Skeleton className="h-[350px] w-full ml-6" /> : (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={report?.revenueByWeek ?? []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `PKR ${value}`} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                            itemStyle={{ color: 'hsl(var(--primary))' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t("reports.detailedExport")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>{t("reports.date")}</TableHead>
                          <TableHead>{t("reports.invoiceId")}</TableHead>
                          <TableHead>{t("reports.customer")}</TableHead>
                          <TableHead>{t("reports.status")}</TableHead>
                          <TableHead className="text-right">{t("reports.grossSales")}</TableHead>
                          <TableHead className="text-right">{t("reports.zakatEst")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(report?.invoices ?? []).map((invoice, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{format(parseISO(invoice.date), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="font-mono text-xs">{invoice.invoiceId}</TableCell>
                            <TableCell>{invoice.customer}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={invoice.status === 'done' ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-muted-foreground'}>
                                {invoice.status === 'done' ? t("sales.done")
                                  : invoice.status === 'pending' ? t("sales.pending")
                                    : invoice.status === 'credit' ? t("sales.credit")
                                      : invoice.status === 'refunded' ? t("sales.refunded")
                                        : invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatMoney(invoice.grossSales)}</TableCell>
                            <TableCell className="text-right text-primary">{formatMoney(invoice.zakatAmount)}</TableCell>
                          </TableRow>
                        ))}
                        {!isLoading && (report?.invoices ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              {error ? t("reports.invoiceDataUnavailable") : t("reports.noInvoiceData")}
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {section === "inventory" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">{t("reports.totalProducts")}</p>
                    <h3 className="text-3xl font-bold mt-1 text-primary">{products?.length ?? 0}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">{t("reports.lowStockItems")}</p>
                    <h3 className="text-3xl font-bold mt-1">{(products ?? []).filter(p => p.status === "low_stock" || p.status === "out_of_stock").length}</h3>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> {t("reports.categoryDistribution")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distribution ?? []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="category">
                          {(distribution ?? []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                    {(distribution ?? []).slice(0, 5).map((item, i) => (
                      <div key={item.category} className="flex items-center text-xs">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{item.category} ({item.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("reports.topProducts")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>{t("reports.product")}</TableHead>
                        <TableHead>{t("reports.category")}</TableHead>
                        <TableHead className="text-right">{t("reports.stock")}</TableHead>
                        <TableHead className="text-right">{t("reports.change")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(topProducts ?? []).slice(0, 10).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-muted-foreground">{p.category}</TableCell>
                          <TableCell className="text-right">{p.unitsSold}</TableCell>
                          <TableCell className="text-right">{p.changePercent}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {section === "returns" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">{t("reports.totalReturns")}</p>
                    <h3 className="text-3xl font-bold mt-1 text-primary">{returns?.length ?? 0}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">{t("reports.pendingReturnsValue")}</p>
                    <h3 className="text-3xl font-bold mt-1">{formatMoney((returns ?? []).filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0))}</h3>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg"><Undo2 className="w-5 h-5 text-primary inline mr-2" /> {t("reports.returnAuditLog")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>{t("reports.date")}</TableHead>
                        <TableHead>{t("reports.supplier")}</TableHead>
                        <TableHead>{t("reports.product")}</TableHead>
                        <TableHead className="text-right">{t("reports.amount")}</TableHead>
                        <TableHead>{t("reports.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(returns ?? []).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">{format(parseISO(r.createdAt), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{r.supplierName}</TableCell>
                          <TableCell>{r.productName}</TableCell>
                          <TableCell className="text-right font-medium">{formatMoney(r.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={r.status === 'completed' ? 'text-green-500 border-green-500/20 bg-green-500/10' : r.status === 'pending' ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' : 'text-destructive border-destructive/20 bg-destructive/10'}>
                              {r.status === 'pending' ? t("sales.pending") : r.status === 'completed' ? t("zakat.paid") : r.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {section === "zakat" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">{t("reports.zakatDue")}</p>
                    <h3 className="text-3xl font-bold mt-1 text-primary">{formatMoney(overview?.zakatDue)}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">{t("reports.complianceStatus")}</p>
                    <h3 className="text-3xl font-bold mt-1 text-green-500">{t("reports.active")}</h3>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg"><Calculator className="w-5 h-5 text-primary inline mr-2" /> {t("reports.zakatOverview")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {t("reports.zakatOverviewDescription")}
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-border/50 p-4">
                      <p className="text-sm text-muted-foreground">{t("reports.inventoryValue")}</p>
                      <p className="text-xl font-bold mt-1">{formatMoney(overview?.inventoryValue)}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-4">
                      <p className="text-sm text-muted-foreground">{t("reports.zakatRate")}</p>
                      <p className="text-xl font-bold mt-1">2.5%</p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-4">
                      <p className="text-sm text-muted-foreground">{t("reports.lowStockItems")}</p>
                      <p className="text-xl font-bold mt-1">{overview?.lowStockCount ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {section === "salesmen" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground"><Users className="w-4 h-4 inline mr-1" /> {t("reports.teamSize")}</p>
                    <h3 className="text-3xl font-bold mt-1 text-primary">{salesmen?.length ?? 0}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">{t("reports.topPerformer")}</p>
                    <h3 className="text-3xl font-bold mt-1">{salesmen && salesmen.length > 0 ? [...salesmen].sort((a, b) => b.totalSales - a.totalSales)[0].name : t("reports.na")}</h3>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("reports.salesmanPerformance")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>{t("reports.name")}</TableHead>
                        <TableHead className="text-right">{t("reports.target")}</TableHead>
                        <TableHead className="text-right">{t("reports.salesAmount")}</TableHead>
                        <TableHead>{t("reports.progress")}</TableHead>
                        <TableHead className="text-right">{t("reports.commission")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(salesmen ?? []).map((sm) => {
                        const progress = Math.min(100, (sm.totalSales / sm.target) * 100) || 0;
                        return (
                          <TableRow key={sm.id}>
                            <TableCell className="font-medium">{sm.name}</TableCell>
                            <TableCell className="text-right">{formatMoney(sm.target)}</TableCell>
                            <TableCell className="text-right font-bold text-primary">{formatMoney(sm.totalSales)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={progress} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground w-10 text-right">{progress.toFixed(0)}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{sm.commissionRate}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <Dialog open={isDailyTableOpen} onOpenChange={setIsDailyTableOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("reports.dailyBreakdownTitle")}</DialogTitle>
            <DialogDescription>{t("reports.dailyBreakdownDescription")}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            {dailySalesLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("reports.date")}</TableHead>
                    <TableHead className="text-right">{t("reports.grossSales")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dailySales ?? []).map((d) => (
                    <TableRow key={d.date}>
                      <TableCell>{d.date}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(d.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMonthlyTableOpen} onOpenChange={setIsMonthlyTableOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("reports.monthlyBreakdownTitle")}</DialogTitle>
            <DialogDescription>{t("reports.monthlyBreakdownDescription")}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            {monthlySalesLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("reports.month")}</TableHead>
                    <TableHead className="text-right">{t("reports.grossSales")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(monthlySales ?? []).map((m) => (
                    <TableRow key={m.month}>
                      <TableCell>{m.label}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(m.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
