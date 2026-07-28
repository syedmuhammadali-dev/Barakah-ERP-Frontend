"use client";

import { useEffect, useMemo, useState } from "react";
import { getGetDashboardOverviewQueryKey, getListSalesmenQueryKey, useCreateSalesman, useListSalesmen } from "@barakah/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Percent, Search, Trophy, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/format";
import { apiRequest } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAppLocale } from "@/lib/i18n";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  initials: z.string().min(1, "Initials required").max(3, "Max 3 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  profileImageUrl: z.string().optional().or(z.literal("")),
  target: z.coerce.number().min(0, "Target must be positive"),
  commissionRate: z.coerce.number().min(0, "Commission rate must be positive").max(100, "Cannot exceed 100%"),
});

type SalesmanFormValues = z.infer<typeof formSchema>;

export function Salesmen() {
  const { t } = useAppLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: salesmen, isLoading, error } = useListSalesmen();
  const createMutation = useCreateSalesman();

  const selectedSalesman = useMemo(
    () => salesmen?.find((salesman) => salesman.id === selectedSalesmanId) ?? null,
    [salesmen, selectedSalesmanId],
  );

  const filteredSalesmen = salesmen?.filter(
    (salesman) =>
      salesman.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salesman.initials.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const form = useForm<SalesmanFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      initials: "",
      email: "",
      profileImageUrl: "",
      target: 10000,
      commissionRate: 5,
    },
  });

  useEffect(() => {
    if (!isFormOpen) {
      return;
    }

    if (selectedSalesman) {
      form.reset({
        name: selectedSalesman.name,
        initials: selectedSalesman.initials,
        email: selectedSalesman.email ?? "",
        profileImageUrl: selectedSalesman.profileImageUrl ?? "",
        target: selectedSalesman.target,
        commissionRate: selectedSalesman.commissionRate,
      });
      return;
    }

    form.reset({
      name: "",
      initials: "",
      email: "",
      profileImageUrl: "",
      target: 10000,
      commissionRate: 5,
    });
  }, [form, isFormOpen, selectedSalesman]);

  const openCreateDialog = () => {
    setSelectedSalesmanId(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (salesmanId: number) => {
    setSelectedSalesmanId(salesmanId);
    setIsFormOpen(true);
  };

  const saveSalesman = async (values: SalesmanFormValues) => {
    try {
      if (selectedSalesman) {
        await apiRequest(`/api/salesmen/${selectedSalesman.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: values.name,
            initials: values.initials,
            email: values.email || null,
            profileImageUrl: values.profileImageUrl || null,
            target: values.target,
            commissionRate: values.commissionRate,
          }),
        });
        toast({
          title: "Salesman updated",
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        await createMutation.mutateAsync({
          data: {
            name: values.name,
            initials: values.initials,
            email: values.email || undefined,
            profileImageUrl: values.profileImageUrl || undefined,
            target: values.target,
            commissionRate: values.commissionRate,
          },
        });
        toast({
          title: "Salesman added",
          description: `${values.name} has been added to the team.`,
        });
      }

      await queryClient.invalidateQueries({ queryKey: getListSalesmenQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
      setIsFormOpen(false);
      setSelectedSalesmanId(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Unable to save salesman",
        description: getApiErrorMessage(error, "Please check the details and try again."),
        variant: "destructive",
      });
    }
  };

  const handleDeleteSalesman = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await apiRequest(`/api/salesmen/${deleteTarget.id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: getListSalesmenQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
      toast({
        title: "Salesman removed",
        description: `${deleteTarget.name} has been deleted.`,
      });
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: "Unable to remove salesman",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("salesmen.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("salesmen.description")}</p>
        </div>

        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" /> {t("salesmen.addSalesman")}
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedSalesman ? t("salesmen.editSalesman") : t("salesmen.addNewSalesman")}</DialogTitle>
            <DialogDescription>
              {selectedSalesman
                ? t("salesmen.editSalesmanDescription")
                : t("salesmen.addSalesmanDescription")}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(saveSalesman)} className="space-y-4 pt-4">
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>{t("salesmen.fullName")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Ahmed Abdullah" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initials"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>{t("salesmen.initials")}</FormLabel>
                      <FormControl>
                        <Input placeholder="AA" {...field} maxLength={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("salesmen.emailOptional")}</FormLabel>
                    <FormControl>
                      <Input placeholder="ahmed@example.com" type="email" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profileImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/photo.jpg" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("salesmen.monthlyTargetPkr")}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("salesmen.commissionPercent")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("inventory.saving") : selectedSalesman ? t("salesmen.updateSalesman") : t("salesmen.saveSalesman")}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("salesmen.deleteSalesmanTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("salesmen.deleteSalesmanDescription").replace("{name}", deleteTarget?.name ?? "this salesman")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("inventory.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSalesman}>{t("inventory.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-primary">{t("salesmen.topPerformer")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold mt-1 text-foreground">
                    {salesmen && salesmen.length > 0 ? [...salesmen].sort((a, b) => b.totalSales - a.totalSales)[0].name : "N/A"}
                  </h3>
                )}
                {error ? <p className="text-xs text-destructive mt-2">{t("salesmen.salesTeamUnavailable")}</p> : null}
              </div>
              <div className="p-3 bg-primary/20 text-primary rounded-lg">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("salesmen.totalTeamSize")}</p>
                {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : <h3 className="text-2xl font-bold mt-1">{salesmen?.length || 0} {t("salesmen.members")}</h3>}
              </div>
              <div className="p-3 bg-muted text-muted-foreground rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle>{t("salesmen.directory")}</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("salesmen.searchName")}
              className="pl-9 bg-muted/50 border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Salesman</TableHead>
                  <TableHead className="text-right">{t("salesmen.monthlyTarget")}</TableHead>
                  <TableHead className="w-[200px]">{t("salesmen.progress")}</TableHead>
                  <TableHead className="text-right">{t("salesmen.commissionRate")}</TableHead>
                  <TableHead className="text-right">{t("salesmen.totalSales")}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredSalesmen ?? []).map((salesman) => {
                  const progress = Math.min(100, (salesman.totalSales / salesman.target) * 100) || 0;
                  return (
                    <TableRow key={salesman.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={salesman.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">{salesman.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{salesman.name}</div>
                            {salesman.email && <div className="text-xs text-muted-foreground">{salesman.email}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(salesman.target)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress
                          value={progress}
                          className={`h-2 ${progress >= 100 ? "bg-primary/20 [&>div]:bg-primary" : "bg-secondary/20 [&>div]:bg-secondary-foreground"}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center text-sm font-medium bg-muted px-2 py-1 rounded">
                          {salesman.commissionRate}% <Percent className="w-3 h-3 ml-1 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">{formatMoney(salesman.totalSales)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8" onClick={() => openEditDialog(salesman.id)}>
                            <Pencil className="w-4 h-4 mr-1" /> {t("salesmen.edit")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget({ id: salesman.id, name: salesman.name })}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> {t("inventory.delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(filteredSalesmen ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {error ? t("salesmen.salesmenUnavailable") : t("salesmen.noSalesmenFound")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
