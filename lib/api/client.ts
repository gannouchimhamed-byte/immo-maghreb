/**
 * API client for ImmoMaghreb frontend
 * Uses SWR for data fetching + caching
 *
 * Usage:
 *   const { listings, isLoading } = useListings({ wilaya: "Tunis", action: "vente" });
 *   const { listing } = useListing("lst_123");
 *   const { estimate } = useValuation({ type: "appartement", area: 120, wilaya: "Tunis" });
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

// ─── Fetch wrapper ─────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("immo_token")
    : null;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, error.message ?? "Request failed");
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Listings API ──────────────────────────────────────────────
export type SearchParams = {
  q?: string;
  action?: string;
  type?: string;
  wilaya?: string;
  deed?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  rooms?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  hasParking?: boolean;
  hasTerrace?: boolean;
  mosqueMaxDist?: number;
  schoolMaxDist?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
};

export const listingsApi = {
  search: (params: SearchParams) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return apiFetch<{ data: any[]; meta: { total: number; page: number; pages: number } }>(
      `/listings${qs ? `?${qs}` : ""}`
    );
  },

  getById: (id: string) => apiFetch<any>(`/listings/${id}`),

  getFeatured: () => apiFetch<{ data: any[] }>("/listings/featured"),

  getGeoJSON: (params: SearchParams) => {
    const qs = new URLSearchParams(Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    )).toString();
    return apiFetch<GeoJSON.FeatureCollection>(`/listings/map?${qs}`);
  },

  favorite: (id: string) => apiFetch<{ saved: boolean }>(`/listings/${id}/favorite`, { method: "POST" }),

  create: (data: any) => apiFetch<any>("/listings", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiFetch<any>(`/listings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) => apiFetch<void>(`/listings/${id}`, { method: "DELETE" }),
};

// ─── Valuation API ─────────────────────────────────────────────
export type ValuationParams = {
  type: string;
  action: string;
  wilaya: string;
  area: number;
  rooms?: number;
  floor?: number;
  deed?: string;
  has_parking?: boolean;
  has_elevator?: boolean;
  lat?: number;
  lng?: number;
};

export const valuationApi = {
  estimate: (params: ValuationParams) =>
    apiFetch<{
      estimate: number;
      low: number;
      high: number;
      currency: string;
      pricePerM2: number;
      confidence: number;
      comparables: number;
      signal: "underpriced" | "fair" | "overpriced";
      trend: { change12m: number; direction: "up" | "down" };
    }>("/valuation/estimate", { method: "POST", body: JSON.stringify(params) }),

  marketStats: (wilaya: string) =>
    apiFetch<{
      wilaya: string;
      avgPricePerM2: { vente: number; location: number };
      trend12m: { vente: number; location: number };
      totalActiveListings: number;
    }>(`/valuation/market/${encodeURIComponent(wilaya)}`),
};

// ─── Auth API ─────────────────────────────────────────────────
export const authApi = {
  requestOtp: (phone: string, channel: "whatsapp" | "sms" = "whatsapp") =>
    apiFetch<{ success: boolean; expiresInSeconds: number }>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ phone, channel }),
    }),

  verifyOtp: (phone: string, otp: string) =>
    apiFetch<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; phone: string; role: string; isNew: boolean };
    }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    }),

  me: () => apiFetch<any>("/auth/me"),

  logout: (refreshToken: string) =>
    apiFetch<void>("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }),
};

// ─── Leads API ────────────────────────────────────────────────
export const leadsApi = {
  create: (data: { listingId: string; message: string; channel?: string; seekerName?: string; seekerPhone?: string }) =>
    apiFetch<any>("/leads", { method: "POST", body: JSON.stringify(data) }),

  getMyLeads: (params?: { status?: string; page?: number }) => {
    const qs = params ? new URLSearchParams(params as any).toString() : "";
    return apiFetch<{ data: any[]; meta: any }>(`/leads?${qs}`);
  },

  updateStatus: (id: string, status: string, note?: string) =>
    apiFetch<any>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status, agentNote: note }) }),

  getStats: () => apiFetch<any>("/leads/stats"),
};

// ─── Alerts API ───────────────────────────────────────────────
export const alertsApi = {
  list: () => apiFetch<{ data: any[] }>("/alerts"),

  create: (data: any) =>
    apiFetch<any>("/alerts", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiFetch<any>(`/alerts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<void>(`/alerts/${id}`, { method: "DELETE" }),

  test: (id: string) =>
    apiFetch<{ sent: boolean }>(`/alerts/${id}/test`, { method: "POST" }),
};

// ─── Media API ───────────────────────────────────────────────
export const mediaApi = {
  presign: (params: { filename: string; mimeType: string; size: number; listingId?: string }) =>
    apiFetch<{ uploadUrl: string; key: string; cdnUrl: string; expiresInSeconds: number }>(
      "/media/presign", { method: "POST", body: JSON.stringify(params) }
    ),

  confirm: (params: { key: string; listingId: string; isPrimary?: boolean; altText?: string }) =>
    apiFetch<{ id: string; url: string; key: string }>(
      "/media/confirm", { method: "POST", body: JSON.stringify(params) }
    ),

  /**
   * Upload a file directly to R2 via presigned URL.
   * No server proxy — faster and no bandwidth cost.
   */
  uploadDirect: async (file: File, listingId: string, isPrimary = false) => {
    // 1. Get presigned URL
    const { uploadUrl, key, cdnUrl } = await mediaApi.presign({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      listingId,
    });

    // 2. Upload directly to R2
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) throw new Error("Upload to R2 failed");

    // 3. Confirm with API
    const media = await mediaApi.confirm({ key, listingId, isPrimary });
    return { ...media, cdnUrl };
  },
};
