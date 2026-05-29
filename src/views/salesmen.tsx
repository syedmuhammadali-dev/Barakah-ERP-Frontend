 "use client";

import { useState } from "react";
import { useListSalesmen, useCreateSalesman } from "@barakah/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Target, Percent, Search, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/format";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  initials: z.string().min(1, "Initials required").max(3, "Max 3 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  target: z.coerce.number().min(0, "Target must be positive"),
  commissionRate: z.coerce.number().min(0, "Commission rate must be positive").max(100, "Cannot exceed 100%"),
});

export function Salesmen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: salesmen, isLoading, error } = useListSalesmen();
  const createMutation = useCreateSalesman();

  const filteredSalesmen = salesmen?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.initials.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      initials: "",
      email: "",
      target: 10000,
      commissionRate: 5,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Salesman Added", description: `${values.name} has been added to the team.` });
        setIsAddOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/salesmen"] });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add salesman.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Team</h1>
          <p className="text-muted-foreground mt-1">Manage salesmen, targets, and commission rates</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Add Salesman
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Salesman</DialogTitle>
              <DialogDescription>
                Create a new salesman profile with target and commission settings.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-3">
                        <FormLabel>Full Name</FormLabel>
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
                        <FormLabel>Initials</FormLabel>
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
                      <FormLabel>Email Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ahmed@example.com" type="email" {...field} value={field.value || ''} />
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
                        <FormLabel>Monthly Target (PKR)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
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
                        <FormLabel>Commission Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Salesman"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-primary">Top Performer</p>
                {isLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
                  <h3 className="text-2xl font-bold mt-1 text-foreground">
                    {salesmen && salesmen.length > 0 
                      ? [...salesmen].sort((a, b) => b.totalSales - a.totalSales)[0].name 
                      : "N/A"}
                  </h3>
                )}
                {error ? <p className="text-xs text-destructive mt-2">Sales team data unavailable.</p> : null}
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
                <p className="text-sm font-medium text-muted-foreground">Total Team Size</p>
                {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
                      <h3 className="text-2xl font-bold mt-1">{salesmen?.length || 0} Members</h3>
                )}
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
          <CardTitle>Directory</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or initials..."
              className="pl-9 bg-muted/50 border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Salesman</TableHead>
                  <TableHead className="text-right">Monthly Target</TableHead>
                  <TableHead className="w-[200px]">Progress</TableHead>
                  <TableHead className="text-right">Commission Rate</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
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
                            <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                              {salesman.initials}
                            </AvatarFallback>
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
                          className={`h-2 ${progress >= 100 ? 'bg-primary/20 [&>div]:bg-primary' : 'bg-secondary/20 [&>div]:bg-secondary-foreground'}`} 
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center text-sm font-medium bg-muted px-2 py-1 rounded">
                          {salesman.commissionRate}% <Percent className="w-3 h-3 ml-1 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">{formatMoney(salesman.totalSales)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8">Edit</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(filteredSalesmen ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {error ? "Salesmen unavailable." : "No salesmen found matching your search."}
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

