import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const type   = searchParams.get("type");

  const supabase = createClient();
  let query = supabase
    .from("listings")
    .select("wilaya, price, area_m2, action, type")
    .eq("status", "active")
    .is("deleted_at", null)
    .not("wilaya", "is", null)
    .gt("area_m2", 0);

  if (action) query = query.eq("action", action);
  if (type)   query = query.eq("type",   type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = new Map<string, { prices: number[]; pricesM2: number[] }>();
  (data || []).forEach((l: any) => {
    if (!l.wilaya) return;
    if (!map.has(l.wilaya)) map.set(l.wilaya, { prices: [], pricesM2: [] });
    const e = map.get(l.wilaya)!;
    e.prices.push(l.price);
    if (l.area_m2 > 0) e.pricesM2.push(l.price / l.area_m2);
  });

  const stats = Array.from(map.entries()).map(([wilaya, { prices, pricesM2 }]) => ({
    wilaya,
    avgPrice:   Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    avgPriceM2: pricesM2.length > 0
      ? Math.round(pricesM2.reduce((a, b) => a + b, 0) / pricesM2.length)
      : null,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    count: prices.length,
  }));

  return NextResponse.json({ stats });
}
