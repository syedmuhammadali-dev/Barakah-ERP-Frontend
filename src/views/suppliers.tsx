 "use client";

import { useState } from "react";
import { useListSuppliers, useListSupplierReturns } from "@barakah/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { Truck, Undo2, Building2, Search, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/format";

export function Suppliers() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: suppliers, isLoading: suppliersLoading, error: suppliersError } = useListSuppliers();
  const { data: returns, isLoading: returnsLoading, error: returnsError } = useListSupplierReturns();

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Management</h1>
          <p className="text-muted-foreground mt-1">Manage vendor relationships, balances, and returns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Suppliers</p>
                {suppliersLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
                  <h3 className="text-3xl font-bold mt-1 text-primary">{suppliers?.length || 0}</h3>
                )}
              </div>
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pending Returns</p>
                {returnsLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
                  <h3 className="text-3xl font-bold mt-1">
                    {formatMoney((returns ?? []).filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0))}
                  </h3>
                )}
                {returnsError ? <p className="text-xs text-destructive mt-2">Return totals unavailable.</p> : null}
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
                <Undo2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 bg-muted/50 p-1">
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Truck className="w-4 h-4 mr-2" /> Suppliers List
          </TabsTrigger>
          <TabsTrigger value="returns" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Undo2 className="w-4 h-4 mr-2" /> Return Ledger
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="suppliers" className="mt-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Registered Suppliers</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search supplier name..."
                    className="pl-9 bg-muted/50 border-none h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button size="sm" className="h-9">
                  <Plus className="w-4 h-4 mr-1" /> Add Supplier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {suppliersLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Contact Email</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead className="text-right">Outstanding Balance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredSuppliers ?? []).map((supplier) => (
                      <TableRow key={supplier.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {supplier.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{supplier.contactEmail || "N/A"}</TableCell>
                        <TableCell className="text-sm">{format(parseISO(supplier.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell className={`text-right font-medium ${supplier.totalBalance > 0 ? "text-destructive" : ""}`}>
                          {formatMoney(supplier.totalBalance)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(filteredSuppliers ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {suppliersError ? "Suppliers unavailable." : `No suppliers found matching "${searchTerm}".`}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="returns" className="mt-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Return Ledger</CardTitle>
                <CardDescription>Track items sent back to suppliers</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="h-9">
                <Plus className="w-4 h-4 mr-1" /> Log Return
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {returnsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Date Logged</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Product Returned</TableHead>
                      <TableHead className="text-right">Amount Expected</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(returns ?? []).map((ret) => (
                      <TableRow key={ret.id} className="hover:bg-muted/20">
                        <TableCell className="text-sm text-muted-foreground">{format(parseISO(ret.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="font-medium">{ret.supplierName}</TableCell>
                        <TableCell>{ret.productName}</TableCell>
                        <TableCell className="text-right font-medium">{formatMoney(ret.amount)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              ret.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                              ret.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                              'bg-destructive/10 text-destructive border-destructive/20'
                            }
                          >
                            {ret.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {ret.dueDate ? format(parseISO(ret.dueDate), 'MMM d, yyyy') : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(returns ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {returnsError ? "Return ledger unavailable." : "No return records found."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

