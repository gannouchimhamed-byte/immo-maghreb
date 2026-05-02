import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
export const createClient = () => createSupabaseClient(supabaseUrl, supabaseKey);

export async function getFeaturedListings() {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status","active")
    .is("deleted_at",null)
    .eq("is_featured",true)
    .order("created_at",{ascending:false})
    .limit(8);
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function searchListings(filters: {
  action?: string|null; type?: string|null; wilaya?: string|null;
  minPrice?: number|null; maxPrice?: number|null; minArea?: number|null; maxArea?: number|null;
  rooms?: number|null; minFloor?: number|null; maxFloor?: number|null;
  hasParking?: boolean|null; hasElevator?: boolean|null; hasPool?: boolean|null; hasTerrace?: boolean|null;
  deed?: string|null; q?: string|null; limit?: number; offset?: number;
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
