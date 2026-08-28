import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, LogIn, MessageCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsAdmin } from "@/lib/auth";
import { fetchAPI } from "@/lib/db";
import { SiteFooter } from "@/components/site-footer";
import { requestOrderHistoryCode, getOrdersByPhone } from "@/lib/orders.functions";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redir: z.string().optional().catch(""),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Maa Tara Sweets" },
      { name: "description", content: "Sign in or look up your orders via WhatsApp at Maa Tara Sweets." },
      { property: "og:title", content: "Sign in — Maa Tara Sweets" },
      { property: "og:description", content: "Access your Maa Tara Sweets account." },
    ],
  }),
  component: LoginPage,
});

type Tab = "whatsapp" | "email";
type PhoneStage = "phone" | "otp";
type EmailStage = "credentials" | "enroll" | "verify";

// Store a verified customer session in localStorage (no JWT needed)
export function saveCustomerSession(data: {
  phone: string;
  name: string;
  profileToken: string;
}) {
  const session = { ...data, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  localStorage.setItem("customer_session", JSON.stringify(session));
}

export function getCustomerSession(): {
  phone: string;
  name: string;
  profileToken: string;
  exp: number;
} | null {
  try {
    const raw = localStorage.getItem("customer_session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.exp < Date.now()) {
      localStorage.removeItem("customer_session");
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearCustomerSession() {
  localStorage.removeItem("customer_session");
}

function LoginPage() {
  const { redir } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, mfaSatisfied, hasMfaEnrolled, checking, user, role } = useIsAdmin();

  const [tab, setTab] = useState<Tab>("whatsapp");

  // ── WhatsApp tab state ──────────────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneStage, setPhoneStage] = useState<PhoneStage>("phone");
  const [phoneBusy, setPhoneBusy] = useState(false);

  // ── Email tab state ─────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [emailStage, setEmailStage] = useState<EmailStage>("credentials");
  const [otp, setOtp] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [wantTotp, setWantTotp] = useState(false);
  const mfaStartedRef = useRef(false);

  // ── Redirect if already authenticated ──────────────────────────────────────
  const startSecondStep = useCallback(async () => {
    if (hasMfaEnrolled) { setEmailStage("verify"); return; }
    if (!isAdmin && !wantTotp) return;
    try {
      const { data } = await fetchAPI<any>("/auth/totp/enable", { method: "POST" });
      setQr(data.qrCode);
      setSecret(data.secret);
      setEmailStage("enroll");
    } catch (error: any) {
      toast.error(error.message || "Failed to start enrollment");
    }
  }, [hasMfaEnrolled, isAdmin, wantTotp]);

  useEffect(() => {
    if (checking || !user) return;
    if (isAdmin && mfaSatisfied) {
      navigate({ to: redir || "/admin", replace: true });
      return;
    }
    if (user && role === "USER" && emailStage === "credentials") {
      navigate({ to: redir || "/my-orders", replace: true });
      return;
    }
    if (user && isAdmin && !mfaSatisfied && emailStage === "credentials" && !mfaStartedRef.current) {
      mfaStartedRef.current = true;
      void startSecondStep();
    }
  }, [checking, user, isAdmin, mfaSatisfied, navigate, emailStage, startSecondStep, redir, role]);

  // ── WhatsApp OTP handlers ───────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setPhoneBusy(true);
    try {
      const res = await requestOrderHistoryCode({ phone: phone.trim() });
      setPhoneStage("otp");
      toast.success(
        res?.delivered
          ? "A 6-digit code has been sent to your WhatsApp."
          : "If that number is on WhatsApp, a code is on its way.",
      );
    } catch {
      toast.error("Enter a valid phone number (e.g. 98765 43210).");
    } finally {
      setPhoneBusy(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setPhoneBusy(true);
    try {
      const result = await getOrdersByPhone({ phone: phone.trim(), code: otpCode.trim() });
      if (!result) {
        toast.error("No profile found. Place an order first to create your account.");
        return;
      }
      const { customer, profileToken } = result as any;
      saveCustomerSession({
        phone: phone.trim(),
        name: customer.name ?? phone.trim(),
        profileToken,
      });
      toast.success(`Welcome back, ${customer.name ?? ""}!`);
      navigate({ to: redir || "/profile", replace: true });
    } catch (error: any) {
      toast.error(error.message || "That code is invalid or expired. Try again.");
    } finally {
      setPhoneBusy(false);
    }
  }

  // ── Email/Password handlers ─────────────────────────────────────────────────
  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await fetchAPI<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });
      if (data?.requireTotp) {
        setEmailStage("verify");
      } else {
        await queryClient.invalidateQueries({ queryKey: ["auth_me"] });
      }
    } catch (error: any) {
      toast.error(error.message || "Sign in failed. Check your email and password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyEmailOtp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (emailStage === "enroll") {
        await fetchAPI("/auth/totp/verify", {
          method: "POST",
          body: JSON.stringify({ token: otp.trim() }),
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Two-factor set up — you're all set!");
      } else {
        await fetchAPI("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password, totpToken: otp.trim() }),
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Verified — welcome back!");
      }
      setOtp("");
      setPassword("");
      setEmailStage("credentials");
      await queryClient.invalidateQueries({ queryKey: ["auth_me"] });
      navigate({ to: isAdmin ? (redir || "/admin") : (redir || "/my-orders"), replace: true });
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    try { await fetchAPI("/auth/logout", { method: "POST" }); } catch { /* ignore */ }
    setEmailStage("credentials");
    setOtp("");
    setPassword("");
    await queryClient.invalidateQueries({ queryKey: ["auth_me"] });
    navigate({ to: "/login", replace: true });
    toast.success("Signed out");
  }

  // ── TOTP form (email tab) ───────────────────────────────────────────────────
  const totpForm = (
    <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
      {emailStage === "enroll" ? (
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            Scan this QR code with any authenticator app, then enter the 6-digit code.
          </p>
          {qr ? <img src={qr} alt="Authenticator setup QR code" className="mx-auto size-44 rounded-2xl bg-background p-2" /> : null}
          {secret ? <p className="break-all font-mono text-xs text-muted-foreground">Manual key: {secret}</p> : null}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app.
        </p>
      )}
      <div>
        <Label htmlFor="otp-login">Verification code</Label>
        <Input
          id="otp-login"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          required
        />
      </div>
      <Button type="submit" variant="hero" className="w-full rounded-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} Verify &amp; continue
      </Button>
      <Button type="button" variant="glass" className="w-full rounded-full" onClick={handleSignOut}>
        Cancel
      </Button>
    </form>
  );

  return (
    <main className="min-h-[80vh] px-4 py-12">
      <div className="mx-auto max-w-md space-y-8">
        <div className="glass animate-rise rounded-3xl p-8 space-y-6">
          {/* Header */}
          <header className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)]">
              <LogIn className="size-6 text-primary-foreground" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold">My Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View your orders, loyalty points and profile.
            </p>
          </header>

          {/* Tab switcher */}
          <div className="flex gap-1 rounded-2xl bg-background/40 p-1">
            <button
              type="button"
              id="tab-whatsapp"
              onClick={() => setTab("whatsapp")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors ${
                tab === "whatsapp"
                  ? "bg-[image:var(--gradient-primary)] text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </button>
            <button
              type="button"
              id="tab-email"
              onClick={() => setTab("email")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors ${
                tab === "email"
                  ? "bg-[image:var(--gradient-primary)] text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="size-4" />
              Email
            </button>
          </div>

          {/* ── WhatsApp OTP tab ─────────────────────────────────────────── */}
          {tab === "whatsapp" && (
            <div className="space-y-4">
              {phoneStage === "phone" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
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
                  <Button type="submit" variant="hero" className="w-full rounded-full" disabled={phoneBusy}>
                    {phoneBusy ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
                    Send WhatsApp code
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    We'll send a 6-digit code to your WhatsApp. No password needed.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      required
                      autoFocus
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full rounded-full" disabled={phoneBusy}>
                    {phoneBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                    Verify &amp; view my profile
                  </Button>
                  <Button
                    type="button"
                    variant="glass"
                    className="w-full rounded-full"
                    onClick={() => { setPhoneStage("phone"); setOtpCode(""); }}
                  >
                    Use a different number
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* ── Email tab ────────────────────────────────────────────────── */}
          {tab === "email" && (
            <div className="space-y-4">
              {emailStage !== "credentials" ? (
                totpForm
              ) : user ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Signed in as <span className="text-foreground">{user.email}</span>
                  </p>
                  {checking ? <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /> : null}
                  <Button variant="glass" className="w-full rounded-full" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={6}
                          required
                          autoComplete="current-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute inset-y-0 right-0 flex h-full items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Optional TOTP enroll for regular users */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-border accent-primary"
                        checked={wantTotp}
                        onChange={(e) => setWantTotp(e.target.checked)}
                      />
                      <span className="text-sm text-muted-foreground">
                        Set up two-factor authentication (optional)
                      </span>
                    </label>

                    <Button type="submit" variant="hero" className="w-full rounded-full" disabled={busy}>
                      {busy ? <Loader2 className="size-4 animate-spin" /> : null} Sign in
                    </Button>
                  </form>
                  <p className="text-center text-xs text-muted-foreground">
                    For staff and admin accounts. Two-factor is required for admins.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
