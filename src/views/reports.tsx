"use client";

import { useState } from "react";
import { useGetRevenueReport } from "@barakah/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format, parseISO } from "date-fns";
import { Download, FileText, FileSpreadsheet, BarChart4 } from "lucide-react";
import { GetRevenueReportPeriod } from "@barakah/api-client-react";
import { formatMoney } from "@/lib/format";
import { useAppLocale } from "@/lib/i18n";

export function Reports() {
  const { t } = useAppLocale();
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [section, setSection] = useState("sales");
  
  const { data: report, isLoading, error } = useGetRevenueReport({ period: period as GetRevenueReportPeriod });

  const downloadCsv = () => {
    const rows = [
      [t("reports.date"), "Invoice ID", "Customer", "Status", t("reports.grossSales"), t("reports.zakatEst")],
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
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
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
                          <Badge variant="outline" className={invoice.status === 'settled' ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-muted-foreground'}>
                            {invoice.status}
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
        </div>
      </div>
    </div>
  );
}
