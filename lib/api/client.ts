// API client for ImmoMaghreb

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.statusText}`);
  return res.json();
}

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
  favorite: (id: string) => apiFetch<{ saved: boolean }>(`/listings/${id}/favorite`, { method: "POST" }),
};

export type ValuationParams = {
  type: string;
  action: string;
  wilaya: string;
  area: number;
  rooms?: number;
  floor?: number;
  deed?: string;
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
      signal: string;
    }>("/valuation/estimate", { method: "POST", body: JSON.stringify(params) }),
  marketStats: (wilaya: string) =>
    apiFetch<{ wilaya: string; avgPricePerM2: { vente: number; location: number } }>(
      `/valuation/market/${encodeURIComponent(wilaya)}`
    ),
};

export const authApi = {
  requestOtp: (phone: string, channel = "whatsapp") =>
    apiFetch<{ success: boolean }>("/auth/otp/request", {
      method: "POST", body: JSON.stringify({ phone, channel }),
    }),
  verifyOtp: (phone: string, otp: string) =>
    apiFetch<{ accessToken: string; refreshToken: string; user: any }>("/auth/otp/verify", {
      method: "POST", body: JSON.stringify({ phone, otp }),
    }),
  me: () => apiFetch<any>("/auth/me"),
};

export const leadsApi = {
  create: (data: { listingId: string; message: string; channel?: string }) =>
    apiFetch<any>("/leads", { method: "POST", body: JSON.stringify(data) }),
  getMyLeads: (params?: { status?: string; page?: number }) => {
    const qs = params ? new URLSearchParams(params as any).toString() : "";
    return apiFetch<{ data: any[]; meta: any }>(`/leads?${qs}`);
  },
  getStats: () => apiFetch<any>("/leads/stats"),
};

export const alertsApi = {
  list: () => apiFetch<{ data: any[] }>("/alerts"),
  create: (data: any) => apiFetch<any>("/alerts", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/alerts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/alerts/${id}`, { method: "DELETE" }),
};

export const mediaApi = {
  presign: (params: { filename: string; mimeType: string; size: number; listingId?: string }) =>
    apiFetch<{ uploadUrl: string; key: string; cdnUrl: string }>("/media/presign", {
      method: "POST", body: JSON.stringify(params),
    }),
};
