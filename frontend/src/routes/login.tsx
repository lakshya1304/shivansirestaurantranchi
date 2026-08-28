import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsAdmin } from "@/lib/auth";
import { fetchAPI } from "@/lib/db";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redir: z.string().optional().catch(""),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Maa Tara Sweets" },
      { name: "description", content: "Sign in to view your orders, loyalty points and more at Maa Tara Sweets." },
      { property: "og:title", content: "Sign in — Maa Tara Sweets" },
      { property: "og:description", content: "Access your Maa Tara Sweets account." },
    ],
  }),
  component: LoginPage,
});

type Stage = "credentials" | "enroll" | "verify";

function LoginPage() {
  const { redir } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, mfaSatisfied, hasMfaEnrolled, checking, user, role } = useIsAdmin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>("credentials");
  const [otp, setOtp] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [wantTotp, setWantTotp] = useState(false);
  const mfaStartedRef = useRef(false);

  const startSecondStep = useCallback(async () => {
    if (hasMfaEnrolled) {
      setStage("verify");
      return;
    }
    // For non-admin users, only start TOTP enroll if they opted in
    if (!isAdmin && !wantTotp) return;
    try {
      const { data } = await fetchAPI<any>("/auth/totp/enable", { method: "POST" });
      setQr(data.qrCode);
      setSecret(data.secret);
      setStage("enroll");
    } catch (error: any) {
      toast.error(error.message || "Failed to start enrollment");
    }
  }, [hasMfaEnrolled, isAdmin, wantTotp]);

  useEffect(() => {
    if (checking || !user) return;
    // If admin + MFA satisfied → admin panel
    if (isAdmin && mfaSatisfied) {
      navigate({ to: redir || "/admin", replace: true });
      return;
    }
    // If regular user, no MFA required → redirect to redir or home
    if (user && role === "USER" && stage === "credentials") {
      navigate({ to: redir || "/", replace: true });
      return;
    }
    // Admin needs MFA step
    if (user && isAdmin && !mfaSatisfied && stage === "credentials" && !mfaStartedRef.current) {
      mfaStartedRef.current = true;
      void startSecondStep();
    }
  }, [checking, user, isAdmin, mfaSatisfied, navigate, stage, startSecondStep, redir, role]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await fetchAPI<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });
      if (data?.requireTotp) {
        setStage("verify");
      } else {
        await queryClient.invalidateQueries({ queryKey: ["auth_me"] });
      }
    } catch (error: any) {
      toast.error(error.message || "Sign in failed. Check your email and password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (stage === "enroll") {
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
      setStage("credentials");
      await queryClient.invalidateQueries({ queryKey: ["auth_me"] });
      navigate({ to: isAdmin ? (redir || "/admin") : (redir || "/"), replace: true });
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    try {
      await fetchAPI("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setStage("credentials");
    setOtp("");
    setPassword("");
    await queryClient.invalidateQueries({ queryKey: ["auth_me"] });
    navigate({ to: "/login", replace: true });
    toast.success("Signed out");
  }

  const codeForm = (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      {stage === "enroll" ? (
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            Scan this QR code with any authenticator app (Google Authenticator, Authy, etc.),
            then enter the 6-digit code it shows.
          </p>
          {qr ? (
            <img
              src={qr}
              alt="Authenticator setup QR code"
              className="mx-auto size-44 rounded-2xl bg-background p-2"
            />
          ) : null}
          {secret ? (
            <p className="break-all font-mono text-xs text-muted-foreground">Manual key: {secret}</p>
          ) : null}
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
        {/* Header */}
        <div className="glass animate-rise rounded-3xl p-8 space-y-6">
          <header className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)]">
              <LogIn className="size-6 text-primary-foreground" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to view your orders, loyalty points and more.
            </p>
          </header>

          {stage !== "credentials" ? (
            codeForm
          ) : user ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="text-foreground">{user.email}</span>
              </p>
              {checking ? (
                <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
              ) : null}
              <Button variant="glass" className="w-full rounded-full" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                Two-factor authentication is optional for regular accounts. Admins require it.
              </p>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
