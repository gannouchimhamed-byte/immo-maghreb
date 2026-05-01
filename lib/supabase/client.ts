import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getListings(filters?: {
  action?: string; type?: string; wilaya?: string;
  minPrice?: number; maxPrice?: number; limit?: number;
}) {
  const { data, error } = await supabase.rpc("search_listings", {
    p_action: filters?.action || null,
    p_type: filters?.type || null,
    p_wilaya: filters?.wilaya || null,
    p_min_price: filters?.minPrice || null,
    p_max_price: filters?.maxPrice || null,
    p_limit: filters?.limit || 20,
    p_offset: 0,
  });
  if (error) throw error;
  return data;
}

export async function getFeaturedListings() {
  const { data, error } = await supabase.rpc("search_listings", {
    p_featured: true, p_limit: 6, p_offset: 0,
  });
  if (error) throw error;
  return data;
}

export async function getListingById(id: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("*, users(full_name, phone, whatsapp_phone, avatar_url), agent_profiles(agency_name, rating, response_time_minutes)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
