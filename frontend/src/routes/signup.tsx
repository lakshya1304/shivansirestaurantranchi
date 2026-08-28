import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL, fetchAPI } from "@/lib/db";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/signup")({
  validateSearch: z.object({
    redir: z.string().optional().catch(""),
  }),
  head: () => ({
    meta: [
      { title: "Sign up — Maa Tara Sweets" },
      { name: "description", content: "Create a new account at Maa Tara Sweets." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { redir } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await fetchAPI<any>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password,
          name: name.trim()
        }),
        headers: { "Content-Type": "application/json" },
      });
      
      toast.success("Account created! Please log in.");
      navigate({ to: "/login", search: { redir }, replace: true });
    } catch (error: any) {
      toast.error(error?.message ?? "Registration failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleGoogleOAuth() {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  }

  return (
    <main className="min-h-[80vh] px-4 py-12">
      <div className="mx-auto max-w-md space-y-8">
        <div className="glass animate-rise rounded-3xl p-8 space-y-6">
          {/* Header */}
          <header className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)]">
              <UserPlus className="size-6 text-primary-foreground" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold">Create an Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign up to track your orders and earn loyalty points.
            </p>
          </header>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full flex items-center justify-center gap-2"
              onClick={handleGoogleOAuth}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                    placeholder="Create a password"
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
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Sign up
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/login" search={{ redir }} className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
