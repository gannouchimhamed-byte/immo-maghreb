import { searchListings } from "@/lib/supabase/client";
import ListingsClient from "./ListingsClient";

export const revalidate = 30;

export default async function ListingsPage({ searchParams }: { searchParams: any }) {
  const p = await searchParams;
  let listings: any[] = [];
  try {
    listings = await searchListings({
      action: p.action || null,
      type: p.type || null,
      wilaya: p.wilaya || null,
      minPrice: p.minPrice ? Number(p.minPrice) : null,
      maxPrice: p.maxPrice ? Number(p.maxPrice) : null,
      minArea: p.minArea ? Number(p.minArea) : null,
      maxArea: p.maxArea ? Number(p.maxArea) : null,
      rooms: p.rooms ? Number(p.rooms) : null,
      minFloor: p.minFloor ? Number(p.minFloor) : null,
      maxFloor: p.maxFloor ? Number(p.maxFloor) : null,
      hasParking: p.hasParking === "true" ? true : null,
      hasElevator: p.hasElevator === "true" ? true : null,
      hasPool: p.hasPool === "true" ? true : null,
      hasTerrace: p.hasTerrace === "true" ? true : null,
      deed: p.deed || null,
      q: p.q || null,
      limit: 48,
    });
  } catch (e) { console.error(e); }

  const initialFilters = {
    action: p.action || "",
    type: p.type || "",
    wilaya: p.wilaya || "",
    minPrice: p.minPrice ? Number(p.minPrice) : "",
    maxPrice: p.maxPrice ? Number(p.maxPrice) : "",
    minArea: p.minArea ? Number(p.minArea) : "",
    maxArea: p.maxArea ? Number(p.maxArea) : "",
    rooms: p.rooms ? Number(p.rooms) : "",
    minFloor: p.minFloor ? Number(p.minFloor) : "",
    maxFloor: p.maxFloor ? Number(p.maxFloor) : "",
    hasParking: p.hasParking === "true",
    hasElevator: p.hasElevator === "true",
    hasPool: p.hasPool === "true",
    hasTerrace: p.hasTerrace === "true",
    deed: p.deed || "",
  };

  return <ListingsClient listings={listings} initialFilters={initialFilters}/>;
}
