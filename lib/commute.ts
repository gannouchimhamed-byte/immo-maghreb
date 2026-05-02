// ─── Commute utilities — zero external API dependencies ────────────────────
// Uses Nominatim (free OSM geocoding) + haversine radius

export type TransportMode = "car" | "transit" | "walk" | "bike";

export interface CommuteState {
  address: string;       // human-readable address string
  lat: number;           // destination lat
  lng: number;           // destination lng
  mode: TransportMode;
  maxMinutes: number;    // 15 | 20 | 30 | 45 | 60
}

// Average speeds in km/h — tuned for Tunisian urban reality
// (Tunis traffic, limited metro, mixed roads)
export const SPEED_KMH: Record<TransportMode, number> = {
  car:     38,   // urban Tunisia with traffic
  transit: 18,   // bus/TGM average including stops/waiting
  walk:    4.5,  // normal walking pace
  bike:    13,   // cycling on mixed roads
};

export const MODE_LABELS: Record<TransportMode, { label: string; icon: string; color: string }> = {
  car:     { label: "Voiture",  icon: "🚗", color: "#1B2B3A" },
  transit: { label: "Transport", icon: "🚇", color: "#2563eb" },
  walk:    { label: "À pied",   icon: "🚶", color: "#059669" },
  bike:    { label: "Vélo",     icon: "🚲", color: "#d97706" },
};

// Haversine formula — great-circle distance between two lat/lng points
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Straight-line radius in km for a given mode + time
export function commuteRadiusKm(mode: TransportMode, minutes: number): number {
  // Add 20% buffer: straight-line is always shorter than actual road distance
  return (SPEED_KMH[mode] * minutes) / 60 / 0.80;
}

// Estimated commute time in minutes from a listing to a destination
export function estimateCommuteMinutes(
  listingLat: number,
  listingLng: number,
  destLat: number,
  destLng: number,
  mode: TransportMode
): number {
  const km = haversineKm(listingLat, listingLng, destLat, destLng);
  // Apply road factor: real distance ≈ straight-line × 1.3 on average
  return Math.round((km * 1.3 / SPEED_KMH[mode]) * 60);
}

// Check if a listing is within commute range
export function isWithinCommute(
  listingLat: number | null,
  listingLng: number | null,
  commute: CommuteState
): boolean {
  if (listingLat == null || listingLng == null) return false;
  const minutes = estimateCommuteMinutes(listingLat, listingLng, commute.lat, commute.lng, commute.mode);
  return minutes <= commute.maxMinutes;
}

// Generate GeoJSON circle polygon for map overlay (64 points)
export function generateCircleGeoJSON(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  steps = 64
) {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusKm / 111.32) * Math.sin(angle);
    const dLng = (radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180))) * Math.cos(angle);
    coords.push([centerLng + dLng, centerLat + dLat]);
  }
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [coords] },
    properties: {},
  };
}

// Nominatim geocoding — free, no API key, OSM-powered
export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

export async function geocodeAddress(query: string): Promise<NominatimResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "tn");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "fr");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Hestia-RealEstate/1.0 (hestia.tn)" },
  });
  if (!res.ok) return [];
  return res.json();
}
