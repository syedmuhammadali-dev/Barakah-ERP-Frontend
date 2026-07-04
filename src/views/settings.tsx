"use client";

import { useEffect, useState } from "react";
import { useGetSettings, useUpdateSettings, useGetBusinessProfile, useUpdateBusinessProfile } from "@barakah/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@barakah/auth-web";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Store, Shield, Bell, MoonStar, MapPin, Globe, Phone } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  email: z.string().email("Valid email is required"),
  shopName: z.string().min(2, "Shop name is required"),
  phone: z.string().optional(),
  contactEmail: z.string().email("Valid email is required"),
  address: z.string().optional(),
  baseCurrency: z.string().min(1),
  timezone: z.string().min(1),
  vatRate: z.coerce.number().min(0).max(100),
  nisabThreshold: z.coerce.number().min(0),
  islamicModeEnabled: z.boolean(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsAlerts: z.boolean(),
});

export function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useGetSettings();
  const { data: profile, isLoading: profileLoading, error: profileError } = useGetBusinessProfile({ query: { queryKey: ["businessProfile"], retry: false } });
  const updateMutation = useUpdateSettings();
  const updateProfileMutation = useUpdateBusinessProfile();

  const isLoading = settingsLoading || profileLoading;
  const error = settingsError || profileError;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      shopName: "",
      phone: "",
      contactEmail: "",
      address: "",
      baseCurrency: "PKR",
      timezone: "Asia/Riyadh",
      vatRate: 15,
      nisabThreshold: 2200,
      islamicModeEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      smsAlerts: false,
    },
  });

  useEffect(() => {
    if (!isLoading) {
      form.reset({
        email: user?.email || "",
        shopName: profile?.businessName || settings?.shopName || "",
        phone: profile?.phone || "",
        contactEmail: settings?.contactEmail || "",
        address: settings?.address || "",
        baseCurrency: settings?.baseCurrency || "PKR",
        timezone: settings?.timezone || "Asia/Riyadh",
        vatRate: settings?.vatRate ?? 15,
        nisabThreshold: settings?.nisabThreshold ?? 2200,
        islamicModeEnabled: settings?.islamicModeEnabled ?? true,
        emailNotifications: settings?.emailNotifications ?? true,
        pushNotifications: settings?.pushNotifications ?? true,
        smsAlerts: settings?.smsAlerts ?? false,
      });
    }
  }, [settings, profile, user, isLoading, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSaving(true);

    try {
      const promises: Promise<unknown>[] = [];

      if (user?.email !== values.email && values.email) {
        promises.push(
          fetch("/api/auth/me", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: values.email }),
            credentials: "include",
          }),
        );
      }

      if (profile && (profile.businessName !== values.shopName || profile.phone !== values.phone)) {
        promises.push(
          updateProfileMutation.mutateAsync({ data: { businessName: values.shopName, businessType: profile.businessType, phone: values.phone || null } }),
        );
      }

      promises.push(
        updateMutation.mutateAsync({ data: {
          shopName: values.shopName,
          contactEmail: values.contactEmail,
          address: values.address,
          baseCurrency: values.baseCurrency,
          timezone: values.timezone,
          vatRate: values.vatRate,
          nisabThreshold: values.nisabThreshold,
          islamicModeEnabled: values.islamicModeEnabled,
          emailNotifications: values.emailNotifications,
          pushNotifications: values.pushNotifications,
          smsAlerts: values.smsAlerts,
        } }),
      );

      await Promise.all(promises);

      toast({
        title: "Settings Updated",
        description: "Your configuration changes have been saved.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["businessProfile"] });
      queryClient.invalidateQueries({ queryKey: ["businessProfile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } catch {
      toast({
        title: "Update Failed",
        description: "An error occurred while saving settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shop Configuration</h1>
        <p className="text-muted-foreground mt-1">Manage store identity, compliance, and localization</p>
        {error ? <p className="mt-2 text-sm text-destructive">Some data could not be loaded. You can still edit and save the form.</p> : null}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" /> General Profile
              </h3>
              <p className="text-sm text-muted-foreground">Public-facing identity and contact information.</p>
            </div>
            <Card className="md:col-span-3">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shopName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Barakah Retail" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="+92 300 1234567" {...field} disabled={isLoading} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Email</FormLabel>
                        <FormDescription className="text-xs">Login email used at signup</FormDescription>
                        <FormControl>
                          <Input type="email" placeholder="admin@barakah.com" {...field} disabled={isLoading} />
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
                        <FormLabel>Contact Email</FormLabel>
                        <FormDescription className="text-xs">Public email for your customers</FormDescription>
                        <FormControl>
                          <Input type="email" placeholder="contact@barakah.com" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Physical Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Riyadh, KSA" {...field} disabled={isLoading} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="bg-border/50" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MoonStar className="w-5 h-5 text-primary" /> Islamic Mode
              </h3>
              <p className="text-sm text-muted-foreground">Configure Zakat threshold and Sharia-compliant features.</p>
            </div>
            <Card className="md:col-span-3 border-primary/20">
              <CardContent className="pt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="islamicModeEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-primary font-bold">Islamic Business Mode</FormLabel>
                        <FormDescription>
                          Activates Zakat calculation module, Amanat product tagging, and disables interest-based fields.
                        </FormDescription>
                      </div>
                      <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                            disabled={isLoading}
                          />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {form.watch("islamicModeEnabled") && (
                  <div className="pl-2 border-l-2 border-primary/30 py-2">
                    <FormField
                      control={form.control}
                      name="nisabThreshold"
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel>Nisab Threshold (PKR)</FormLabel>
                          <FormDescription>Current value of 85 grams of gold.</FormDescription>
                          <FormControl>
                            <Input type="number" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator className="bg-border/50" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" /> Localization
              </h3>
              <p className="text-sm text-muted-foreground">Currency, taxes, and regional settings.</p>
            </div>
            <Card className="md:col-span-3">
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="baseCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger disabled={isLoading}>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PKR">Pakistani Rupee (PKR)</SelectItem>
                          <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
                          <SelectItem value="KWD">Kuwaiti Dinar (KWD)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger disabled={isLoading}>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Asia/Riyadh">Asia/Riyadh (AST)</SelectItem>
                          <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                          <SelectItem value="Asia/Karachi">Asia/Karachi (PKT)</SelectItem>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                          <SelectItem value="Asia/Dhaka">Asia/Dhaka (BST)</SelectItem>
                          <SelectItem value="Asia/Kabul">Asia/Kabul (AFT)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vatRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standard VAT Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Separator className="bg-border/50" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" /> Notifications
              </h3>
              <p className="text-sm text-muted-foreground">How the system communicates with you.</p>
            </div>
            <Card className="md:col-span-3">
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email Notifications</FormLabel>
                        <FormDescription>Receive daily summaries and critical alerts via email.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pushNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Push Notifications</FormLabel>
                        <FormDescription>Receive in-app notifications for low stock and pending returns.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smsAlerts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">SMS Alerts</FormLabel>
                        <FormDescription>Receive text messages for high-value transactions (Requires Add-on).</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="bg-muted/30 border-t border-border/50 flex justify-end py-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="font-bold min-w-[150px]"
                  disabled={saving || isLoading}
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}

