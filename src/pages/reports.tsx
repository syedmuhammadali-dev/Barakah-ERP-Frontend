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

export function Reports() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  
  const { data: report, isLoading, error } = useGetRevenueReport({ period: period as GetRevenueReportPeriod });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports Center</h1>
          <p className="text-muted-foreground mt-1">Financial analytics, auditing, and compliance records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-border">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="border-border">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="border-border">
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 space-y-2 shrink-0">
          <Card className="bg-card">
            <div className="flex flex-col p-2">
              <Button variant="ghost" className="justify-start bg-secondary/50 font-medium">
                Sales Analysis
              </Button>
              <Button variant="ghost" className="justify-start text-muted-foreground font-normal">
                Inventory Stock
              </Button>
              <Button variant="ghost" className="justify-start text-muted-foreground font-normal">
                Return Audits
              </Button>
              <Button variant="ghost" className="justify-start text-muted-foreground font-normal">
                Zakat & Compliance
              </Button>
              <Button variant="ghost" className="justify-start text-muted-foreground font-normal">
                Salesman KPIs
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                {isLoading ? <Skeleton className="h-8 w-40 mt-1" /> : (
                  <h3 className="text-3xl font-bold mt-1 text-primary">{formatMoney(report?.totalRevenue)}</h3>
                )}
                {error ? <p className="text-xs text-destructive mt-2">Revenue report unavailable.</p> : null}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">Net Profit Estimate</p>
                {isLoading ? <Skeleton className="h-8 w-40 mt-1" /> : (
                  <h3 className="text-3xl font-bold mt-1">{formatMoney(report?.netProfit)}</h3>
                )}
                {error ? <p className="text-xs text-destructive mt-2">Profit estimate unavailable.</p> : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart4 className="w-5 h-5 text-primary" /> Revenue Growth
              </CardTitle>
              <Select value={period} onValueChange={(v: "week" | "month" | "year") => setPeriod(v)}>
                <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
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
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `SAR ${value}`} />
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
              <CardTitle className="text-lg">Detailed Export Data</CardTitle>
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
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Gross Sales</TableHead>
                      <TableHead className="text-right">Zakat Est. (2.5%)</TableHead>
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
                          {error ? "Invoice data unavailable." : "No invoice data found."}
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

