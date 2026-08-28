import { useState } from "react";
import { Loader2, MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { requestOrderHistoryCode, getOrdersByPhone } from "@/lib/orders.functions";

interface WhatsAppLoginFormProps {
  /** Called after OTP is verified successfully */
  onSuccess: (result: { customer: any; profileToken: string; phone: string }) => void;
  /** Show a "Sign in via My Account →" hint link (default: false) */
  showLoginHint?: boolean;
  /** Label for the submit / verify button */
  submitLabel?: string;
}

type Stage = "phone" | "otp";

/**
 * Reusable WhatsApp OTP verification form.
 * Used on both /login (WhatsApp tab) and /my-orders (unauthenticated fallback).
 */
export function WhatsAppLoginForm({
  onSuccess,
  showLoginHint = false,
  submitLabel,
}: WhatsAppLoginFormProps) {
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await requestOrderHistoryCode({ phone: phone.trim() });
      setStage("otp");
      toast.success(
        res?.delivered
          ? "A 6-digit code has been sent to your WhatsApp."
          : "If that number is on WhatsApp, a code is on its way.",
      );
    } catch {
      toast.error("Enter a valid phone number (e.g. 98765 43210).");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await getOrdersByPhone({ phone: phone.trim(), code: code.trim() });
      if (!result) {
        toast.error("No profile found. Place an order first to create your account.");
        return;
      }
      onSuccess({
        customer: (result as any).customer,
        profileToken: (result as any).profileToken,
        phone: phone.trim(),
      });
    } catch (error: any) {
      toast.error(error.message || "That code is invalid or expired. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "phone") {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <Label htmlFor="wa-phone">WhatsApp phone number</Label>
          <Input
            id="wa-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            maxLength={16}
            autoComplete="tel"
            required
          />
        </div>
        <Button type="submit" variant="hero" className="w-full rounded-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
          Send WhatsApp code
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          We'll send a 6-digit code to your WhatsApp. No password needed.
        </p>
        {showLoginHint && (
          <p className="text-center text-xs text-muted-foreground">
            Already signed in?{" "}
            <Link to="/login" className="text-accent hover:underline">
              Go to My Account →
            </Link>
          </p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Enter the 6-digit code sent to{" "}
        <span className="font-medium text-foreground">{phone}</span> on WhatsApp.
      </p>
      <div>
        <Label htmlFor="wa-otp">6-digit code</Label>
        <Input
          id="wa-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          autoFocus
        />
      </div>
      <Button type="submit" variant="hero" className="w-full rounded-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitLabel ?? "Verify & continue"}
      </Button>
      <Button
        type="button"
        variant="glass"
        className="w-full rounded-full"
        onClick={() => { setStage("phone"); setCode(""); }}
      >
        Use a different number
      </Button>
    </form>
  );
}
