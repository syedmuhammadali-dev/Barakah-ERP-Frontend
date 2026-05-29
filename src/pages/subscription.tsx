import { useState } from "react";
import { useGetSubscriptionStatus } from "@barakah/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "jazzcash", label: "JazzCash", color: "bg-red-500/10 border-red-500/30 text-red-400", activeColor: "border-red-500 bg-red-500/20" },
  { id: "easypaisa", label: "EasyPaisa", color: "bg-green-500/10 border-green-500/30 text-green-400", activeColor: "border-green-500 bg-green-500/20" },
  { id: "bank_transfer", label: "HBL Bank Transfer", color: "bg-blue-500/10 border-blue-500/30 text-blue-400", activeColor: "border-blue-500 bg-blue-500/20" },
  { id: "meezan_bank", label: "Meezan Bank", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", activeColor: "border-emerald-500 bg-emerald-500/20" },
];

export function Subscription() {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [txRef, setTxRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ message: string; paymentInstructions: string } | null>(null);

  const { data: status, isLoading } = useGetSubscriptionStatus();

  const handleSubmit = async () => {
    if (!selectedMethod) { toast.error("Please select a payment method"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subscription/request-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ method: selectedMethod, transactionRef: txRef || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPaymentResult(data);
      toast.success("Payment request submitted!");
    } catch {
      toast.error("Failed to submit payment request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (s: string) => {
    if (s === "trial") return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 border">Free Trial</Badge>;
    if (s === "active") return <Badge className="bg-green-500/10 text-green-400 border-green-500/30 border">Active</Badge>;
    return <Badge variant="destructive">Expired</Badge>;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your Barakah ERP subscription</p>
      </div>

      {/* Current Plan */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Current Plan</h2>
            <p className="text-muted-foreground text-sm">Barakah ERP — All Features</p>
          </div>
          {!isLoading && status && getStatusBadge(status.status)}
        </div>

        {isLoading ? (
          <div className="h-20 animate-pulse bg-muted rounded-lg" />
        ) : status ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-muted/40 rounded-xl p-4 border border-border text-center">
              <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-primary">{status.daysRemaining}</p>
              <p className="text-sm text-muted-foreground">Days Remaining</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4 border border-border text-center">
              <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold">{new Date(status.trialStartAt).toLocaleDateString("en-PK")}</p>
              <p className="text-xs text-muted-foreground">Trial Started</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4 border border-border text-center">
              <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold">{new Date(status.trialEndAt).toLocaleDateString("en-PK")}</p>
              <p className="text-xs text-muted-foreground">Trial Ends</p>
            </div>
          </div>
        ) : null}

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">Monthly Plan</p>
            <p className="text-sm text-muted-foreground">Unlimited inventory, sales, Zakat, reports</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{status ? `${status.planCurrency} ${status.planPrice.toLocaleString()}` : "PKR 10,000"}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      {!paymentResult ? (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Renew Your Subscription</h2>
            <p className="text-muted-foreground text-sm mt-1">Select your preferred payment method and submit a request</p>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                  className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all ${selectedMethod === m.id ? m.activeColor : `${m.color} hover:opacity-80`}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="txref">Transaction Reference <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="txref" placeholder="Enter your transaction ID after payment" value={txRef} onChange={e => setTxRef(e.target.value)} className="h-11" />
            <p className="text-xs text-muted-foreground">You can submit your reference after making the payment</p>
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedMethod} className="w-full h-12 text-base" size="lg">
            {isSubmitting ? "Submitting..." : "Submit Payment Request"}
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Payment Request Submitted!</h2>
              <p className="text-muted-foreground text-sm">{paymentResult.message}</p>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="w-4 h-4 text-primary" />
              Payment Instructions
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{paymentResult.paymentInstructions}</p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-center text-muted-foreground">
            Your account will be activated within <span className="font-semibold text-foreground">24 hours</span> after payment verification
          </div>

          <Button variant="outline" className="w-full" onClick={() => setPaymentResult(null)}>
            Submit Another Request
          </Button>
        </div>
      )}
    </div>
  );
}

