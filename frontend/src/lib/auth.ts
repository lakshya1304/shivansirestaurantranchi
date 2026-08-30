import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "./db";

export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  isActive: boolean;
  [key: string]: any;
};

type SessionDetails = {
  user: SessionUser;
  isAdmin: boolean;
  mfaSatisfied: boolean;
  hasMfaEnrolled: boolean;
  passkeyCount?: number;
};

export function useSession() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth_me"],
    queryFn: () => fetchAPI<SessionDetails>("/auth/me"),
    retry: false,
    // Only refetch on window focus if the data is older than 30 s — avoids
    // mid-typing re-renders that cause input flicker on the auth page.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const actualData = (data as any)?.data || data;

  return {
    session: actualData as SessionDetails | undefined,
    user: (actualData?.user ?? null) as SessionUser | null,
    loading: isLoading,
  };
}

export function useIsAdmin() {
  const { session, user, loading } = useSession();

  const role = (user?.role ?? null) as UserRole | null;

  return {
    isAdmin: session?.isAdmin ?? false,
    isSuperAdmin: role === "SUPERADMIN",
    role,
    mfaSatisfied: session?.mfaSatisfied ?? false,
    hasMfaEnrolled: session?.hasMfaEnrolled ?? false,
    passkeyCount: session?.passkeyCount ?? 0,
    checking: loading,
    user,
  };
}
