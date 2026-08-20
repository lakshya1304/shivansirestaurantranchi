import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { claimOwnerAccess } from "@/lib/orders.functions";
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

function AuthPage() {
  const navigate = useNavigate();
  const { isAdmin, checking, user } = useIsAdmin();
  const claim = useServerFn(claimOwnerAccess);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpStage, setOtpStage] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (!checking && isAdmin) navigate({ to: "/admin", replace: true });
  }, [checking, isAdmin, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
      } else {
        // Step 1 — verify the password, then drop the session so access needs the emailed code too.
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await supabase.auth.signOut();
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (otpError) throw otpError;
        setOtpStage(true);
        toast.success("Password verified. We emailed you a 6-digit code.");
      }
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
      const { error } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: "email" });
      if (error) throw error;
      toast.success("Verified — welcome back");
      setOtpStage(false);
      setOtp("");
      setPassword("");
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
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
  }

  async function handleClaim() {
    setBusy(true);
    try {
      const result = await claim({});
      if (result.granted) {
        toast.success("Owner access granted");
        navigate({ to: "/admin" });
      } else {
        toast.error(result.reason);
      }
    } catch {
      toast.error("Could not grant owner access");
    } finally {
      setBusy(false);
    }
  }

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

        {user ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="text-foreground">{user.email}</span>
            </p>
            {!isAdmin && !checking ? (
              <>
                <p className="text-sm text-muted-foreground">
                  This account is not an owner yet. If you are the first owner, claim access below.
                </p>
                <Button variant="hero" className="w-full rounded-full" onClick={handleClaim} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null} Claim owner access
                </Button>
              </>
            ) : (
              <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
            )}
            <Button
              variant="glass"
              className="w-full rounded-full"
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("Signed out");
              }}
            >
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
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>
              <Button type="submit" variant="hero" className="w-full rounded-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <Button variant="glass" className="w-full rounded-full" onClick={handleGoogle}>
              Continue with Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? "New owner?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-accent underline"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
