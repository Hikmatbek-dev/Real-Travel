import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * Admin authentication backed by Supabase Auth.
 *
 * `session` drives the admin gate; `signIn` / `signOut` wrap the Supabase
 * email + password flow. The session is persisted by the Supabase client,
 * so an admin stays logged in across reloads until they sign out.
 */
export function useAdminAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const user = session?.user ?? null;
  const displayName =
    (user?.user_metadata?.name as string | undefined) || user?.email || "Admin";

  return { session, user, displayName, loading, signIn, signOut };
}
