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
import { Store, Shield, Bell, MoonStar, MapPin, Globe, Phone, Download, Monitor, KeyRound, Hash, Plus, Trash2, Save } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { exportAllDataToExcel } from "@/lib/export-data";
import { DESKTOP_APP_DOWNLOAD_URL } from "@/lib/site";
import { Separator } from "@/components/ui/separator";
import { useAppLocale } from "@/lib/i18n";

const formSchema = z.object({
  email: z.string().email("Valid email is required"),
  shopName: z.string().min(2, "Shop name is required"),
  phone: z.string().optional(),
  contactEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  address: z.string().optional(),
  websiteUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
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
  const { t } = useAppLocale();
  const [saving, setSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await exportAllDataToExcel();
      toast({ title: t("settings.exportDataSuccess") });
    } catch (error) {
      toast({
        title: t("settings.exportDataFailed"),
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const { data: settings, isLoading: settingsLoading, error: settingsError } = useGetSettings();
  const { data: profile, isLoading: profileLoading, error: profileError } = useGetBusinessProfile({ query: { queryKey: ["businessProfile"], retry: false } });
  const updateMutation = useUpdateSettings();
  const updateProfileMutation = useUpdateBusinessProfile();

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [priceCodeRows, setPriceCodeRows] = useState<{ digit: string; letter: string }[]>([]);
  const [savingPriceCode, setSavingPriceCode] = useState(false);

  useEffect(() => {
    if (settings) {
      setPriceCodeRows(settings.priceCodeMap ?? []);
    }
  }, [settings]);

  const handleSaveApiKey = async () => {
    setSavingApiKey(true);
    try {
      await updateMutation.mutateAsync({ data: { aiApiKey: apiKeyInput.trim() || null } });
      setApiKeyInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: t(apiKeyInput.trim() ? "settings.apiKeySaved" : "settings.apiKeyRemoved") });
    } catch (error) {
      toast({
        title: t("settings.apiKeySaveFailed"),
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleAddPriceCodeRow = () => {
    setPriceCodeRows((rows) => [...rows, { digit: "", letter: "" }]);
  };

  const handleUpdatePriceCodeRow = (index: number, field: "digit" | "letter", value: string) => {
    setPriceCodeRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleDeletePriceCodeRow = async (index: number) => {
    const next = priceCodeRows.filter((_, i) => i !== index);
    setPriceCodeRows(next);
    await savePriceCodeMap(next);
  };

  const savePriceCodeMap = async (rows: { digit: string; letter: string }[]) => {
    setSavingPriceCode(true);
    try {
      const cleaned = rows.filter((row) => row.digit.trim() && row.letter.trim());
      await updateMutation.mutateAsync({ data: { priceCodeMap: cleaned } });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: t("settings.priceCodeSaved") });
    } catch (error) {
      toast({
        title: t("settings.priceCodeSaveFailed"),
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSavingPriceCode(false);
    }
  };

  const isLoading = settingsLoading || profileLoading;
  const error = settingsError || profileError;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      shopName: "",
      phone: "",
      contactEmail: "",
      address: "",
      websiteUrl: "",
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
        websiteUrl: settings?.websiteUrl || "",
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
        updateMutation.mutateAsync({
          data: {
            shopName: values.shopName,
            contactEmail: values.contactEmail,
            address: values.address,
            websiteUrl: values.websiteUrl || null,
            baseCurrency: values.baseCurrency,
            timezone: values.timezone,
            vatRate: values.vatRate,
            nisabThreshold: values.nisabThreshold,
            islamicModeEnabled: values.islamicModeEnabled,
            emailNotifications: values.emailNotifications,
            pushNotifications: values.pushNotifications,
            smsAlerts: values.smsAlerts,
          }
        }),
      );

      await Promise.all(promises);

      toast({
        title: t("settings.settingsUpdated"),
        description: t("settings.settingsUpdatedDescription"),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["businessProfile"] });
      queryClient.invalidateQueries({ queryKey: ["businessProfile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } catch (error) {
      toast({
        title: t("settings.updateFailed"),
        description: getApiErrorMessage(error, t("settings.updateFailedDescription")),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("settings.description")}</p>
        {error ? <p className="mt-2 text-sm text-destructive">{t("settings.loadError")}</p> : null}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" /> {t("settings.generalProfile")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("settings.generalProfileDescription")}</p>
            </div>
            <Card className="md:col-span-3">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shopName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.shopName")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("settings.shopNamePlaceholder")} {...field} disabled={isLoading} />
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
                        <FormLabel>{t("settings.phoneNumber")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder={t("settings.phonePlaceholder")} {...field} disabled={isLoading} />
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
                        <FormLabel>{t("settings.accountEmail")}</FormLabel>
                        <FormDescription className="text-xs">{t("settings.accountEmailDescription")}</FormDescription>
                        <FormControl>
                          <Input type="email" placeholder={t("settings.accountEmailPlaceholder")} {...field} disabled={isLoading} />
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
                        <FormLabel>{t("settings.contactEmail")}</FormLabel>
                        <FormDescription className="text-xs">{t("settings.contactEmailDescription")}</FormDescription>
                        <FormControl>
                          <Input type="email" placeholder={t("settings.contactEmailPlaceholder")} {...field} disabled={isLoading} />
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
                        <FormLabel>{t("settings.physicalAddress")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder={t("settings.physicalAddressPlaceholder")} {...field} disabled={isLoading} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.websiteUrl")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder={t("settings.websiteUrlPlaceholder")} {...field} disabled={isLoading} />
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
                <MoonStar className="w-5 h-5 text-primary" /> {t("settings.islamicMode")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("settings.islamicModeDescription")}</p>
            </div>
            <Card className="md:col-span-3 border-primary/20">
              <CardContent className="pt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="islamicModeEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-primary font-bold">{t("settings.islamicBusinessMode")}</FormLabel>
                        <FormDescription>
                          {t("settings.islamicBusinessModeDescription")}
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
                          <FormLabel>{t("settings.nisabThreshold")}</FormLabel>
                          <FormDescription>{t("settings.nisabThresholdDescription")}</FormDescription>
                          <FormControl>
                            <Input type="number" placeholder="2200" {...field} value={field.value as number} disabled={isLoading} />
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
                <Globe className="w-5 h-5 text-primary" /> {t("settings.localization")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("settings.localizationDescription")}</p>
            </div>
            <Card className="md:col-span-3">
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="baseCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.baseCurrency")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger disabled={isLoading}>
                            <SelectValue placeholder={t("settings.selectCurrency")} />
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
                      <FormLabel>{t("settings.timezone")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger disabled={isLoading}>
                            <SelectValue placeholder={t("settings.selectTimezone")} />
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
                      <FormLabel>{t("settings.vatRate")}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="15" {...field} value={field.value as number} disabled={isLoading} />
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
                <Bell className="w-5 h-5 text-primary" /> {t("settings.notifications")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("settings.notificationsDescription")}</p>
            </div>
            <Card className="md:col-span-3">
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t("settings.emailNotifications")}</FormLabel>
                        <FormDescription>{t("settings.emailNotificationsDescription")}</FormDescription>
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
                        <FormLabel className="text-base">{t("settings.pushNotifications")}</FormLabel>
                        <FormDescription>{t("settings.pushNotificationsDescription")}</FormDescription>
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
                        <FormLabel className="text-base">{t("settings.smsAlerts")}</FormLabel>
                        <FormDescription>{t("settings.smsAlertsDescription")}</FormDescription>
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
                  className="font-bold min-w-37.5"
                  disabled={saving || isLoading}
                >
                  {saving ? t("settings.saving") : t("settings.saveConfiguration")}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" /> {t("settings.exportData")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("settings.exportDataDescription")}</p>
        </div>
        <Card className="md:col-span-3">
          <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground max-w-md">{t("settings.exportDataHint")}</p>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? t("settings.exporting") : t("settings.exportDataButton")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" /> {t("settings.desktopApp")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("settings.desktopAppDescription")}</p>
        </div>
        <Card className="md:col-span-3">
          <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground max-w-md">{t("settings.desktopAppHint")}</p>
            <Button type="button" variant="outline" asChild>
              <a href={DESKTOP_APP_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                <Monitor className="w-4 h-4 mr-2" />
                {t("settings.getDesktopApp")}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" /> {t("settings.aiAssistant")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("settings.aiAssistantDescription")}</p>
        </div>
        <Card className="md:col-span-3">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              {settings?.hasCustomApiKey ? t("settings.apiKeySet") : t("settings.apiKeyNotSet")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="password"
                placeholder={t("settings.apiKeyPlaceholder")}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="button" onClick={handleSaveApiKey} disabled={savingApiKey || isLoading}>
                {t("settings.saveApiKey")}
              </Button>
              {settings?.hasCustomApiKey ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    setApiKeyInput("");
                    setSavingApiKey(true);
                    try {
                      await updateMutation.mutateAsync({ data: { aiApiKey: null } });
                      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
                      toast({ title: t("settings.apiKeyRemoved") });
                    } catch (error) {
                      toast({ title: t("settings.apiKeySaveFailed"), description: getApiErrorMessage(error), variant: "destructive" });
                    } finally {
                      setSavingApiKey(false);
                    }
                  }}
                  disabled={savingApiKey || isLoading}
                >
                  {t("settings.removeApiKey")}
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{t("settings.apiKeyHint")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" /> {t("settings.priceCodeLanguage")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("settings.priceCodeLanguageDescription")}</p>
        </div>
        <Card className="md:col-span-3">
          <CardContent className="pt-6 space-y-3">
            <p className="text-xs text-muted-foreground">{t("settings.priceCodeExample")}</p>
            <div className="space-y-2">
              {priceCodeRows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={t("settings.priceCodeDigit")}
                    value={row.digit}
                    maxLength={1}
                    className="w-20"
                    onChange={(e) => handleUpdatePriceCodeRow(index, "digit", e.target.value)}
                    disabled={isLoading}
                  />
                  <Input
                    placeholder={t("settings.priceCodeLetter")}
                    value={row.letter}
                    className="w-28"
                    onChange={(e) => handleUpdatePriceCodeRow(index, "letter", e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => savePriceCodeMap(priceCodeRows)}
                    disabled={savingPriceCode || isLoading}
                    title={t("common.save")}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeletePriceCodeRow(index)}
                    disabled={savingPriceCode || isLoading}
                    title={t("common.delete")}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={handleAddPriceCodeRow} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" /> {t("settings.addRow")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

