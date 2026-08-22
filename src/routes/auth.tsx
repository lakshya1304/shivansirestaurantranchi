import { useCallback, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useIsAdmin } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Owner login — Shivansi Restaurant & Sweet Shop" },
      { name: "description", content: "Sign in to manage menu, orders, inventory and reports at Shivansi." },
      { property: "og:title", content: "Owner login — Shivansi" },
      { property: "og:description", content: "Sign in to the Shivansi owner dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Stage = "credentials" | "enroll" | "verify";

function AuthPage() {
  const navigate = useNavigate();
  const { isAdmin, checking, user } = useIsAdmin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>("credentials");
  const [otp, setOtp] = useState("");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");

  /** Decides whether this session still owes a 6-digit authenticator code. */
  const startSecondStep = useCallback(async () => {
    const { data: factors, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    const verified = factors.totp.find((f) => f.status === "verified");
    if (verified) {
      setFactorId(verified.id);
      setQr("");
      setSecret("");
      setStage("verify");
      return;
    }
    // Clean up half-finished enrolments so a retry never hits "factor already exists".
    for (const stale of factors.totp.filter((f) => f.status !== "verified")) {
      await supabase.auth.mfa.unenroll({ factorId: stale.id });
    }
    const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Owner ${Date.now()}`,
    });
    if (enrollError) throw enrollError;
    setFactorId(enrolled.id);
    setQr(enrolled.totp.qr_code);
    setSecret(enrolled.totp.secret);
    setStage("enroll");
  }, []);

  useEffect(() => {
    if (checking || !user) return;
    let active = true;
    void supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      if (!active || !data) return;
      if (data.currentLevel === "aal2") {
        if (isAdmin) navigate({ to: "/admin", replace: true });
        return;
      }
      if (stage === "credentials") void startSecondStep().catch(() => undefined);
    });
    return () => {
      active = false;
    };
  }, [checking, user, isAdmin, navigate, stage, startSecondStep]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await startSecondStep();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: otp.trim(),
      });
      if (error) throw error;
      toast.success("Verified — welcome back");
      setOtp("");
      setPassword("");
      setStage("credentials");
      navigate({ to: "/admin", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) toast.error("Google sign-in failed");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setStage("credentials");
    setOtp("");
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
          <h1 className="mt-4 font-display text-2xl font-bold">Owner access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage menu, orders, inventory, offers and reports.
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
                This account does not have owner access. Only the single registered owner account can open the
                dashboard.
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
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" variant="hero" className="w-full rounded-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Sign in
              </Button>
            </form>

            <Button variant="glass" className="w-full rounded-full" onClick={handleGoogle}>
              Continue with Google
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              This dashboard is limited to one owner account. New sign-ups are disabled.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
