"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getGetInventorySummaryQueryKey,
  getListProductsQueryKey,
  useCreateProduct,
  useGetInventorySummary,
  useUpdateProduct,
  useDeleteProduct,
  useListProducts,
} from "@barakah/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, AlertTriangle, Plus, Search, MoreHorizontal, ShieldCheck, Undo2, Pencil, Trash2, History } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";

export function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
    sku: string;
    category: string;
    brand?: string | null;
    salePrice: number;
    margin: number;
    stockLevel: number;
    maxStock: number;
    status: string;
    isAmanat: boolean;
    isReturnable: boolean;
    deadline?: string | null;
    createdAt: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useGetInventorySummary();
  const { data: products, isLoading: productsLoading, error: productsError } = useListProducts({ search: searchTerm.length > 2 ? searchTerm : undefined });

  const productFormSchema = useMemo(() => z.object({
    name: z.string().min(2, "Product name is required"),
    sku: z.string().min(2, "SKU is required"),
    category: z.string().min(2, "Category is required"),
    brand: z.string().optional().default(""),
    salePrice: z.coerce.number().min(0),
    margin: z.coerce.number().min(0).max(100),
    stockLevel: z.coerce.number().min(0),
    maxStock: z.coerce.number().min(0),
    isAmanat: z.boolean().default(false),
    isReturnable: z.boolean().default(false),
  }), []);

  type ProductFormValues = z.infer<typeof productFormSchema>;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      brand: "",
      salePrice: 0,
      margin: 0,
      stockLevel: 0,
      maxStock: 0,
      isAmanat: false,
      isReturnable: false,
    },
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      brand: "",
      salePrice: 0,
      margin: 0,
      stockLevel: 0,
      maxStock: 0,
      isAmanat: false,
      isReturnable: false,
    },
  });

  useEffect(() => {
    if (!isEditOpen || !selectedProduct) {
      return;
    }

    editForm.reset({
      name: selectedProduct.name,
      sku: selectedProduct.sku,
      category: selectedProduct.category,
      brand: selectedProduct.brand ?? "",
      salePrice: selectedProduct.salePrice,
      margin: selectedProduct.margin,
      stockLevel: selectedProduct.stockLevel,
      maxStock: selectedProduct.maxStock,
      isAmanat: selectedProduct.isAmanat,
      isReturnable: selectedProduct.isReturnable,
    });
  }, [editForm, isEditOpen, selectedProduct]);

  const openEditProduct = (product: typeof selectedProduct) => {
    setSelectedProduct(product);
    setIsEditOpen(true);
  };

  const openHistory = (product: typeof selectedProduct) => {
    setSelectedProduct(product);
    setIsHistoryOpen(true);
  };

  const handleUpdateProduct = editForm.handleSubmit(async (values) => {
    if (!selectedProduct) {
      return;
    }

    try {
      await updateProduct.mutateAsync({
        id: selectedProduct.id,
        data: {
          name: values.name,
          salePrice: values.salePrice,
          margin: values.margin,
          stockLevel: values.stockLevel,
          maxStock: values.maxStock,
          isAmanat: values.isAmanat,
          isReturnable: values.isReturnable,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
      toast({ title: "Product updated", description: `${values.name} has been updated.` });
      setIsEditOpen(false);
      setSelectedProduct(null);
    } catch {
      toast({ title: "Unable to update product", description: "Please review the fields and try again.", variant: "destructive" });
    }
  });

  const handleDeleteProduct = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteProduct.mutateAsync({ id: deleteTarget.id });
      await queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
      toast({ title: "Product deleted", description: `${deleteTarget.name} has been removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Unable to delete product", description: "The item could not be removed.", variant: "destructive" });
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createProduct.mutateAsync({
        data: {
          name: values.name,
          sku: values.sku,
          category: values.category,
          brand: values.brand || undefined,
          salePrice: values.salePrice,
          margin: values.margin,
          stockLevel: values.stockLevel,
          maxStock: values.maxStock,
          isAmanat: values.isAmanat,
          isReturnable: values.isReturnable,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
      toast({ title: "Product added", description: `${values.name} is now in the catalog.` });
      form.reset();
      setIsAddOpen(false);
    } catch {
      toast({ title: "Unable to save product", description: "Please review the fields and try again.", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Ledger</h1>
          <p className="text-muted-foreground mt-1">Manage products, stock levels, and Amanat items</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Save a new inventory item to the catalog.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl><Input placeholder="Lawn Suit" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sku" render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl><Input placeholder="SKU-001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl><Input placeholder="Clothing" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="brand" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl><Input placeholder="Barakah" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="salePrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price (PKR)</FormLabel>
                      <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="margin" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Margin %</FormLabel>
                      <FormControl><Input type="number" min="0" max="100" step="0.1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="stockLevel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Level</FormLabel>
                      <FormControl><Input type="number" min="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="maxStock" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Stock</FormLabel>
                      <FormControl><Input type="number" min="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex items-center gap-6">
                  <FormField control={form.control} name="isAmanat" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} />
                      </FormControl>
                      <Label>Amanat Item</Label>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isReturnable" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} />
                      </FormControl>
                      <Label>Returnable</Label>
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={createProduct.isPending}>
                  {createProduct.isPending ? "Saving..." : "Save Product"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details, prices, and stock levels.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleUpdateProduct} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input placeholder="Lawn Suit" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="salePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price (PKR)</FormLabel>
                    <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="margin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margin %</FormLabel>
                    <FormControl><Input type="number" min="0" max="100" step="0.1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="stockLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Level</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="maxStock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Stock</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="brand" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl><Input disabled {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex items-center gap-6">
                <FormField control={editForm.control} name="isAmanat" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={field.onChange} />
                    </FormControl>
                    <Label>Amanat Item</Label>
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="isReturnable" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={field.onChange} />
                    </FormControl>
                    <Label>Returnable</Label>
                  </FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? "Saving..." : "Update Product"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Product Snapshot</DialogTitle>
            <DialogDescription>
              Current inventory details for {selectedProduct?.name ?? "this product"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">SKU</span>
              <span className="font-medium">{selectedProduct?.sku ?? "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{selectedProduct?.category ?? "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stock</span>
              <span className="font-medium">{selectedProduct?.stockLevel ?? 0} / {selectedProduct?.maxStock ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Sale Price</span>
              <span className="font-medium">{formatMoney(selectedProduct?.salePrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium uppercase">{selectedProduct?.status ?? "N/A"}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Detailed stock movement history is not yet exposed by the backend, so this panel shows the current live snapshot.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deleteTarget?.name ?? "this product"} from inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                            <DropdownMenuItem onClick={() => openEditProduct(product)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditProduct(product)}>
                              <Pencil className="mr-2 h-4 w-4" /> Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openHistory(product)}>
                              <History className="mr-2 h-4 w-4" /> View History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
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

