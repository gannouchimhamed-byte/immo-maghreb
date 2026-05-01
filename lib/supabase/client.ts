import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getFeaturedListings() {
  const { data, error } = await supabase.rpc("search_listings", {
    p_featured: true, p_limit: 8, p_offset: 0,
  });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function searchListings(filters: any = {}) {
  const { data, error } = await supabase.rpc("search_listings", {
    p_action: filters.action || null,
    p_type: filters.type || null,
    p_wilaya: filters.wilaya || null,
    p_min_price: filters.minPrice || null,
    p_max_price: filters.maxPrice || null,
    p_query: filters.q || null,
    p_limit: filters.limit || 24,
    p_offset: 0,
  });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function getListingById(id: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}
