 "use client";

import { useState } from "react";
import { useGetSalesSummary, useListSales } from "@barakah/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, parseISO } from "date-fns";
import { ShoppingCart, Banknote, CreditCard, Wallet, ShieldCheck, Download, Search } from "lucide-react";
import { formatMoney, formatPercent } from "@/lib/format";

export function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useGetSalesSummary();
  const { data: sales, isLoading: salesLoading, error: salesError } = useListSales({ 
    status: statusFilter !== "all" ? statusFilter : undefined 
  });

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4 text-emerald-500" />;
      case 'card': return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'credit': return <Wallet className="w-4 h-4 text-amber-500" />;
      default: return <Banknote className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Ledger</h1>
          <p className="text-muted-foreground mt-1">Transaction history and daily performance</p>
        </div>
        <Button variant="outline" className="border-border">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Daily Sales</p>
            {summaryLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
              <h3 className="text-2xl font-bold mt-1 text-primary">{formatMoney(summary?.dailySales)}</h3>
            )}
            {summaryLoading ? <Skeleton className="h-4 w-24 mt-2" /> : (
              <p className="text-xs text-muted-foreground mt-2">
                <span className={summary?.dailyChange && summary.dailyChange >= 0 ? "text-green-500" : "text-red-500"}>
                  {summary?.dailyChange && summary.dailyChange > 0 ? "+" : ""}{formatPercent(summary?.dailyChange ?? 0, 0)}
                </span> vs yesterday
              </p>
            )}
            {summaryError ? <p className="text-xs text-destructive mt-2">Sales summary unavailable.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Weekly Volume</p>
            {summaryLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
              <h3 className="text-2xl font-bold mt-1">{formatMoney(summary?.weeklyVolume)}</h3>
            )}
            <p className="text-xs text-muted-foreground mt-2">Trailing 7 days</p>
            {summaryError ? <p className="text-xs text-destructive mt-2">Volume summary unavailable.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Average Order</p>
            {summaryLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
              <h3 className="text-2xl font-bold mt-1">{formatMoney(summary?.averageOrderValue)}</h3>
            )}
            <p className="text-xs text-muted-foreground mt-2">Per transaction</p>
            {summaryError ? <p className="text-xs text-destructive mt-2">Average order unavailable.</p> : null}
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/20 rounded text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Sharia Status</p>
                {summaryLoading ? <Skeleton className="h-6 w-20" /> : (
                  <h3 className="text-lg font-bold">{summary?.complianceStatus}</h3>
                )}
              </div>
            </div>
            {summaryLoading ? <Skeleton className="h-4 w-32 mt-2" /> : (
              <p className="text-xs text-muted-foreground">Last audit: {summary?.lastAuditDate ? format(parseISO(summary.lastAuditDate), 'MMM d, yyyy') : 'N/A'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice or customer..."
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {salesLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {(sales ?? []).map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-muted/20 cursor-pointer">
                    <TableCell className="font-mono text-sm font-medium">{sale.invoiceId}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(parseISO(sale.saleDate), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">{sale.salesmanInitials}</AvatarFallback>
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
                    <TableCell className="text-right font-medium">{formatMoney(sale.total)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          sale.status === 'settled' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          sale.status === 'credit' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          sale.status === 'refunded' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                          'bg-secondary/20 text-secondary-foreground border-secondary/30'
                        }
                      >
                        {sale.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!salesLoading && (sales ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {salesError ? "Transactions unavailable." : "No transactions found."}
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

