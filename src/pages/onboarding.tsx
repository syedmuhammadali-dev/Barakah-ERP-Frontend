import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompleteOnboarding } from "@barakah/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Check, ChevronRight, Wrench, Shirt, Hammer, Smartphone, ShoppingCart, Pill, Package, Building2, Sparkles, Clock, BarChart3, Calculator } from "lucide-react";
import { useRouter } from "next/router";

const BUSINESS_TYPES = [
  { id: "spare_parts", label: "Bike Spare Parts", icon: Wrench },
  { id: "garments", label: "Garments & Textiles", icon: Shirt },
  { id: "hardware", label: "Hardware & Tools", icon: Hammer },
  { id: "electronics", label: "Electronics", icon: Smartphone },
  { id: "grocery", label: "Grocery / Food", icon: ShoppingCart },
  { id: "pharmacy", label: "Pharmacy / Medical", icon: Pill },
  { id: "wholesale", label: "Wholesale", icon: Package },
  { id: "custom", label: "Custom Business", icon: Building2 },
];

const CURRENCIES = ["PKR", "SAR", "AED", "USD"];

const STEPS = [
  { id: 1, label: "Business Info" },
  { id: 2, label: "Settings" },
  { id: 3, label: "Start Trial" },
];

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    customBusinessType: "",
    phone: "",
    city: "",
    country: "Pakistan",
    baseCurrency: "PKR",
    vatRate: 0,
    islamicModeEnabled: true,
    timezone: "(GMT+05:00) Karachi",
  });

  const completeOnboarding = useCompleteOnboarding({
    mutation: {
    onSuccess: () => {
        router.replace("/dashboard");
      },
      onError: () => {
        toast.error("Failed to complete onboarding. Please try again.");
      },
    },
  });

  const handleNext = () => {
    if (step === 1) {
      if (!form.businessName.trim()) { toast.error("Please enter your business name"); return; }
      if (!form.businessType) { toast.error("Please select a business type"); return; }
    }
    if (step < 3) setStep(s => s + 1);
  };

  const handleSubmit = () => {
    const businessType = form.businessType === "custom" ? form.customBusinessType : form.businessType;
    completeOnboarding.mutate({
      data: {
        businessName: form.businessName,
        businessType,
        phone: form.phone || undefined,
        city: form.city || undefined,
        country: form.country,
        baseCurrency: form.baseCurrency,
        timezone: form.timezone,
        vatRate: form.vatRate,
        islamicModeEnabled: form.islamicModeEnabled,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/30">B</div>
          <span className="text-2xl font-bold tracking-tight">Barakah ERP</span>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step > s.id ? "bg-primary text-primary-foreground" :
                step === s.id ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-muted text-muted-foreground"
              }`}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step === s.id ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }} className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Tell us about your business</h2>
                  <p className="text-muted-foreground mt-1">Set up your business profile to get started</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bizname">Business Name *</Label>
                  <Input id="bizname" placeholder="e.g. Ahmed Spare Parts" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label>Business Type *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {BUSINESS_TYPES.map(({ id, label, icon: Icon }) => (
                      <button key={id} onClick={() => setForm(f => ({ ...f, businessType: id }))}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                          form.businessType === id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                        }`}>
                        <Icon className="w-6 h-6" />
                        <span className="text-center leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                  {form.businessType === "custom" && (
                    <Input placeholder="Enter your business type" value={form.customBusinessType} onChange={e => setForm(f => ({ ...f, customBusinessType: e.target.value }))} className="mt-2 h-11" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="0300-1234567" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="Karachi" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input placeholder="Pakistan" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="h-11" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }} className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Configure your settings</h2>
                  <p className="text-muted-foreground mt-1">These can be changed later in Settings</p>
                </div>

                <div className="space-y-2">
                  <Label>Base Currency</Label>
                  <div className="flex gap-3 flex-wrap">
                    {CURRENCIES.map(c => (
                      <button key={c} onClick={() => setForm(f => ({ ...f, baseCurrency: c }))}
                        className={`px-5 py-2.5 rounded-lg border-2 font-semibold transition-all ${form.baseCurrency === c ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vat">VAT / Tax Rate (%)</Label>
                  <Input id="vat" type="number" min="0" max="30" step="0.5" placeholder="0" value={form.vatRate} onChange={e => setForm(f => ({ ...f, vatRate: parseFloat(e.target.value) || 0 }))} className="h-11 max-w-xs" />
                  <p className="text-xs text-muted-foreground">Standard rate in Pakistan is 0% for most small retailers</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                  <div>
                    <p className="font-semibold">Islamic Business Mode</p>
                    <p className="text-sm text-muted-foreground">Enables Zakat calculation, Sharia compliance tracking, and Amanat management</p>
                  </div>
                  <Switch checked={form.islamicModeEnabled} onCheckedChange={v => setForm(f => ({ ...f, islamicModeEnabled: v }))} />
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                    className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm">
                    <option>(GMT+05:00) Karachi</option>
                    <option>(GMT+05:30) Kolkata</option>
                    <option>(GMT+03:00) Riyadh</option>
                    <option>(GMT+04:00) Dubai</option>
                    <option>(GMT+00:00) UTC</option>
                  </select>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }} className="p-8 space-y-6 text-center">
                <div className="flex justify-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                    className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/30 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </motion.div>
                </div>

                <div>
                  <h2 className="text-3xl font-bold">Your 30-day free trial starts now!</h2>
                  <p className="text-muted-foreground mt-2 text-lg">Welcome to <span className="text-primary font-semibold">{form.businessName}</span> on Barakah ERP</p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-left">
                  {[
                    { icon: Package, title: "Inventory", desc: "Track stock, SKUs & barcodes" },
                    { icon: ShoppingCart, title: "Sales", desc: "Invoice & ledger management" },
                    { icon: Calculator, title: "Zakat", desc: "Auto Sharia compliance" },
                    { icon: Building2, title: "Suppliers", desc: "Returns & balance ledger" },
                    { icon: BarChart3, title: "Reports", desc: "Revenue & growth charts" },
                    { icon: Clock, title: "Salesmen", desc: "Targets & commissions" },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="p-3 bg-muted/40 rounded-xl border border-border">
                      <Icon className="w-5 h-5 text-primary mb-2" />
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">After your 30-day free trial</p>
                  <p className="text-2xl font-bold text-primary mt-1">PKR 10,000 <span className="text-base font-normal text-muted-foreground">/ month</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Cancel anytime. No credit card required for trial.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="px-8 pb-8 flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>
            ) : <div />}
            {step < 3 ? (
              <Button onClick={handleNext} className="px-8">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={completeOnboarding.isPending} className="px-8 bg-primary hover:bg-primary/90">
                {completeOnboarding.isPending ? "Setting up..." : "Start Using Barakah ERP"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

