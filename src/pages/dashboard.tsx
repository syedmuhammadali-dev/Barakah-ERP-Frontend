import { useGetDashboardOverview, useGetRevenueReport, useGetInventoryDistribution, useGetTopProducts, useListAuditLog, useListSales } from "@barakah/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TrendingUp, Package, AlertTriangle, Calculator, CalendarClock } from "lucide-react";
import { formatMoney, formatPercent } from "@/lib/format";

export function Dashboard() {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useGetDashboardOverview();
  const { data: revenueReport, isLoading: revenueLoading, error: revenueError } = useGetRevenueReport({ period: "week" });
  const { data: distribution, isLoading: distributionLoading, error: distributionError } = useGetInventoryDistribution();
  const { data: topProducts, isLoading: topProductsLoading, error: topProductsError } = useGetTopProducts();
  const { data: recentSales, isLoading: salesLoading, error: salesError } = useListSales();
  const { data: auditLog, isLoading: auditLoading, error: auditError } = useListAuditLog();

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Badge variant="outline" className="px-3 py-1 font-mono text-sm border-primary/20 bg-primary/10 text-primary">
          <CalendarClock className="w-4 h-4 mr-2 inline" />
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold text-primary">{formatMoney(overview?.todaySales)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={overview?.todaySalesChange && overview.todaySalesChange >= 0 ? "text-green-500" : "text-red-500"}>
                    {overview?.todaySalesChange && overview.todaySalesChange > 0 ? "+" : ""}{formatPercent(overview?.todaySalesChange ?? 0, 0)}
                  </span> from yesterday
                </p>
                {overviewError ? <p className="mt-2 text-xs text-destructive">Sales summary unavailable.</p> : null}
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zakat Due</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold text-primary">{formatMoney(overview?.zakatDue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Due in {overview?.zakatNextDays} days
                </p>
                {overviewError ? <p className="mt-2 text-xs text-destructive">Zakat summary unavailable.</p> : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{formatMoney(overview?.inventoryValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview?.inventoryUnits} units across all stores
                </p>
                {overviewError ? <p className="mt-2 text-xs text-destructive">Inventory summary unavailable.</p> : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card className={overview?.lowStockCount && overview.lowStockCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${overview?.lowStockCount && overview.lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            {overviewLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{overview?.lowStockCount} items</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires immediate reorder
                </p>
                {overviewError ? <p className="mt-2 text-xs text-destructive">Alert status unavailable.</p> : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            {revenueLoading ? <Skeleton className="h-[300px] w-full ml-6" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueReport?.revenueByWeek ?? []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `SAR ${value}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {revenueError ? <p className="mt-2 text-xs text-destructive px-6">Revenue chart unavailable.</p> : null}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {distributionLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="h-[300px] w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="category"
                    >
                      {(distribution ?? []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full mt-4">
                  {(distribution ?? []).slice(0, 4).map((item, i) => (
                    <div key={item.category} className="flex items-center text-xs">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate">{item.category} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
                {distributionError ? <p className="mt-2 text-xs text-destructive">Category distribution unavailable.</p> : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? <Skeleton className="h-[250px] w-full" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Salesman</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentSales ?? []).slice(0, 5).map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs">{sale.invoiceId}</TableCell>
                      <TableCell>{sale.salesmanName}</TableCell>
                      <TableCell className="font-medium">{formatMoney(sale.total)}</TableCell>
                      <TableCell>
                        <Badge variant={sale.status === 'settled' ? 'default' : 'secondary'} className={sale.status === 'settled' ? 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/30' : ''}>
                          {sale.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!salesLoading && (recentSales ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {salesError ? "Transactions unavailable." : "No transactions found."}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsLoading ? <Skeleton className="h-[250px] w-full" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(topProducts ?? []).slice(0, 5).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.category}</TableCell>
                      <TableCell className="text-right font-mono">{product.unitsSold}</TableCell>
                      <TableCell className="text-right">
                        <span className={product.changePercent >= 0 ? "text-green-500" : "text-red-500"}>
                          {product.changePercent > 0 ? "+" : ""}{product.changePercent}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!topProductsLoading && (topProducts ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {topProductsError ? "Top products unavailable." : "No products found."}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <div className="space-y-2">
                {(auditLog ?? []).slice(0, 3).map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(entry.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                  </div>
                ))}
                {!auditLoading && (auditLog ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {auditError ? "Audit log unavailable." : "No audit entries yet."}
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

