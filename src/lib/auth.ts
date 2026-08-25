import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useIsAdmin() {
  const { user, loading } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mfaSatisfied, setMfaSatisfied] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsAdmin(false);
      setMfaSatisfied(false);
      setChecking(loading);
      return;
    }
    setChecking(true);
    void (async () => {
      const [{ data: roleRow }, { data: aal }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (!active) return;
      setIsAdmin(Boolean(roleRow));
      // Owner dashboard requires the authenticator step to be completed this session.
      setMfaSatisfied(aal?.currentLevel === "aal2");
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [user, loading]);

  return { isAdmin, mfaSatisfied, checking: checking || loading, user };
}

