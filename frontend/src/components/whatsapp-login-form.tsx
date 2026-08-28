import { useState } from "react";
import { Loader2, MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { requestOrderHistoryCode, getOrdersByPhone } from "@/lib/orders.functions";
import { API_BASE_URL } from "@/lib/db";

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
    const cleanPhone = phone.trim();
    if (!/^(?:\+?91[\-\s]?)?[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error("Enter a valid 10-digit Indian phone number.");
      return;
    }

    setBusy(true);
    try {
      const res = await requestOrderHistoryCode({ phone: cleanPhone });
      setStage("otp");
      toast.success(
        res?.delivered
          ? "A 6-digit code has been sent to your WhatsApp."
          : "If that number is on WhatsApp, a code is on its way.",
      );
    } catch (error: any) {
      toast.error(error?.message ?? error?.toString() ?? "Failed to send code. Please try again.");
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
      toast.error(error?.message ?? error?.toString() ?? "That code is invalid or expired. Try again.");
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full flex items-center justify-center gap-2"
          onClick={() => window.location.href = `${API_BASE_URL}/auth/google/login`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
          Log in with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
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
