import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export const authEnabled = !!supabase;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(authEnabled);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const apply = async (session: Session | null) => {
      const u = session?.user;
      if (!u) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const meta = u.user_metadata || {};
      setUser({
        id: u.id,
        name: meta.full_name || meta.name || u.email || "User",
        email: u.email || "",
        avatar: meta.avatar_url || meta.picture,
      });
      const { data } = await client.rpc("is_admin");
      setIsAdmin(data === true);
      setLoading(false);
    };
    client.auth.getSession().then(({ data }) => void apply(data.session));
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      // jangan await panggilan supabase langsung di dalam callback ini
      setTimeout(() => void apply(session), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async (path?: string) => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + (path ?? window.location.pathname),
        queryParams: { prompt: "select_account" },
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  return { user, isAdmin, loading, signInWithGoogle, signOut };
}
