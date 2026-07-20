import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getSupabaseErrorMessage } from "@/lib/supabase-error";

export type AppRole = "farmer" | "restaurant" | "hotel_restaurant" | "resident" | "lgu_admin" | "super_admin";

export type Municipality = "burgos" | "dapa" | "general_luna" | "pilar" | "san_benito" | "san_isidro" | "santa_monica" | "socorro" | "del_carmen";

const normalizeRole = (role?: string | null): AppRole | null => {
  if (!role) return null;
  if (role === "hotel_restaurant") return "restaurant";
  if (role === "super_admin") return "super_admin";
  if (role === "lgu_admin") return "lgu_admin";
  if (role === "farmer") return "farmer";
  if (role === "restaurant") return "restaurant";
  if (role === "resident") return "resident";
  return null;
};

export type Profile = {
  id: string;
  full_name: string;
  barangay: string;
  address: string;
  phone: string;
  primary_role: AppRole;
  lgu_approved: boolean;
  profile_picture_url: string | null;
  cover_photo_url: string | null;
  municipality: Municipality;
  is_super_admin: boolean;
  government_id_url: string | null;
  theme_preferences?: any;
};

type AuthCtx = {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isLguAdmin: boolean;
  isEmailVerified: boolean;
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

      const metadataRole = normalizeRole((u.user_metadata?.role ?? u.app_metadata?.role) as string | undefined);
      const dbRoles = ((rs as { role: string }[]) ?? [])
        .map((r) => normalizeRole(r.role))
        .filter((r): r is AppRole => r !== null);
      const derivedRoles = Array.from(new Set([...(metadataRole ? [metadataRole] : []), ...dbRoles]));

      const normalizedProfile = prof
        ? {
            ...(prof as Profile),
            primary_role: normalizeRole((prof as any).primary_role) ?? (prof as Profile).primary_role,
          }
        : null;

      setProfile(normalizedProfile);
      setRoles(derivedRoles);
    } catch (error) {
      console.error("Unable to load auth profile:", getSupabaseErrorMessage(error));
      setProfile(null);
      setRoles([]);
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      // defer DB calls to avoid deadlock in listener
      setTimeout(() => load(session?.user ?? null), 0);
    });

    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user ?? null);
        await load(data.session?.user ?? null);
      } catch (error) {
        console.error("Unable to initialize auth session:", getSupabaseErrorMessage(error));
        setUser(null);
        setProfile(null);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(data.user);
      await load(data.user);
    } catch (error) {
      console.error("Unable to refresh auth state:", getSupabaseErrorMessage(error));
      setUser(null);
      setProfile(null);
      setRoles([]);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Unable to sign out:", getSupabaseErrorMessage(error));
    }
  };

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        roles,
        loading,
        isLguAdmin: profile?.primary_role === "lgu_admin" || roles.includes("lgu_admin") || (profile?.primary_role as string | undefined) === "lgu_admin",
        isEmailVerified: !!user?.email_confirmed_at,
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
