import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsAdmin } from "@/lib/auth";
import { fetchAPI } from "@/lib/db";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    redir: z.string().optional().catch(""),
  }),
  head: () => ({
    meta: [
      { title: "Admin login — Maa Tara Sweets" },
      { name: "description", content: "Restricted sign-in for admin and superadmin accounts at Maa Tara Sweets." },
      { property: "og:title", content: "Admin login — Maa Tara Sweets" },
      { property: "og:description", content: "Restricted access — admin and superadmin only." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Stage = "credentials" | "enroll" | "verify";

function AuthPage() {
  const { redir } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, mfaSatisfied, hasMfaEnrolled, checking, user } = useIsAdmin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>("credentials");
  const [otp, setOtp] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  // Guard so startSecondStep only fires once per login — prevents a re-render
  // loop that would cause inputs to flicker/reset while typing.
  const mfaStartedRef = useRef(false);

  const startSecondStep = useCallback(async () => {
    if (hasMfaEnrolled) {
      setStage("verify");
      return;
    }
    try {
      const { data } = await fetchAPI<any>("/auth/totp/enable", { method: "POST" });
      setQr(data.qrCode);
      setSecret(data.secret);
      setStage("enroll");
    } catch (error: any) {
      toast.error(error.message || "Failed to start enrollment");
    }
  }, [hasMfaEnrolled]);

  useEffect(() => {
    if (checking || !user) return;
    if (isAdmin && mfaSatisfied) {
      navigate({ to: redir || "/admin", replace: true });
      return;
    }
    // Only trigger MFA step once — without the ref guard this effect fires on
    // every re-render (e.g. when the user types) because stage/startSecondStep
    // are in deps, causing flicker and input resets.
    if (user && !mfaSatisfied && stage === "credentials" && !mfaStartedRef.current) {
      mfaStartedRef.current = true;
      void startSecondStep();
    }
  }, [checking, user, isAdmin, mfaSatisfied, navigate, stage, startSecondStep, redir]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await fetchAPI<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" }
      });
      if (data?.requireTotp) {
        setStage("verify");
      } else {
        await queryClient.invalidateQueries({ queryKey: ["auth_me"] });
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
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
          headers: { "Content-Type": "application/json" }
        });
        toast.success("MFA Setup complete — welcome");
      } else {
        await fetchAPI("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password, totpToken: otp.trim() }),
          headers: { "Content-Type": "application/json" }
        });
        toast.success("Verified — welcome back");
      }

      setOtp("");
      setPassword("");
      setStage("credentials");
      await queryClient.invalidateQueries({ queryKey: ["auth_me"] });
      navigate({ to: redir || "/admin", replace: true });
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
    } catch (e) {
      // ignore
    }
    setStage("credentials");
    setOtp("");
    setPassword("");
    await queryClient.invalidateQueries({ queryKey: ["auth_me"] });
    navigate({ to: "/auth", replace: true });
    toast.success("Signed out");
  }

  const codeForm = (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      {stage === "enroll" ? (
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            Set up two-step verification: scan this code with Google Authenticator (or any authenticator app),
            then enter the 6-digit code it shows.
          </p>
          {qr ? (
            <img
              src={qr}
              alt="Authenticator setup QR code for the owner account"
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
        <Label htmlFor="otp">Verification code</Label>
        <Input
          id="otp"
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
    <main className="grid min-h-[80vh] place-items-center px-4 py-12">
      <div className="glass animate-rise w-full max-w-md space-y-6 rounded-3xl p-8">
        <header className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)]">
            <ShieldCheck className="size-6 text-primary-foreground" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">Restricted access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            For admin and superadmin accounts only.
          </p>
        </header>

        {stage !== "credentials" ? (
          codeForm
        ) : user ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="text-foreground">{user.email}</span>
            </p>
            {!isAdmin && !checking ? (
              <p className="text-sm text-muted-foreground">
                This account does not have admin access. Only admin and superadmin accounts can open the dashboard.
              </p>
            ) : (
              <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
            )}
            <Button variant="glass" className="w-full rounded-full" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
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
              <Button type="submit" variant="hero" className="w-full rounded-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Sign in
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Access is restricted to admin and superadmin roles. Two-factor authentication (TOTP) is optional.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
