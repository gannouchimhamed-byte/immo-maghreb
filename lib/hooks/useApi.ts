import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useState, useCallback } from "react";
import {
  listingsApi, valuationApi, authApi, leadsApi, alertsApi,
  type SearchParams, type ValuationParams,
} from "./client";

// ─── Listings hooks ────────────────────────────────────────────
export function useListings(params: SearchParams) {
  const key = ["listings", JSON.stringify(params)];
  const { data, error, isLoading, mutate } = useSWR(key, () => listingsApi.search(params), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  return {
    listings: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

export function useListing(id: string | null) {
  const { data, error, isLoading } = useSWR(
    id ? ["listing", id] : null,
    () => listingsApi.getById(id!),
    { revalidateOnFocus: false }
  );

  return { listing: data, isLoading, error };
}

export function useFeaturedListings() {
  const { data, error, isLoading } = useSWR(
    "listings/featured",
    () => listingsApi.getFeatured(),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  return { listings: data?.data ?? [], isLoading, error };
}

// Infinite scroll variant
export function useInfiniteListings(params: Omit<SearchParams, "page">) {
  const [page, setPage] = useState(1);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading } = useSWR(
    hasMore ? ["listings/infinite", JSON.stringify(params), page] : null,
    () => listingsApi.search({ ...params, page }),
    {
      onSuccess: (result) => {
        setAllListings((prev) => page === 1 ? result.data : [...prev, ...result.data]);
        setHasMore(result.meta.page < result.meta.pages);
      },
    }
  );

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) setPage((p) => p + 1);
  }, [isLoading, hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setAllListings([]);
    setHasMore(true);
  }, []);

  return { listings: allListings, isLoading, hasMore, loadMore, reset, meta: data?.meta };
}

// ─── Valuation hooks ───────────────────────────────────────────
export function useValuation(params: ValuationParams | null) {
  const { data, error, isLoading } = useSWR(
    params ? ["valuation", JSON.stringify(params)] : null,
    () => valuationApi.estimate(params!),
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  return {
    estimate: data?.estimate,
    range: data ? { low: data.low, high: data.high } : null,
    signal: data?.signal,
    confidence: data?.confidence,
    pricePerM2: data?.pricePerM2,
    trend: data?.trend,
    isLoading,
    error,
  };
}

export function useMarketStats(wilaya: string | null) {
  const { data, isLoading } = useSWR(
    wilaya ? ["market", wilaya] : null,
    () => valuationApi.marketStats(wilaya!),
    { revalidateOnFocus: false, dedupingInterval: 600_000 }
  );

  return { stats: data, isLoading };
}

// ─── Auth hooks ────────────────────────────────────────────────
export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR(
    "auth/me",
    () => authApi.me(),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: () => {
        // Clear token if 401
        if (typeof window !== "undefined") {
          localStorage.removeItem("immo_token");
          localStorage.removeItem("immo_refresh");
        }
      },
    }
  );

  return {
    user: data,
    isLoggedIn: !!data && !error,
    isLoading,
    mutate,
  };
}

// ─── Leads hooks ──────────────────────────────────────────────
export function useAgentLeads(params?: { status?: string; page?: number }) {
  const { data, isLoading, mutate } = useSWR(
    ["leads", JSON.stringify(params)],
    () => leadsApi.getMyLeads(params),
    { refreshInterval: 30_000 } // poll every 30s for new leads
  );

  return { leads: data?.data ?? [], meta: data?.meta, isLoading, mutate };
}

export function useLeadStats() {
  const { data, isLoading } = useSWR("leads/stats", () => leadsApi.getStats(), {
    refreshInterval: 60_000,
  });
  return { stats: data, isLoading };
}

// ─── Alerts hooks ─────────────────────────────────────────────
export function useAlerts() {
  const { data, isLoading, mutate } = useSWR(
    "alerts",
    () => alertsApi.list(),
    { revalidateOnFocus: true }
  );

  const { trigger: createAlert } = useSWRMutation("alerts", async (_, { arg }: { arg: any }) => {
    const created = await alertsApi.create(arg);
    mutate();
    return created;
  });

  const deleteAlert = async (id: string) => {
    await alertsApi.delete(id);
    mutate();
  };

  const toggleAlert = async (id: string, active: boolean) => {
    await alertsApi.update(id, { active });
    mutate();
  };

  return {
    alerts: data?.data ?? [],
    isLoading,
    createAlert,
    deleteAlert,
    toggleAlert,
    mutate,
  };
}

// ─── Favorite toggle ──────────────────────────────────────────
export function useFavorite(listingId: string) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const result = await listingsApi.favorite(listingId);
      setSaved(result.saved);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return { saved, toggle, loading };
}
