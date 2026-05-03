import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Promoter {
  id: string;
  user_id: string | null;
  company_name: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  slogan: string | null;
  established_year: number | null;
  website: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  email: string | null;
  address: string | null;
  wilaya: string | null;
  wilayas_covered: string[] | null;
  specialties: string[] | null;
  is_verified: boolean;
  is_featured: boolean;
  total_projects: number;
  total_units: number;
  delivered_units: number;
  rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
  // computed
  listing_count?: number;
}

export interface PromoterListing {
  id: string; title: string; price: number; area_m2: number;
  rooms: number | null; bathrooms: number | null;
  wilaya: string | null; district: string | null; delegation: string | null;
  action: string; type: string; status: string;
  primary_image_url: string | null; image_urls: string[];
  is_featured: boolean; is_verified: boolean;
  ai_signal: string | null; has_parking: boolean; has_elevator: boolean;
  has_pool: boolean; has_terrace: boolean;
  project_name: string | null; building_name: string | null;
  construction_status: string | null; year_built: number | null;
  view_count: number | null; created_at: string;
}

export const CONSTRUCTION_STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  plan:         { label: "En plan",      color: "text-blue-700",   bg: "bg-blue-100",   icon: "📋" },
  construction: { label: "En chantier", color: "text-amber-700",  bg: "bg-amber-100",  icon: "🏗" },
  ready:        { label: "Prêt",         color: "text-emerald-700",bg: "bg-emerald-100",icon: "✅" },
  delivered:    { label: "Livré",        color: "text-navy/70",    bg: "bg-navy/8",     icon: "🔑" },
};

// ─── DB functions ─────────────────────────────────────────────────────────────
export async function getAllPromoters(): Promise<Promoter[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("promoters")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("total_projects", { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []) as Promoter[];
}

export async function getPromoterById(id: string): Promise<Promoter | null> {
  const sb = createClient();
  const { data, error } = await sb
    .from("promoters")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Promoter;
}

export async function getPromoterListings(promoterId: string): Promise<PromoterListing[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("listings")
    .select(`
      id, title, price, area_m2, rooms, bathrooms,
      wilaya, district, delegation, action, type, status,
      primary_image_url, image_urls,
      is_featured, is_verified, ai_signal,
      has_parking, has_elevator, has_pool, has_terrace,
      project_name, building_name, construction_status, year_built,
      view_count, created_at
    `)
    .eq("promoter_id", promoterId)
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []) as PromoterListing[];
}

export async function getPromoterStats(listings: PromoterListing[]) {
  const active   = listings.filter(l => l.status === "active");
  const forSale  = active.filter(l => l.action === "vente");
  const forRent  = active.filter(l => l.action === "location");
  const projects = [...new Set(listings.map(l => l.project_name).filter(Boolean))];
  const avgPrice = forSale.length
    ? Math.round(forSale.reduce((s, l) => s + l.price, 0) / forSale.length)
    : 0;
  const totalViews = listings.reduce((s, l) => s + (l.view_count || 0), 0);

  return { active: active.length, forSale: forSale.length, forRent: forRent.length,
    projects: projects.length, avgPrice, totalViews };
}

export async function getListingsByPromoterForCard(promoterId: string) {
  const sb = createClient();
  const { data } = await sb
    .from("listings")
    .select("id, title, primary_image_url, price, area_m2, action")
    .eq("promoter_id", promoterId)
    .eq("status", "active")
    .is("deleted_at", null)
    .limit(3);
  return data || [];
}
