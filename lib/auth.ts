// ─── Hestia Auth — Supabase Email OTP (magic link style) ─────────────────────
// Exactly like ImmoScout24: email → 6-digit code → logged in. No password ever.

import { createClient } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  is_verified: boolean;
  created_at: string;
}

// ── Step 1: Send OTP to email ─────────────────────────────────────────────────
export async function sendEmailOtp(email: string): Promise<{ error: string | null }> {
  const sb = createClient();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,        // auto-register new users
      emailRedirectTo: undefined,    // we use the 6-digit code, not magic link
    },
  });
  if (error) return { error: error.message };
  return { error: null };
}

// ── Step 2: Verify the 6-digit OTP ───────────────────────────────────────────
export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  const sb = createClient();
  const { data, error } = await sb.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: "Vérification échouée" };

  // Fetch or create public profile
  const profile = await getProfile(data.user.id);
  return { user: profile, error: null };
}

// ── Get current session ───────────────────────────────────────────────────────
export async function getSession() {
  const sb = createClient();
  const { data } = await sb.auth.getSession();
  return data.session;
}

// ── Get current user + public profile ────────────────────────────────────────
export async function getCurrentUser(): Promise<AuthUser | null> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  return getProfile(user.id);
}

// ── Fetch public profile ──────────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<AuthUser | null> {
  const sb = createClient();
  const { data, error } = await sb
    .from("users")
    .select("id, email, full_name, avatar_url, role, is_verified, created_at")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as AuthUser;
}

// ── Update profile ────────────────────────────────────────────────────────────
export async function updateProfile(
  userId: string,
  patch: { full_name?: string; avatar_url?: string; wilaya?: string }
): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb
    .from("users")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return !error;
}

// ── Sign out ──────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  const sb = createClient();
  await sb.auth.signOut();
}

// ── Migrate device saved searches to real auth user ──────────────────────────
export async function migrateDeviceSearches(deviceId: string, userId: string) {
  const sb = createClient();
  await sb
    .from("saved_searches")
    .update({ user_id: userId })
    .eq("user_id", deviceId)
    .is("deleted_at", null);
}

// ── Auth state listener (for client components) ───────────────────────────────
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const sb = createClient();
  const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await getProfile(session.user.id);
      callback(profile);
    } else {
      callback(null);
    }
  });
  return () => subscription.unsubscribe();
}
