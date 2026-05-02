import { getListingsForMap } from "@/lib/supabase/client";
import MapClient from "./MapClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carte — Recherche immobilière en Tunisie",
  description: "Explorez les biens immobiliers sur la carte interactive. Appartements, villas, terrains en Tunisie.",
};

export const revalidate = 30;

export default async function MapPage({ searchParams }: { searchParams: any }) {
  const p = await searchParams;
  let listings: any[] = [];
  try {
    listings = await getListingsForMap({
      action:   p.action   || null,
      type:     p.type     || null,
      wilaya:   p.wilaya   || null,
      minPrice: p.minPrice ? Number(p.minPrice) : null,
      maxPrice: p.maxPrice ? Number(p.maxPrice) : null,
      rooms:    p.rooms    ? Number(p.rooms)    : null,
    });
  } catch (e) {
    console.error("Map page fetch error:", e);
  }

  const initialFilters = {
    action:   p.action   || "",
    type:     p.type     || "",
    wilaya:   p.wilaya   || "",
    minPrice: p.minPrice ? Number(p.minPrice) : "",
    maxPrice: p.maxPrice ? Number(p.maxPrice) : "",
    rooms:    p.rooms    ? Number(p.rooms)    : "",
  };

  return <MapClient listings={listings} initialFilters={initialFilters} />;
}
