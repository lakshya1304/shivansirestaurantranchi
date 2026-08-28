import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, LogIn, MessageCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsAdmin } from "@/lib/auth";
import { API_BASE_URL, fetchAPI } from "@/lib/db";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppLoginForm } from "@/components/whatsapp-login-form";

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
      toast.error(error?.message ?? error?.toString() ?? "Failed to start enrollment");
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

  // ── WhatsApp OTP success handler ────────────────────────────────────────────
  function handleWhatsAppSuccess({ customer, profileToken, phone }: { customer: any; profileToken: string; phone: string }) {
    saveCustomerSession({
      phone,
      name: customer.name ?? phone,
      profileToken,
    });
    toast.success(`Welcome back, ${customer.name ?? ""}!`);
    navigate({ to: redir || "/my-orders", replace: true });
  }

  // ── Email/Password handlers ─────────────────────────────────────────────────
  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetchAPI<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        headers: { "Content-Type": "application/json" },
      });
      const payload = res?.data ?? res;
      if (payload?.requireTotp) {
        setEmailStage("verify");
      } else {
        await queryClient.invalidateQueries({ queryKey: ["auth_me"] });
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Sign in failed. Check your email and password.");
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
      toast.error(error?.message ?? error?.toString() ?? "Invalid or expired code");
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
            <WhatsAppLoginForm onSuccess={handleWhatsAppSuccess} />
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
                      <Link to="/signup" search={{ redir }} className="text-primary hover:underline font-medium">
                        Sign up
                      </Link>
                    </p>

                    <div className="relative mt-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

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
                  </form>
                  <p className="text-center text-xs text-muted-foreground mt-2">
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
