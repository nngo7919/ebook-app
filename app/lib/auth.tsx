// ============================================================
// TYT EBOOK APP — AUTH CONTEXT
// Quản lý session, login, signup, logout toàn app
// ============================================================

import { auth as authApi, profiles as profilesApi } from "@/app/lib/api";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AuthCredentials, Profile, SignUpCredentials } from "./types";

// ── TYPES ────────────────────────────────────────────────────

type AuthState = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
};

type AuthActions = {
  signIn: (creds: AuthCredentials) => Promise<{ error: string | null }>;
  signUp: (creds: SignUpCredentials) => Promise<{ error: string | null; requiresConfirmation?: boolean }>;
  signInAnonymously: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

type AuthContextValue = AuthState & AuthActions;

// ── CONTEXT ──────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── PROVIDER ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // isGuest = đã đăng nhập nhưng là anonymous user (không có email)
  const isGuest = !!user && user.is_anonymous === true;

  // Load profile từ Supabase qua API layer
  // Anonymous user không có profile — bỏ qua lỗi, không crash
  const loadProfile = useCallback(async (userId: string, isAnonymous = false) => {
    if (isAnonymous) return; // guest không có profile row
    const { data } = await profilesApi.get(userId);
    if (data) setProfile(data);
  }, []);

  // Lắng nghe auth state changes (tự động xử lý session từ AsyncStorage)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id, session.user.is_anonymous);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user.is_anonymous);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── ACTIONS ──────────────────────────────────────────────

  const signIn = async (
    creds: AuthCredentials,
  ): Promise<{ error: string | null }> => {
    const { error } = await authApi.signIn(creds);
    return { error };
  };

  const signUp = async (
    creds: SignUpCredentials,
  ): Promise<{ error: string | null; requiresConfirmation?: boolean }> => {
    const { data, error } = await authApi.signUp(creds);
    return { error, requiresConfirmation: data?.requiresConfirmation };
  };

  const signInAnonymously = async (): Promise<{ error: string | null }> => {
    const { error } = await authApi.signInAnonymously();
    return { error };
  };

  const signOut = async () => {
    await authApi.signOut();
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isGuest,
        signIn,
        signUp,
        signInAnonymously,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── HOOK ─────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng trong <AuthProvider>");
  return ctx;
}

// ── GUARD HOOK: redirect nếu chưa đăng nhập ─────────────────

export function useRequireAuth(redirectTo = "/auth/login") {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo as any);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
}