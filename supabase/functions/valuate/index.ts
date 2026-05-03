// Hestia AI Valuation Engine — Supabase Edge Function (Deno)
// Endpoint: POST /functions/v1/valuate
// No FastAPI needed — Deno runs natively on Supabase, zero cold start, free

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ValuationRequest {
  wilaya: string;
  type: string;          // appartement | villa | terrain | bureau | duplex | studio
  action: string;        // vente | location
  area_m2: number;
  rooms?: number | null;
  bathrooms?: number | null;
  floor?: number | null;
  deed?: string | null;
  orientation?: string | null;
  has_parking?: boolean;
  has_elevator?: boolean;
  has_pool?: boolean;
  has_terrace?: boolean;
  has_garden?: boolean;
  has_ac?: boolean;
  metro_distance?: number | null;
  beach_distance?: number | null;
  school_distance?: number | null;
  listing_price?: number | null;  // optional — used to compute ai_signal
  listing_id?: string | null;     // optional — if provided, store result to DB
}

interface ValuationResult {
  estimate: number;
  price_per_m2: number;
  base_price_m2: number;
  confidence: number;        // 0–1
  signal: "underpriced" | "fair" | "overpriced" | null;
  signal_delta_pct: number | null;  // % diff from listing price
  adjustments: Adjustment[];
  market_trend_12m: number | null;
  sample_size: number;
  wilaya: string;
  type: string;
}

interface Adjustment {
  factor: string;
  label: string;
  multiplier: number;   // e.g. 1.05 = +5%
}

// ─── Market index cache (loaded once per invocation) ──────────────────────────
type MarketRow = {
  wilaya: string; property_type: string; action: string;
  avg_price_m2: number; trend_12m_pct: number; sample_size: number;
};

// ─── Feature adjustment model ─────────────────────────────────────────────────
function computeAdjustments(req: ValuationRequest): Adjustment[] {
  const adjs: Adjustment[] = [];

  // ── Floor premium (appartement / bureau only) ──────────────────────────
  if (req.floor != null && req.floor > 0 && req.type !== "terrain") {
    const floorPct = Math.min(req.floor * 0.018, 0.09); // +1.8%/floor, max +9%
    if (floorPct > 0.005) adjs.push({
      factor: "floor",
      label: `Étage ${req.floor} (+${(floorPct * 100).toFixed(1)}%)`,
      multiplier: 1 + floorPct,
    });
  }

  // ── Room count premium ─────────────────────────────────────────────────
  if (req.rooms != null && req.type !== "terrain") {
    let mult = 1.0;
    if (req.rooms >= 4) mult = 1.06;          // 4+ pièces: +6%
    else if (req.rooms === 3) mult = 1.03;    // 3 pièces:  +3%
    else if (req.rooms === 1) mult = 0.96;    // studio/1p: -4%
    if (mult !== 1.0) adjs.push({
      factor: "rooms",
      label: `${req.rooms} pièce${req.rooms > 1 ? "s" : ""} (${mult > 1 ? "+" : ""}${((mult - 1) * 100).toFixed(0)}%)`,
      multiplier: mult,
    });
  }

  // ── Amenities ──────────────────────────────────────────────────────────
  if (req.has_pool)     adjs.push({ factor: "pool",     label: "Piscine (+7%)",     multiplier: 1.07 });
  if (req.has_parking)  adjs.push({ factor: "parking",  label: "Parking (+4%)",     multiplier: 1.04 });
  if (req.has_elevator) adjs.push({ factor: "elevator", label: "Ascenseur (+3%)",   multiplier: 1.03 });
  if (req.has_terrace)  adjs.push({ factor: "terrace",  label: "Terrasse (+3%)",    multiplier: 1.03 });
  if (req.has_garden)   adjs.push({ factor: "garden",   label: "Jardin (+4%)",      multiplier: 1.04 });
  if (req.has_ac)       adjs.push({ factor: "ac",       label: "Climatisation (+2%)", multiplier: 1.02 });

  // ── Deed type ──────────────────────────────────────────────────────────
  if (req.deed) {
    const deedMult: Record<string, [number, string]> = {
      titre_bleu:  [1.05, "Titre Bleu (+5%)"],
      titre_arabe: [1.0,  ""],
      manucipe:    [0.98, "Manucipe (-2%)"],
      henchir:     [0.94, "Henchir (-6%)"],
      wakf:        [0.92, "Wakf (-8%)"],
    };
    const [m, label] = deedMult[req.deed] || [1.0, ""];
    if (m !== 1.0 && label) adjs.push({ factor: "deed", label, multiplier: m });
  }

  // ── Orientation ────────────────────────────────────────────────────────
  if (req.orientation) {
    const sunnyOrientations = ["S", "SE", "SW"];
    const shaddyOrientations = ["N"];
    if (sunnyOrientations.includes(req.orientation)) {
      adjs.push({ factor: "orientation", label: `Orientation ${req.orientation} (+3%)`, multiplier: 1.03 });
    } else if (shaddyOrientations.includes(req.orientation)) {
      adjs.push({ factor: "orientation", label: `Orientation N (-2%)`, multiplier: 0.98 });
    }
  }

  // ── Proximity bonuses ──────────────────────────────────────────────────
  if (req.beach_distance != null) {
    if (req.beach_distance < 200)       adjs.push({ factor: "beach", label: "Bord de mer (<200m) (+12%)", multiplier: 1.12 });
    else if (req.beach_distance < 500)  adjs.push({ factor: "beach", label: "Proche mer (<500m) (+7%)",   multiplier: 1.07 });
    else if (req.beach_distance < 1000) adjs.push({ factor: "beach", label: "Vue mer (<1km) (+4%)",       multiplier: 1.04 });
  }
  if (req.metro_distance != null) {
    if (req.metro_distance < 300)       adjs.push({ factor: "metro", label: "Métro à pied (<300m) (+5%)", multiplier: 1.05 });
    else if (req.metro_distance < 800)  adjs.push({ factor: "metro", label: "Proche métro (<800m) (+3%)", multiplier: 1.03 });
  }
  if (req.school_distance != null && req.school_distance < 400) {
    adjs.push({ factor: "school", label: "École proche (+2%)", multiplier: 1.02 });
  }

  return adjs;
}

