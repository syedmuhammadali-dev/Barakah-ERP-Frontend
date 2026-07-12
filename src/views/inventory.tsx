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
  useGetBusinessProfile,
} from "@barakah/api-client-react";
import { getBusinessTypeConfig } from "@/lib/business-types";
import { computeAdjustedStock } from "@/lib/inventory-utils";
import { BusinessTypeExtraFields } from "@/components/business-type-extra-fields";
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
import { useAppLocale } from "@/lib/i18n";

export function Inventory() {
  const { t } = useAppLocale();
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
    attributes?: Record<string, unknown>;
    createdAt: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustDelta, setAdjustDelta] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [addExtraFields, setAddExtraFields] = useState<Record<string, string>>({});
  const [editExtraFields, setEditExtraFields] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const { data: businessProfile } = useGetBusinessProfile({ query: { queryKey: ["businessProfile"], retry: false } });
  const businessTypeConfig = useMemo(() => getBusinessTypeConfig(businessProfile?.businessType), [businessProfile?.businessType]);

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
    salesmanName: z.string().optional().default(""),
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
      salesmanName: "",
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
      salesmanName: "",
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
    const attrs = selectedProduct.attributes ?? {};
    setEditExtraFields(
      Object.fromEntries(businessTypeConfig.extraFields.map((f) => [f.key, String(attrs[f.key] ?? "")])),
    );
  }, [editForm, isEditOpen, selectedProduct, businessTypeConfig]);

  const openEditProduct = (product: typeof selectedProduct) => {
    setSelectedProduct(product);
    setIsEditOpen(true);
  };

  const openAdjustStock = (product: typeof selectedProduct) => {
    setSelectedProduct(product);
    setAdjustDelta(0);
    setAdjustReason("");
    setIsAdjustOpen(true);
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
          category: values.category,
          salePrice: values.salePrice,
          margin: values.margin,
          stockLevel: values.stockLevel,
          maxStock: values.maxStock,
          isAmanat: values.isAmanat,
          isReturnable: values.isReturnable,
          attributes: editExtraFields,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
      toast({ title: "Product updated", description: `${values.name} has been updated.` });
      setIsEditOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Failed to update product:", error);
      toast({ title: "Unable to update product", description: "Please review the fields and try again.", variant: "destructive" });
    }
  });

  const handleAdjustStock = async () => {
    if (!selectedProduct) {
      return;
    }
    const newStockLevel = computeAdjustedStock(selectedProduct.stockLevel, adjustDelta);
    try {
      await updateProduct.mutateAsync({
        id: selectedProduct.id,
        data: { stockLevel: newStockLevel, maxStock: selectedProduct.maxStock },
      });
      await queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
      toast({ title: "Stock adjusted", description: `${selectedProduct.name} is now at ${newStockLevel} units.` });
      setIsAdjustOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Failed to adjust stock:", error);
      toast({ title: "Unable to adjust stock", description: "Please try again.", variant: "destructive" });
    }
  };

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
    } catch (error) {
      console.error("Failed to delete product:", error);
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
          salesmanName: values.salesmanName || undefined,
          attributes: addExtraFields,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
      toast({ title: "Product added", description: `${values.name} is now in the catalog.` });
      form.reset();
      setAddExtraFields({});
      setIsAddOpen(false);
    } catch (error) {
      console.error("Failed to create product:", error);
      toast({ title: "Unable to save product", description: "Please review the fields and try again.", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("inventory.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("inventory.description")}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> {t("inventory.addProduct")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>{t("inventory.addNewProduct")}</DialogTitle>
              <DialogDescription>{t("inventory.addNewDescription")}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.productName")}</FormLabel>
                      <FormControl><Input placeholder="Lawn Suit" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sku" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.sku")}</FormLabel>
                      <FormControl><Input placeholder="SKU-001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <>
                          <Input placeholder="Clothing" list="add-category-options" {...field} />
                          <datalist id="add-category-options">
                            {businessTypeConfig.defaultCategories.map((c) => (
                              <option key={c} value={c} />
                            ))}
                          </datalist>
                        </>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="brand" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.brand")}</FormLabel>
                      <FormControl><Input placeholder="Barakah" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="salesmanName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salesman</FormLabel>
                      <FormControl><Input placeholder="Assigned salesman" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <BusinessTypeExtraFields
                  fields={businessTypeConfig.extraFields}
                  values={addExtraFields}
                  onChange={(key, value) => setAddExtraFields((prev) => ({ ...prev, [key]: value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="salePrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.salePrice")}</FormLabel>
                      <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="margin" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.marginPercent")}</FormLabel>
                      <FormControl><Input type="number" min="0" max="100" step="0.1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="stockLevel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.stockLevel")}</FormLabel>
                      <FormControl><Input type="number" min="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="maxStock" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.maxStock")}</FormLabel>
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
                      <Label>{t("inventory.amanatItem")}</Label>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isReturnable" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} />
                      </FormControl>
                      <Label>{t("inventory.returnable")}</Label>
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={createProduct.isPending}>
                  {createProduct.isPending ? t("inventory.saving") : t("inventory.saveProduct")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{t("inventory.editProductTitle")}</DialogTitle>
            <DialogDescription>
              {t("inventory.editProductDescription")}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleUpdateProduct} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.productName")}</FormLabel>
                    <FormControl><Input placeholder="Lawn Suit" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="salePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.salePrice")}</FormLabel>
                    <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="margin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.marginPercent")}</FormLabel>
                    <FormControl><Input type="number" min="0" max="100" step="0.1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="stockLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.stockLevel")}</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="maxStock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.maxStock")}</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <>
                        <Input list="edit-category-options" {...field} />
                        <datalist id="edit-category-options">
                          {businessTypeConfig.defaultCategories.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <BusinessTypeExtraFields
                fields={businessTypeConfig.extraFields}
                values={editExtraFields}
                onChange={(key, value) => setEditExtraFields((prev) => ({ ...prev, [key]: value }))}
              />
              <div className="flex items-center gap-6">
                <FormField control={editForm.control} name="isAmanat" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={field.onChange} />
                    </FormControl>
                    <Label>{t("inventory.amanatItem")}</Label>
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="isReturnable" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={field.onChange} />
                    </FormControl>
                    <Label>{t("inventory.returnable")}</Label>
                  </FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? t("inventory.saving") : t("inventory.updateProduct")}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{t("inventory.adjustStock")}</DialogTitle>
            <DialogDescription>
              Add or remove units from {selectedProduct?.name ?? "this product"}&apos;s current stock of {selectedProduct?.stockLevel ?? 0}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="adjust-delta">Adjustment (use a negative number to remove stock)</Label>
              <Input
                id="adjust-delta"
                type="number"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjust-reason">Reason</Label>
              <Input
                id="adjust-reason"
                placeholder="e.g. new stock received, damaged goods"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              New stock level: {computeAdjustedStock(selectedProduct?.stockLevel ?? 0, adjustDelta)}
            </p>
            <Button type="button" className="w-full" disabled={updateProduct.isPending || adjustDelta === 0} onClick={handleAdjustStock}>
              {updateProduct.isPending ? t("inventory.saving") : t("inventory.adjustStock")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("inventory.productSnapshot")}</DialogTitle>
            <DialogDescription>
              Current inventory details for {selectedProduct?.name ?? "this product"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("inventory.sku")}</span>
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
              <span className="text-muted-foreground">{t("inventory.salePrice")}</span>
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
            <AlertDialogTitle>{t("inventory.deleteProductTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deleteTarget?.name ?? "this product"} from inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("inventory.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct}>{t("inventory.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("inventory.totalValue")}</p>
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
                <span className={summary?.totalValueChange != null && summary.totalValueChange >= 0 ? "text-green-500" : "text-red-500"}>
                  {summary?.totalValueChange != null && summary.totalValueChange > 0 ? "+" : ""}{summary?.totalValueChange}%
                </span> {t("inventory.vsLastMonth")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={summary?.lowStockCount != null && summary.lowStockCount > 0 ? "border-destructive/30" : ""}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("inventory.lowStock")}</p>
                {summaryLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
                  <h3 className="text-2xl font-bold mt-1">{summary?.lowStockCount} Items</h3>
                )}
              </div>
              <div className={`p-3 rounded-lg ${summary?.lowStockCount != null && summary.lowStockCount > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">{t("inventory.requiresAttention")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("inventory.pendingReturns")}</p>
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
          <CardTitle>{t("inventory.productCatalog")}</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("inventory.searchSku")}
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
                  <TableHead className="w-[100px]">{t("inventory.sku")}</TableHead>
                  <TableHead>{t("inventory.productDetails")}</TableHead>
                  <TableHead>{t("inventory.priceMargin")}</TableHead>
                  <TableHead className="w-[200px]">{t("inventory.stockLevel")}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">{t("inventory.actions")}</TableHead>
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
                              <ShieldCheck className="w-3 h-3 mr-1" /> {t("inventory.amanatItem")}
                            </Badge>
                          )}
                          {product.isReturnable && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 bg-secondary/20 text-secondary-foreground border-secondary/30">
                              <Undo2 className="w-3 h-3 mr-1" /> {t("inventory.returnable")}
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
                              <Pencil className="mr-2 h-4 w-4" /> {t("inventory.editProduct")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAdjustStock(product)}>
                              <Package className="mr-2 h-4 w-4" /> {t("inventory.adjustStock")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openHistory(product)}>
                              <History className="mr-2 h-4 w-4" /> {t("inventory.viewHistory")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> {t("inventory.delete")}
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
                      {productsError ? t("inventory.productsUnavailable") : t("inventory.noProducts")}
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

