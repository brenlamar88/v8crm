/* ----------------------------------------------------------------------------
   Auth — Supabase email/password sessions. When Supabase isn't configured this
   provider reports `enabled: false` and the app runs open (local demo, no
   sign-in). When it is, it tracks the session and gates the app behind a login.
   -------------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseEnabled, fetchProfile, upsertProfile, type Profile } from "../lib/supabase.ts";

interface AuthValue {
  enabled: boolean;
  user: User | null;
  loading: boolean;
  recovery: boolean;
  profile: Profile | null;
  saveProfile: (profile: Profile) => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // True after arriving from a password-reset email; the app then asks for a new
  // password instead of showing the console.
  const [recovery, setRecovery] = useState(false);
  // Only "loading" while we have a Supabase client to ask about the session.
  const [loading, setLoading] = useState(isSupabaseEnabled);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    // Keep the user reference STABLE across auth events. Supabase re-emits
    // onAuthStateChange (token refresh, re-validation) with a fresh user object
    // that carries the same id; swapping the reference each time would re-run
    // every `[user]` effect (profile + workspace load), and their state updates
    // re-trigger the cascade — an infinite refetch loop. Only replace state when
    // the identity actually changes.
    const applyUser = (next: User | null) =>
      setUser((prev) => (prev?.id === next?.id ? prev : next));

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      applyUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      applyUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load the profile when the signed-in user changes. Missing → a default
  // seeded from the email local-part, so Settings has something to edit.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let active = true;
    fetchProfile(user.id).then((p) => {
      if (!active) return;
      setProfile(p ?? { name: user.email?.split("@")[0] ?? "", role: "", workspace: "", avatarUrl: "" });
    });
    return () => {
      active = false;
    };
  }, [user]);

  const saveProfile = useCallback(
    async (next: Profile) => {
      if (!user) return;
      setProfile(next);
      await upsertProfile(user.id, next);
    },
    [user],
  );

  const signIn = async (email: string, password: string) => {
    if (!supabase) return null;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) return null;
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  };

  const resetPassword = async (email: string) => {
    if (!supabase) return null;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return error?.message ?? null;
  };

  const updatePassword = async (password: string) => {
    if (!supabase) return null;
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setRecovery(false);
    return error?.message ?? null;
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setRecovery(false);
  };

  return (
    <AuthContext.Provider
      value={{ enabled: isSupabaseEnabled, user, loading, recovery, profile, saveProfile, signIn, signUp, resetPassword, updatePassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