// ─── Main valuation function ──────────────────────────────────────────────────
async function valuate(
  req: ValuationRequest,
  marketRows: MarketRow[],
): Promise<ValuationResult> {
  const { wilaya, type, action, area_m2 } = req;

  // Normalise type for market lookup (duplex→appartement, studio→appartement, ferme→terrain)
  const lookupType = type === "duplex" || type === "studio" ? "appartement"
                   : type === "ferme"  ? "terrain"
                   : type;

  // Find market row — exact match first, then wilaya fallback, then national median
  const exact = marketRows.find(
    r => r.wilaya === wilaya && r.property_type === lookupType && r.action === action
  );
  // Fallback: same wilaya any type, vente
  const wilayaFallback = marketRows.find(
    r => r.wilaya === wilaya && r.action === action
  );
  // National median: pick appartement vente from Tunis as floor
  const national = marketRows.find(
    r => r.wilaya === "Tunis" && r.property_type === "appartement" && r.action === "vente"
  );

  const market = exact || wilayaFallback || national;
  if (!market) throw new Error("No market data available");

  const basePriceM2 = market.avg_price_m2;

  // Apply all adjustments
  const adjustments = computeAdjustments(req);
  let adjustedPriceM2 = basePriceM2;
  for (const adj of adjustments) adjustedPriceM2 *= adj.multiplier;

  // Round to nearest 10
  adjustedPriceM2 = Math.round(adjustedPriceM2 / 10) * 10;

  const estimate = Math.round(adjustedPriceM2 * area_m2 / 100) * 100;

  // Confidence: based on exactness of market match + feature completeness
  let confidence = 0.5;
  if (exact) confidence = 0.75;
  if (exact && market.sample_size > 200) confidence = 0.85;
  if (exact && market.sample_size > 500) confidence = 0.90;
  // Boost for each feature provided
  const featuresProvided = [req.rooms, req.floor, req.deed, req.orientation,
    req.has_parking, req.has_elevator, req.beach_distance, req.metro_distance]
    .filter(v => v != null && v !== false).length;
  confidence = Math.min(confidence + featuresProvided * 0.012, 0.96);

  // AI signal: compare to listing price if provided
  let signal: ValuationResult["signal"] = null;
  let signalDeltaPct: number | null = null;
  if (req.listing_price && req.listing_price > 0) {
    const delta = (req.listing_price - estimate) / estimate;
    signalDeltaPct = Math.round(delta * 1000) / 10; // round to 1 decimal
    if (delta < -0.10)     signal = "underpriced";  // listed >10% below estimate
    else if (delta > 0.10) signal = "overpriced";   // listed >10% above estimate
    else                   signal = "fair";
  }

  return {
    estimate,
    price_per_m2: adjustedPriceM2,
    base_price_m2: basePriceM2,
    confidence: Math.round(confidence * 100) / 100,
    signal,
    signal_delta_pct: signalDeltaPct,
    adjustments,
    market_trend_12m: market.trend_12m_pct,
    sample_size: market.sample_size,
    wilaya,
    type,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ValuationRequest = await req.json();

    // Validate required fields
    if (!body.wilaya || !body.type || !body.action || !body.area_m2) {
      return new Response(JSON.stringify({ error: "Missing required fields: wilaya, type, action, area_m2" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.area_m2 < 5 || body.area_m2 > 50000) {
      return new Response(JSON.stringify({ error: "area_m2 must be between 5 and 50000" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Init Supabase client (uses service role for market_index read + listings write)
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load market index
    const { data: marketRows, error: mErr } = await sb
      .from("market_index")
      .select("wilaya, property_type, action, avg_price_m2, trend_12m_pct, sample_size");

    if (mErr || !marketRows) {
      throw new Error("Failed to load market index: " + mErr?.message);
    }

    // Run valuation
    const result = await valuate(body, marketRows as MarketRow[]);

    // Optionally persist results to listing
    if (body.listing_id) {
      await sb.from("listings").update({
        ai_estimate:    result.estimate,
        ai_price_per_m2: result.price_per_m2,
        ai_signal:      result.signal,
        ai_confidence:  result.confidence,
      }).eq("id", body.listing_id);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
