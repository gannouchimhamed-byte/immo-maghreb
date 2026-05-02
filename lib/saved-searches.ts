// ─── Saved Searches — types, client helpers, device ID management ────────────

import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────
export type AlertChannel   = "whatsapp" | "email" | "push";
export type AlertFrequency = "instant"  | "daily" | "weekly";

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, any>;
  channel: AlertChannel;
  frequency: AlertFrequency;
  active: boolean;
  match_count: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveSearchPayload {
  name: string;
  filters: Record<string, any>;
  channel: AlertChannel;
  frequency: AlertFrequency;
}

// ── Device ID — persistent UUID stored in localStorage ────────────────────────
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("hestia_device_id");
  if (!id) {
    // Generate a v4 UUID
    id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
    localStorage.setItem("hestia_device_id", id);
  }
  return id;
}

// ── Client operations via Supabase anon key ────────────────────────────────────

export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  const deviceId = getDeviceId();
  if (!deviceId) return [];
  const sb = createClient();
  const { data, error } = await sb
    .from("saved_searches")
    .select("*")
    .eq("user_id", deviceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchSavedSearches:", error); return []; }
  return (data || []) as SavedSearch[];
}

export async function createSavedSearch(payload: SaveSearchPayload): Promise<SavedSearch | null> {
  const deviceId = getDeviceId();
  if (!deviceId) return null;
  const sb = createClient();
  const { data, error } = await sb
    .from("saved_searches")
    .insert({
      user_id:   deviceId,
      name:      payload.name,
      filters:   payload.filters,
      channel:   payload.channel,
      frequency: payload.frequency,
      active:    true,
    })
    .select()
    .single();
  if (error) { console.error("createSavedSearch:", error); return null; }
  return data as SavedSearch;
}

export async function updateSavedSearch(
  id: string,
  patch: Partial<Pick<SavedSearch, "name" | "active" | "channel" | "frequency" | "filters">>
): Promise<boolean> {
  const deviceId = getDeviceId();
  if (!deviceId) return false;
  const sb = createClient();
  const { error } = await sb
    .from("saved_searches")
    .update(patch)
    .eq("id", id)
    .eq("user_id", deviceId);
  if (error) { console.error("updateSavedSearch:", error); return false; }
  return true;
}

export async function deleteSavedSearch(id: string): Promise<boolean> {
  const deviceId = getDeviceId();
  if (!deviceId) return false;
  const sb = createClient();
  // Soft delete
  const { error } = await sb
    .from("saved_searches")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", id)
    .eq("user_id", deviceId);
  if (error) { console.error("deleteSavedSearch:", error); return false; }
  return true;
}

// ── Human-readable filter summary ─────────────────────────────────────────────
export function describeFilters(filters: Record<string, any>): string {
  const parts: string[] = [];
  if (filters.action === "vente")   parts.push("Vente");
  if (filters.action === "location") parts.push("Location");
  if (filters.type)    parts.push(TYPE_LABELS[filters.type] || filters.type);
  if (filters.wilaya)  parts.push(filters.wilaya);
  if (filters.minPrice && filters.maxPrice)
    parts.push(`${fmtK(filters.minPrice)}–${fmtK(filters.maxPrice)} TND`);
  else if (filters.minPrice) parts.push(`Dès ${fmtK(filters.minPrice)} TND`);
  else if (filters.maxPrice) parts.push(`Max ${fmtK(filters.maxPrice)} TND`);
  if (filters.minArea) parts.push(`≥${filters.minArea}m²`);
  if (filters.rooms)   parts.push(`${filters.rooms}+ pièces`);
  if (filters.hasParking)  parts.push("Parking");
  if (filters.hasElevator) parts.push("Ascenseur");
  if (filters.hasPool)     parts.push("Piscine");
  if (filters.commute) parts.push(`⏱ ${filters.commute.maxMinutes}min`);
  return parts.length ? parts.join(" · ") : "Toutes les annonces";
}

const fmtK = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`;
const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement", villa: "Villa", terrain: "Terrain",
  bureau: "Bureau", duplex: "Duplex", studio: "Studio", ferme: "Ferme",
};

export const CHANNEL_CFG: Record<AlertChannel, { icon: string; label: string; color: string }> = {
  whatsapp: { icon: "💬", label: "WhatsApp", color: "#25D366" },
  email:    { icon: "📧", label: "Email",    color: "#3b82f6" },
  push:     { icon: "🔔", label: "Push",     color: "#f59e0b" },
};

export const FREQUENCY_CFG: Record<AlertFrequency, { label: string; icon: string }> = {
  instant: { label: "Instantané", icon: "⚡" },
  daily:   { label: "Quotidien",  icon: "📅" },
  weekly:  { label: "Hebdo",      icon: "📆" },
};
