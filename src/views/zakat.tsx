 "use client";

import { useGetZakatStatus, useListZakatRecords, useCalculateZakat } from "@barakah/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { Calculator, ShieldCheck, AlertCircle, History, Landmark } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/format";

const formSchema = z.object({
  inventoryValue: z.coerce.number().min(0, "Must be a positive number"),
  cashOnHand: z.coerce.number().min(0, "Must be a positive number"),
  debts: z.coerce.number().min(0, "Must be a positive number"),
});

export function Zakat() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: status, isLoading: statusLoading, error: statusError } = useGetZakatStatus();
  const { data: records, isLoading: recordsLoading, error: recordsError } = useListZakatRecords();
  
  const calculateMutation = useCalculateZakat();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inventoryValue: 0,
      cashOnHand: 0,
      debts: 0,
    },
  });

  // Pre-fill form when status loads
  useEffect(() => {
    if (status) {
      form.reset({
        inventoryValue: status.inventoryValue,
        cashOnHand: status.cashOnHand,
        debts: status.debts,
      });
    }
  }, [status, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    calculateMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({
          title: "Zakat Calculated",
          description: "Your Zakat calculation has been recorded.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/zakat/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/zakat/records"] });
      },
      onError: (error) => {
        toast({
          title: "Calculation Failed",
          description: "An error occurred while calculating Zakat.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Zakat & Compliance</h1>
        <p className="text-muted-foreground mt-1">Manage Islamic obligations, calculate Zakat accurately (2.5%)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 0L122.451 77.5486L200 100L122.451 122.451L100 200L77.5486 122.451L0 100L77.5486 77.5486L100 0Z" fill="currentColor"/>
              </svg>
            </div>
            <CardContent className="pt-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Current Zakat Obligation</p>
                  {statusLoading ? <Skeleton className="h-12 w-48" /> : (
                    <h2 className="text-5xl font-bold text-foreground">{formatMoney(status?.zakatDue)}</h2>
                  )}
                  {statusLoading ? <Skeleton className="h-4 w-64 mt-3" /> : (
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant={status?.isCompliant ? "default" : "destructive"} className={status?.isCompliant ? "bg-green-500/20 text-green-500 hover:bg-green-500/20" : ""}>
                        {status?.isCompliant ? <ShieldCheck className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {status?.isCompliant ? "Compliant" : "Review Needed"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Next calculation due in <strong className="text-foreground">{status?.nextCalculationDays} days</strong>
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm min-w-[200px]">
                  <p className="text-xs text-muted-foreground mb-1">Nisab Threshold</p>
                  <p className="font-bold text-lg mb-3">{formatMoney(status?.nisabThreshold)}</p>
                  <p className="text-xs text-muted-foreground mb-1">Last Calculated</p>
                  <p className="font-medium text-sm">
                    {status?.lastCalculatedAt ? format(parseISO(status.lastCalculatedAt), 'MMMM d, yyyy') : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" /> Historical Records
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recordsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Net Zakatable Assets</TableHead>
                      <TableHead className="text-right">Zakat Paid (2.5%)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(records ?? []).map((record) => {
                      const netAssets = record.inventoryValue + record.cashOnHand - record.debts;
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{format(parseISO(record.calculatedAt), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">{formatMoney(netAssets)}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{formatMoney(record.calculatedZakat)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                record.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                record.status === 'overdue' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                                'bg-secondary/20 text-secondary-foreground border-secondary/30'
                              }
                            >
                              {record.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                      {(records ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            {recordsError ? "Zakat records unavailable." : "No Zakat records found."}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-secondary/20 border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="w-5 h-5 text-primary" /> Calculate Zakat
              </CardTitle>
              <CardDescription>Update values to calculate current obligation</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="inventoryValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory Value (PKR)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-muted/50 font-mono text-right" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cashOnHand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cash on Hand (PKR)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-muted/50 font-mono text-right" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="debts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deductible Debts (PKR)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-muted/50 font-mono text-right text-destructive" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 border-t border-border mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium">Net Zakatable Assets</span>
                        <span className="font-mono text-sm">
                        {formatMoney(form.watch("inventoryValue") + form.watch("cashOnHand") - form.watch("debts"))}
                      </span>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full font-bold h-12" 
                      disabled={calculateMutation.isPending}
                    >
                      {calculateMutation.isPending ? "Calculating..." : "Calculate & Record Zakat"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="p-4 flex items-start gap-3">
              <Landmark className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Islamic Compliance Note</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Zakat is calculated at 2.5% on net business assets (Inventory + Cash - Debts) after one Hawl (lunar year) has passed, provided the value exceeds the Nisab threshold.
                </p>
              </div>
            </CardContent>
          </Card>
          {statusError ? <p className="text-xs text-destructive">Zakat status unavailable.</p> : null}
        </div>
      </div>
    </div>
  );
}

