import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { amrFromAccessToken, isFreshInviteSession } from "./invite";

export type AppRole = "admin" | "manager";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  roles: AppRole[];
  isStaff: boolean;
  profile: { full_name: string; email: string; avatar_url: string | null } | null;
};

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  roles: [],
  isStaff: false,
  profile: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Someone who just clicked a staff invite must first choose their password.
    const routeInvite = (next: Session | null) => {
      if (!next || window.location.pathname === "/set-password") return;
      if (isFreshInviteSession(amrFromAccessToken(next.access_token), Date.now() / 1000)) {
        void router.navigate({ to: "/set-password", replace: true });
      }
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") routeInvite(next);
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  const userId = session?.user.id;
  const { data: meta, isPending: metaPending } = useQuery({
    queryKey: ["me", userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async () => {
      if (!userId) return { roles: [] as AppRole[], profile: null };
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", userId)
          .maybeSingle(),
      ]);
      return { roles: (roles ?? []).map((r) => r.role as AppRole), profile: profile ?? null };
    },
  });

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading: loading || (Boolean(userId) && metaPending),
      roles: meta?.roles ?? [],
      isStaff: (meta?.roles ?? []).length > 0,
      profile: meta?.profile ?? null,
    }),
    [session, loading, meta, metaPending, userId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };
}

export function displayName(profile: AuthState["profile"], user: User | null) {
  return (
    profile?.full_name?.trim() ||
    (user?.user_metadata?.["full_name"] as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Member"
  );
}
