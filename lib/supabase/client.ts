import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
export const createClient = () => createSupabaseClient(supabaseUrl, supabaseKey);

export async function getFeaturedListings() {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .is("deleted_at", null)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function searchListings(filters: {
  action?: string | null; type?: string | null; wilaya?: string | null;
  minPrice?: number | null; maxPrice?: number | null; minArea?: number | null; maxArea?: number | null;
  rooms?: number | null; minFloor?: number | null; maxFloor?: number | null;
  hasParking?: boolean | null; hasElevator?: boolean | null; hasPool?: boolean | null; hasTerrace?: boolean | null;
  deed?: string | null; q?: string | null; limit?: number; offset?: number;
} = {}) {
  const { data, error } = await supabase.rpc("search_listings", {
    p_action: filters.action || null,
    p_type: filters.type || null,
    p_wilaya: filters.wilaya || null,
    p_min_price: filters.minPrice || null,
    p_max_price: filters.maxPrice || null,
    p_min_area: filters.minArea || null,
    p_max_area: filters.maxArea || null,
    p_rooms: filters.rooms || null,
    p_min_floor: filters.minFloor || null,
    p_max_floor: filters.maxFloor || null,
    p_has_parking: filters.hasParking || null,
    p_has_elevator: filters.hasElevator || null,
    p_has_pool: filters.hasPool || null,
    p_has_terrace: filters.hasTerrace || null,
    p_deed: filters.deed || null,
    p_query: filters.q || null,
    p_limit: filters.limit || 24,
    p_offset: filters.offset || 0,
  });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function getListingById(id: string) {
  const { data, error } = await supabase
    .from("listings").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

// For the map page — returns only fields needed for pins + popups
export async function getListingsForMap(filters: {
  action?: string | null; type?: string | null; wilaya?: string | null;
  minPrice?: number | null; maxPrice?: number | null; rooms?: number | null;
} = {}) {
  let query = supabase
    .from("listings")
    .select(`
      id, title, price, area_m2, rooms, action, type,
      wilaya, district, lat, lng,
      primary_image_url, ai_signal, is_featured, is_verified,
      has_parking, has_elevator
    `)
    .eq("status", "active")
    .is("deleted_at", null)
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (filters.action)   query = query.eq("action", filters.action);
  if (filters.type)     query = query.eq("type", filters.type);
  if (filters.wilaya)   query = query.eq("wilaya", filters.wilaya);
  if (filters.minPrice) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
  if (filters.rooms)    query = query.gte("rooms", filters.rooms);

  const { data, error } = await query.order("is_featured", { ascending: false }).limit(200);
  if (error) { console.error(error); return []; }
  return data || [];
}

// ─── Saved Searches ───────────────────────────────────────────────────────────

// ─── Saved Searches ───────────────────────────────────────────────────────────

export interface SavedSearch {
  id: string;
  user_id: string | null;
  session_id: string | null;
  name: string;
  filters: Record<string, any>;
  channel: "whatsapp" | "email" | "push";
  frequency: "instant" | "daily" | "weekly";
  active: boolean;
  match_count: number | null;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("hestia_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("hestia_session_id", id);
  }
  return id;
}

export async function createSavedSearch(payload: {
  name: string;
  filters: Record<string, any>;
  channel: "whatsapp" | "email" | "push";
  frequency: "instant" | "daily" | "weekly";
}): Promise<SavedSearch | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const sessionId = getSessionId();

  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      name: payload.name,
      filters: payload.filters,
      channel: payload.channel,
      frequency: payload.frequency,
      user_id: user?.id ?? null,
      session_id: user ? null : sessionId,
      active: true,
    })
    .select()
    .single();

  if (error) { console.error("createSavedSearch:", error); return null; }
  return data;
}

export async function getSavedSearches(): Promise<SavedSearch[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const sessionId = getSessionId();

  let query = supabase
    .from("saved_searches")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (user) {
    query = query.eq("user_id", user.id);
  } else {
    query = query.eq("session_id", sessionId).is("user_id", null);
  }

  const { data, error } = await query;
  if (error) { console.error("getSavedSearches:", error); return []; }
  return data || [];
}

export async function deleteSavedSearch(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("saved_searches")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { console.error("deleteSavedSearch:", error); return false; }
  return true;
}

export async function toggleSavedSearch(id: string, active: boolean): Promise<boolean> {
  const { error } = await supabase
    .from("saved_searches")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { console.error("toggleSavedSearch:", error); return false; }
  return true;
}
