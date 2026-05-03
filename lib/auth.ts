import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type { User, Session };

// ── Auth actions ──────────────────────────────────────────────────────────────

export async function signInWithOTP(email: string): Promise<{ error: string | null }> {
  const sb = createClient();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { error: error?.message ?? null };
}

export async function verifyOTP(email: string, token: string): Promise<{ error: string | null }> {
  const sb = createClient();
  const { error } = await sb.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  return { error: error?.message ?? null };
}

export async function signInWithGoogle(): Promise<void> {
  const sb = createClient();
  await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });
}

export async function signOut(): Promise<void> {
  const sb = createClient();
  await sb.auth.signOut();
  window.location.href = "/";
}

export async function getSession(): Promise<Session | null> {
  const sb = createClient();
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const sb = createClient();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  wilaya: string | null;
  is_verified: boolean;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const sb = createClient();
  const { data, error } = await sb
    .from("users")
    .select("id, email, full_name, avatar_url, role, wilaya, is_verified")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as UserProfile;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<UserProfile, "full_name" | "wilaya">>
): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb
    .from("users")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return !error;
}

// ── Migrate device saved searches to real auth uid ────────────────────────────
export async function migrateDeviceSearches(deviceId: string, userId: string): Promise<void> {
  if (!deviceId || !userId) return;
  const sb = createClient();
  await sb
    .from("saved_searches")
    .update({ user_id: userId })
    .eq("user_id", deviceId)
    .is("deleted_at", null);
  // Clear device ID now that we have real auth
  localStorage.removeItem("hestia_device_id");
}

// Re-export getDeviceId from saved-searches for convenience
export { getDeviceId } from "@/lib/saved-searches";

// ── Favorites ─────────────────────────────────────────────────────────────────
export async function getFavorites(userId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from("favorites")
    .select(`
      id, created_at,
      listing:listings (
        id, title, price, area_m2, rooms, bathrooms, floor,
        wilaya, district, delegation, action, type, deed,
        primary_image_url, image_urls,
        has_parking, has_elevator, has_pool, has_terrace,
        is_featured, is_verified, ai_signal, ai_price_per_m2,
        metro_distance, beach_distance, school_distance,
        lat, lng, status
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).filter(f => f.listing && (f.listing as any).status === "active");
}

export async function toggleFavorite(userId: string, listingId: string): Promise<boolean> {
  const sb = createClient();
  const { data } = await sb
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (data) {
    await sb.from("favorites").delete().eq("id", data.id);
    return false; // removed
  } else {
    await sb.from("favorites").insert({ user_id: userId, listing_id: listingId });
    return true; // added
  }
}

export async function isFavorite(userId: string, listingId: string): Promise<boolean> {
  const sb = createClient();
  const { data } = await sb
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();
  return !!data;
}
