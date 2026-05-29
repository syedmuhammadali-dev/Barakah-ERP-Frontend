 "use client";

import { useState } from "react";
import { useGetInventorySummary, useListProducts, getListProductsQueryKey, useCreateProduct } from "@barakah/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, AlertTriangle, Plus, Search, MoreHorizontal, ShieldCheck, Undo2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/format";

export function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useGetInventorySummary();
  const { data: products, isLoading: productsLoading, error: productsError } = useListProducts({ search: searchTerm.length > 2 ? searchTerm : undefined });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Ledger</h1>
          <p className="text-muted-foreground mt-1">Manage products, stock levels, and Amanat items</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
                {summaryLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
                  <h3 className="text-2xl font-bold mt-1 text-primary">{formatMoney(summary?.totalValue)}</h3>
                )}
                {summaryError ? <p className="text-xs text-destructive mt-2">Inventory summary unavailable.</p> : null}
              </div>
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Package className="w-5 h-5" />
              </div>
            </div>
            {summaryLoading ? <Skeleton className="h-4 w-24 mt-4" /> : (
              <p className="text-xs text-muted-foreground mt-4">
                <span className={summary?.totalValueChange && summary.totalValueChange >= 0 ? "text-green-500" : "text-red-500"}>
                  {summary?.totalValueChange && summary.totalValueChange > 0 ? "+" : ""}{summary?.totalValueChange}%
                </span> vs last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={summary?.lowStockCount && summary.lowStockCount > 0 ? "border-destructive/30" : ""}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Alerts</p>
                {summaryLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
                  <h3 className="text-2xl font-bold mt-1">{summary?.lowStockCount} Items</h3>
                )}
              </div>
              <div className={`p-3 rounded-lg ${summary?.lowStockCount && summary.lowStockCount > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Returns</p>
                {summaryLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
                  <h3 className="text-2xl font-bold mt-1">{formatMoney(summary?.pendingReturnsValue)}</h3>
                )}
                {summaryError ? <p className="text-xs text-destructive mt-2">Return summary unavailable.</p> : null}
              </div>
              <div className="p-3 bg-secondary text-secondary-foreground rounded-lg">
                <Undo2 className="w-5 h-5" />
              </div>
            </div>
            {summaryLoading ? <Skeleton className="h-4 w-24 mt-4" /> : (
              <p className="text-xs text-muted-foreground mt-4">Across {summary?.pendingReturnsCount} products</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle>Product Catalog</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search SKU or name..."
              className="pl-9 bg-muted/50 border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
            {productsLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[100px]">SKU</TableHead>
                  <TableHead>Product Details</TableHead>
                  <TableHead>Price & Margin</TableHead>
                  <TableHead className="w-[200px]">Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(products ?? []).map((product) => {
                  const stockPercent = Math.min(100, Math.round((product.stockLevel / product.maxStock) * 100));
                  
                  return (
                    <TableRow key={product.id} className="group hover:bg-muted/20">
                      <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{product.category}</span>
                          {product.isAmanat && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 bg-primary/5 text-primary border-primary/20">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Amanat
                            </Badge>
                          )}
                          {product.isReturnable && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 bg-secondary/20 text-secondary-foreground border-secondary/30">
                              <Undo2 className="w-3 h-3 mr-1" /> Returnable
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatMoney(product.salePrice)}</div>
                        <div className="text-xs text-muted-foreground">{product.margin}% Margin</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{product.stockLevel} / {product.maxStock}</span>
                          <span className="text-xs text-muted-foreground">{stockPercent}%</span>
                        </div>
                        <Progress 
                          value={stockPercent} 
                          className={`h-1.5 ${stockPercent < 20 ? 'bg-destructive/20 [&>div]:bg-destructive' : stockPercent < 50 ? 'bg-amber-500/20 [&>div]:bg-amber-500' : 'bg-primary/20 [&>div]:bg-primary'}`} 
                        />
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            product.status === 'in_stock' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                            product.status === 'low_stock' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                            product.status === 'out_of_stock' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                            'bg-secondary/20 text-secondary-foreground border-secondary/30'
                          }
                        >
                          {product.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Product</DropdownMenuItem>
                            <DropdownMenuItem>Adjust Stock</DropdownMenuItem>
                            <DropdownMenuItem>View History</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!productsLoading && (products ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {productsError ? "Products unavailable." : "No products found."}
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

