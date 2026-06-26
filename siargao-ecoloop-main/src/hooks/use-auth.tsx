import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "farmer" | "restaurant" | "resident" | "lgu_admin";

export type Profile = {
  id: string;
  full_name: string;
  barangay: string;
  address: string;
  phone: string;
  primary_role: AppRole;
  lgu_approved: boolean;
  profile_picture_url: string | null;
};

type AuthCtx = {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isLguAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (u: User | null) => {
    if (!u) {
      setProfile(null);
      setRoles([]);
      return;
    }

    try {
      const [{ data: prof }, { data: rs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.id),
      ]);
      setProfile((prof as Profile) ?? null);
      setRoles(((rs as { role: AppRole }[]) ?? []).map((r) => r.role));
    } catch (error) {
      console.warn("[Auth] Unable to load profile data; continuing in offline mode.", error);
      setProfile(null);
      setRoles([]);
    }
  };

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setTimeout(() => void load(session?.user ?? null), 0);
    });

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setUser(data.session?.user ?? null);
        await load(data.session?.user ?? null);
      } catch (error) {
        console.warn("[Auth] Session initialization failed; continuing in offline mode.", error);
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refresh = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      await load(data.user);
    } catch (error) {
      console.warn("[Auth] Refresh failed; continuing in offline mode.", error);
      setUser(null);
      setProfile(null);
      setRoles([]);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("[Auth] Sign out failed; continuing in offline mode.", error);
    }
  };

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        roles,
        loading,
        isLguAdmin: profile?.primary_role === "lgu_admin" && profile?.lgu_approved === true,
        refresh,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside <AuthProvider>");
  return v;
}
