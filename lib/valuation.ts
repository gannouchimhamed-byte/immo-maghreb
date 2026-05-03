// Hestia AI Valuation — client-side SDK
// Calls the Supabase Edge Function /functions/v1/valuate

export interface ValuationRequest {
  wilaya: string;
  type: string;
  action: string;
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
  listing_price?: number | null;
  listing_id?: string | null;
}

export interface ValuationResult {
  estimate: number;
  price_per_m2: number;
  base_price_m2: number;
  confidence: number;
  signal: "underpriced" | "fair" | "overpriced" | null;
  signal_delta_pct: number | null;
  adjustments: { factor: string; label: string; multiplier: number }[];
  market_trend_12m: number | null;
  sample_size: number;
  wilaya: string;
  type: string;
}

const EDGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/valuate`;
const ANON_KEY  =  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getValuation(req: ValuationRequest): Promise<ValuationResult | null> {
  try {
    const res = await fetch(EDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(req),
    });
    if (!res.ok) { console.error("Valuation error", await res.text()); return null; }
    return res.json() as Promise<ValuationResult>;
  } catch (e) {
    console.error("Valuation fetch error", e);
    return null;
  }
}

export const SIGNAL_CFG = {
  underpriced: { label: "Sous-évalué",  short: "✓ Sous-évalué", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", desc: "Le prix demandé est inférieur à l'estimation du marché — opportunité d'achat." },
  fair:        { label: "Juste prix",   short: "Juste prix",    color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-500",   desc: "Le prix est aligné avec les données du marché Hestia." },
  overpriced:  { label: "Sur-évalué",   short: "⚠ Sur-évalué",  color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",     dot: "bg-rose-500",    desc: "Le prix demandé est au-dessus de l'estimation du marché." },
};

export function fmtPrice(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M TND`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)} 000 TND`;
  return `${n.toLocaleString("fr-TN")} TND`;
}
