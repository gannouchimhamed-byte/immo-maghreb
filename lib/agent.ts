import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
export type LeadStatus = "new" | "contacted" | "visit" | "offer" | "closed" | "lost";
export type LeadChannel = "whatsapp" | "email" | "phone" | "platform";

export interface Lead {
  id: string;
  listing_id: string | null;
  seeker_id: string | null;
  agent_id: string;
  status: LeadStatus;
  channel: LeadChannel;
  message: string | null;
  seeker_name: string | null;
  seeker_phone: string | null;
  agent_note: string | null;
  visit_scheduled_at: string | null;
  close_price: number | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  listing?: {
    id: string; title: string; price: number; area_m2: number;
    primary_image_url: string | null; wilaya: string | null;
    action: string; type: string;
  };
}

export interface AgentProfile {
  id: string; user_id: string; bio: string | null; agency_name: string | null;
  license_number: string | null; rating: number | null; review_count: number | null;
  active_listings: number | null; total_sales: number | null;
  response_time_minutes: number | null; phone: string | null;
  whatsapp_phone: string | null; avatar_url: string | null;
  wilaya: string | null; specialties: string[] | null; updated_at: string | null;
}

export interface AgentListing {
  id: string; title: string; price: number; area_m2: number; rooms: number | null;
  wilaya: string | null; district: string | null; action: string; type: string;
  status: string; view_count: number | null; lead_count: number | null;
  primary_image_url: string | null; is_featured: boolean; is_verified: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalListings: number; activeListings: number;
  totalLeads: number; newLeads: number;
  totalViews: number; closedDeals: number;
  avgResponseTime: number;
}

// ─── Status config ────────────────────────────────────────────────────────────
export const LEAD_STATUS_CFG: Record<LeadStatus, { label: string; color: string; bg: string; icon: string }> = {
  new:       { label: "Nouveau",   color: "text-blue-700",   bg: "bg-blue-100",   icon: "🔵" },
  contacted: { label: "Contacté",  color: "text-amber-700",  bg: "bg-amber-100",  icon: "🟡" },
  visit:     { label: "Visite",    color: "text-purple-700", bg: "bg-purple-100", icon: "🟣" },
  offer:     { label: "Offre",     color: "text-orange-700", bg: "bg-orange-100", icon: "🟠" },
  closed:    { label: "Conclu",    color: "text-emerald-700",bg: "bg-emerald-100",icon: "🟢" },
  lost:      { label: "Perdu",     color: "text-red-600",    bg: "bg-red-100",    icon: "🔴" },
};

export const CHANNEL_CFG: Record<LeadChannel, { label: string; icon: string }> = {
  whatsapp: { label: "WhatsApp", icon: "💬" },
  email:    { label: "Email",    icon: "📧" },
  phone:    { label: "Téléphone",icon: "📞" },
  platform: { label: "Hestia",   icon: "🏛" },
};

// ─── DB functions ─────────────────────────────────────────────────────────────
export async function getAgentProfile(userId: string): Promise<AgentProfile | null> {
  const sb = createClient();
  const { data } = await sb.from("agent_profiles").select("*").eq("user_id", userId).single();
  return data as AgentProfile | null;
}

export async function upsertAgentProfile(userId: string, patch: Partial<AgentProfile>): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("agent_profiles").upsert({
    user_id: userId, ...patch, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  return !error;
}

export async function getAgentListings(agentId: string): Promise<AgentListing[]> {
  const sb = createClient();
  const { data } = await sb.from("listings")
    .select("id,title,price,area_m2,rooms,wilaya,district,action,type,status,view_count,lead_count,primary_image_url,is_featured,is_verified,created_at")
    .eq("agent_id", agentId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data || []) as AgentListing[];
}

export async function getAgentLeads(agentId: string): Promise<Lead[]> {
  const sb = createClient();
  const { data } = await sb.from("leads")
    .select(`*, listing:listings(id,title,price,area_m2,primary_image_url,wilaya,action,type)`)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });
  return (data || []) as Lead[];
}

export async function updateLeadStatus(leadId: string, status: LeadStatus, note?: string): Promise<boolean> {
  const sb = createClient();
  const patch: any = { status, updated_at: new Date().toISOString() };
  if (note !== undefined) patch.agent_note = note;
  const { error } = await sb.from("leads").update(patch).eq("id", leadId);
  return !error;
}

export async function updateLeadNote(leadId: string, note: string): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("leads").update({ agent_note: note, updated_at: new Date().toISOString() }).eq("id", leadId);
  return !error;
}

export async function scheduleVisit(leadId: string, dateTime: string): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("leads").update({
    visit_scheduled_at: dateTime, status: "visit", updated_at: new Date().toISOString(),
  }).eq("id", leadId);
  return !error;
}

export async function getDashboardStats(agentId: string, listings: AgentListing[], leads: Lead[]): Promise<DashboardStats> {
  const active = listings.filter(l => l.status === "active");
  const totalViews = listings.reduce((s, l) => s + (l.view_count || 0), 0);
  const newLeads = leads.filter(l => l.status === "new").length;
  const closed = leads.filter(l => l.status === "closed").length;
  return {
    totalListings: listings.length, activeListings: active.length,
    totalLeads: leads.length, newLeads, totalViews, closedDeals: closed,
    avgResponseTime: 28, // placeholder — wire to real data when available
  };
}

export async function toggleListingStatus(listingId: string, currentStatus: string): Promise<boolean> {
  const sb = createClient();
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  const { error } = await sb.from("listings").update({ status: newStatus }).eq("id", listingId);
  return !error;
}

export async function deleteListing(listingId: string): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("listings").update({ deleted_at: new Date().toISOString(), status: "inactive" }).eq("id", listingId);
  return !error;
}
