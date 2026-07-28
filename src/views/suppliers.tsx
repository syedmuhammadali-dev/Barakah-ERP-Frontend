"use client";

import { useEffect, useMemo, useState } from "react";
import { getListSupplierReturnsQueryKey, getListSuppliersQueryKey, useCreateSupplier, useCreateSupplierReturn, useListSuppliers, useListSupplierReturns } from "@barakah/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { useAppLocale } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { Truck, Undo2, Building2, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/format";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Suppliers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<{
    id: number;
    name: string;
    contactEmail?: string | null;
  } | null>(null);
  const createSupplier = useCreateSupplier();
  const createSupplierReturn = useCreateSupplierReturn();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useAppLocale();

  const { data: suppliers, isLoading: suppliersLoading, error: suppliersError } = useListSuppliers();
  const { data: returns, isLoading: returnsLoading, error: returnsError } = useListSupplierReturns();

  const supplierSchema = useMemo(() => z.object({
    name: z.string().min(2, "Supplier name is required"),
    companyName: z.string().optional().or(z.literal("")),
    contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  }), []);

  type SupplierFormValues = z.infer<typeof supplierSchema>;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      companyName: "",
      contactEmail: "",
    },
  });

  const editForm = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      companyName: "",
      contactEmail: "",
    },
  });

  const returnSchema = useMemo(() => z.object({
    supplierId: z.coerce.number().min(1, "Supplier is required"),
    productName: z.string().min(2, "Product name is required"),
    amount: z.coerce.number().min(0, "Amount must be positive"),
    dueDate: z.string().optional().or(z.literal("")),
  }), []);

  type ReturnFormValues = z.infer<typeof returnSchema>;

  const returnForm = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      supplierId: 0,
      productName: "",
      amount: 0,
      dueDate: "",
    },
  });

  useEffect(() => {
    if (!isEditOpen || !selectedSupplier) {
      return;
    }

    editForm.reset({
      name: selectedSupplier.name,
      companyName: (selectedSupplier as any).companyName ?? "",
      contactEmail: selectedSupplier.contactEmail ?? "",
    });
  }, [editForm, isEditOpen, selectedSupplier]);

  useEffect(() => {
    if (!isReturnOpen || !selectedSupplier) {
      return;
    }

    returnForm.reset({
      supplierId: selectedSupplier.id,
      productName: "",
      amount: 0,
      dueDate: "",
    });
  }, [isReturnOpen, returnForm, selectedSupplier]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createSupplier.mutateAsync({
        data: {
          name: values.name,
          companyName: values.companyName || undefined,
          contactEmail: values.contactEmail || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getListSupplierReturnsQueryKey() });
      toast({
        title: t("suppliers.supplierAdded"),
        description: t("suppliers.supplierSaved").replace("{name}", values.name),
      });
      form.reset();
      setIsAddOpen(false);
    } catch (error) {
      toast({
        title: t("suppliers.unableToSaveSupplier"),
        description: getApiErrorMessage(error, t("suppliers.verifyFields")),
        variant: "destructive",
      });
    }
  });

  const handleEditSupplier = editForm.handleSubmit(async (values) => {
    if (!selectedSupplier) {
      return;
    }

    try {
      await apiRequest(`/api/suppliers/${selectedSupplier.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name,
          companyName: values.companyName || null,
          contactEmail: values.contactEmail || null,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
      toast({
        title: t("suppliers.supplierUpdated"),
        description: t("suppliers.supplierUpdatedMsg").replace("{name}", values.name),
      });
      setIsEditOpen(false);
      setSelectedSupplier(null);
    } catch (error) {
      toast({
        title: t("suppliers.unableToUpdateSupplier"),
        description: getApiErrorMessage(error, t("suppliers.checkDetails")),
        variant: "destructive",
      });
    }
  });

  const handleCreateReturn = returnForm.handleSubmit(async (values) => {
    try {
      await createSupplierReturn.mutateAsync({
        data: {
          supplierId: values.supplierId,
          productName: values.productName,
          amount: values.amount,
          dueDate: values.dueDate || null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListSupplierReturnsQueryKey() });
      toast({
        title: t("suppliers.returnLogged"),
        description: t("suppliers.returnRecorded"),
      });
      setIsReturnOpen(false);
      setSelectedSupplier(null);
      returnForm.reset();
    } catch (error) {
      toast({
        title: t("suppliers.unableToLogReturn"),
        description: getApiErrorMessage(error, t("suppliers.reviewForm")),
        variant: "destructive",
      });
    }
  });

  const handleDeleteSupplier = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await apiRequest(`/api/suppliers/${deleteTarget.id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getListSupplierReturnsQueryKey() });
      toast({
        title: t("suppliers.supplierDeleted"),
        description: t("suppliers.supplierRemoved").replace("{name}", deleteTarget.name),
      });
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: t("suppliers.unableToDeleteSupplier"),
        description: getApiErrorMessage(error, t("suppliers.couldNotRemove")),
        variant: "destructive",
      });
    }
  };

  const filteredSuppliers = suppliers?.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("suppliers.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("suppliers.description")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("suppliers.activeSuppliers")}</p>
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
                <p className="text-sm font-medium text-muted-foreground">{t("suppliers.totalPendingReturns")}</p>
                {returnsLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
                  <h3 className="text-3xl font-bold mt-1">
                    {formatMoney((returns ?? []).filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0))}
                  </h3>
                )}
                {returnsError ? <p className="text-xs text-destructive mt-2">{t("suppliers.returnTotalsUnavailable")}</p> : null}
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
                <Undo2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("suppliers.editSupplier")}</DialogTitle>
            <DialogDescription>
              {t("suppliers.editSupplierDescription")}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleEditSupplier} className="space-y-4 pt-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("suppliers.supplierName")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Ali Traders" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Alibaba Group" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("suppliers.contactEmail")}</FormLabel>
                    <FormControl>
                      <Input placeholder="vendor@example.com" type="email" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {t("suppliers.saveSupplier")}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("suppliers.logSupplierReturn")}</DialogTitle>
            <DialogDescription>
              {t("suppliers.logReturnDescription")}
            </DialogDescription>
          </DialogHeader>
          <Form {...returnForm}>
            <form onSubmit={handleCreateReturn} className="space-y-4 pt-4">
              <FormField
                control={returnForm.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("suppliers.supplier")}</FormLabel>
                    <Select
                      value={String(field.value || "")}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(suppliers ?? []).map((supplier) => (
                          <SelectItem key={supplier.id} value={String(supplier.id)}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={returnForm.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("suppliers.productName")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Returned product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={returnForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("suppliers.expectedAmountPkr")}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={returnForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("suppliers.dueDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" placeholder={t("suppliers.dueDate")} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createSupplierReturn.isPending}>
                {createSupplierReturn.isPending ? t("inventory.saving") : t("suppliers.saveReturn")}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("suppliers.deleteSupplierTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("suppliers.deleteSupplierDescription").replace("{name}", deleteTarget?.name ?? "this supplier")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("inventory.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier}>{t("inventory.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 bg-muted/50 p-1">
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Truck className="w-4 h-4 mr-2" /> {t("suppliers.suppliersList")}
          </TabsTrigger>
          <TabsTrigger value="returns" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Undo2 className="w-4 h-4 mr-2" /> {t("suppliers.returnLedger")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t("suppliers.registeredSuppliers")}</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("suppliers.searchSupplier")}
                    className="pl-9 bg-muted/50 border-none h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-9">
                      <Plus className="w-4 h-4 mr-1" /> {t("suppliers.addSupplier")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                      <DialogTitle>{t("suppliers.addNewSupplier")}</DialogTitle>
                      <DialogDescription>
                        {t("suppliers.addSupplierDescription")}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={onSubmit} className="space-y-4 pt-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("suppliers.supplierName")}</FormLabel>
                              <FormControl>
                                <Input placeholder="Ali Traders" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Alibaba Group" {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("suppliers.contactEmail")}</FormLabel>
                              <FormControl>
                                <Input placeholder="vendor@example.com" type="email" {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={createSupplier.isPending}>
                          {createSupplier.isPending ? t("inventory.saving") : t("suppliers.saveSupplier")}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
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
                      <TableHead>{t("suppliers.supplierName")}</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>{t("suppliers.contactEmail")}</TableHead>
                      <TableHead>{t("suppliers.joinedDate")}</TableHead>
                      <TableHead className="text-right">{t("suppliers.outstandingBalance")}</TableHead>
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
                        <TableCell className="text-muted-foreground">{(supplier as any).companyName || "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.contactEmail || "N/A"}</TableCell>
                        <TableCell className="text-sm">{format(parseISO(supplier.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell className={`text-right font-medium ${supplier.totalBalance > 0 ? "text-destructive" : ""}`}>
                          {formatMoney(supplier.totalBalance)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setIsEditOpen(true);
                              }}
                            >
                              <Pencil className="mr-1 h-4 w-4" /> {t("suppliers.manage")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget({ id: supplier.id, name: supplier.name })}
                            >
                              <Trash2 className="mr-1 h-4 w-4" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(filteredSuppliers ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {suppliersError ? t("suppliers.suppliersUnavailable") : t("suppliers.noSuppliersFound").replace("{search}", searchTerm)}
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
                <CardTitle className="text-lg">{t("suppliers.returnLedger")}</CardTitle>
                <CardDescription>{t("suppliers.returnLedgerDescription")}</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="h-9" onClick={() => setIsReturnOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> {t("suppliers.logReturn")}
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
                      <TableHead>{t("suppliers.dateLogged")}</TableHead>
                      <TableHead>{t("suppliers.supplier")}</TableHead>
                      <TableHead>{t("suppliers.productReturned")}</TableHead>
                      <TableHead className="text-right">{t("suppliers.amountExpected")}</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>{t("suppliers.dueDate")}</TableHead>
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
                          {returnsError ? t("suppliers.returnsUnavailable") : t("suppliers.noReturns")}
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
