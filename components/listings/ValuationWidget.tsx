"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getValuation, SIGNAL_CFG, fmtPrice, type ValuationRequest, type ValuationResult } from "@/lib/valuation";

interface Props {
  request: Partial<ValuationRequest>;
  compact?: boolean;     // compact = inline card version
  className?: string;
}

// ─── Confidence bar ────────────────────────────────────────────────────────────
function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-emerald-400" : pct >= 60 ? "bg-amber-400" : "bg-navy/30";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-navy/8 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }}/>
      </div>
      <span className="text-[11px] font-semibold text-navy/50 w-10 text-right">{pct}%</span>
    </div>
  );
}

// ─── Adjustment row ────────────────────────────────────────────────────────────
function AdjRow({ label, multiplier }: { label: string; multiplier: number }) {
  const pct = ((multiplier - 1) * 100);
  const positive = pct > 0;
  return (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-navy/5 last:border-0">
      <span className="text-[12px] text-navy/70">{label.split("(")[0].trim()}</span>
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
        {positive ? "+" : ""}{pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ─── Main widget ───────────────────────────────────────────────────────────────
export default function ValuationWidget({ request, compact = false, className = "" }: Props) {
  const [result, setResult]   = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const canRun = !!(request.wilaya && request.type && request.action && request.area_m2 && request.area_m2 > 5);

  const run = useCallback(async () => {
    if (!canRun) return;
    setLoading(true);
    const r = await getValuation(request as ValuationRequest);
    setResult(r);
    setLoading(false);
  }, [request, canRun]);

  // Debounce — re-run 600ms after any prop change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!canRun) { setResult(null); return; }
    debounceRef.current = setTimeout(run, 600);
    return () => clearTimeout(debounceRef.current);
  }, [
    request.wilaya, request.type, request.action, request.area_m2,
    request.rooms, request.floor, request.deed, request.orientation,
    request.has_parking, request.has_elevator, request.has_pool,
    request.has_terrace, request.has_garden, request.has_ac,
    request.metro_distance, request.beach_distance, request.listing_price,
  ]);

  // Loading skeleton
  if (loading) {
    return (
      <div className={`animate-pulse rounded-2xl bg-navy/5 h-24 ${className}`}/>
    );
  }

  if (!canRun || !result) {
    if (!canRun && request.type) {
      return (
        <div className={`rounded-2xl border border-navy/10 bg-[#FDFAF6] p-4 text-center ${className}`}>
          <p className="text-[12px] text-cream-muted">Renseignez la wilaya, le type, l'action et la surface pour obtenir l'estimation IA 🤖</p>
        </div>
      );
    }
    return null;
  }

  const signalCfg = result.signal ? SIGNAL_CFG[result.signal] : null;

  // ── Compact version (for ListingCard / post form inline) ──────────────────
  if (compact) {
    if (!signalCfg) return null;
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-semibold ${signalCfg.bg} ${signalCfg.border} ${className}`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${signalCfg.dot}`}/>
        <span className={signalCfg.color}>{signalCfg.short}</span>
        <span className="text-[11px] font-normal opacity-60 ml-auto">
          Estimation: {fmtPrice(result.estimate)}
        </span>
      </div>
    );
  }

  // ── Full widget ────────────────────────────────────────────────────────────
  return (
    <div className={`bg-navy rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center text-2xl">🤖</div>
            <div>
              <p className="font-display text-[17px] text-cream font-semibold">Estimation Hestia IA</p>
              <p className="text-[11px] text-cream/40 mt-0.5">
                Calibré sur {result.sample_size.toLocaleString("fr-TN")} transactions · {result.wilaya}
              </p>
            </div>
          </div>
          {signalCfg && (
            <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${signalCfg.bg} ${signalCfg.color} shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${signalCfg.dot}`}/>
              {signalCfg.label}
            </span>
          )}
        </div>

        {/* Main price */}
        <p className="font-display text-[38px] text-gold font-semibold leading-none">
          {fmtPrice(result.estimate)}
        </p>
        <p className="text-cream/50 text-[13px] mt-1.5">
          {result.price_per_m2.toLocaleString("fr-TN")} TND/m² estimé
          {result.base_price_m2 !== result.price_per_m2 && (
            <span className="ml-2 text-cream/30">
              (base: {result.base_price_m2.toLocaleString("fr-TN")} TND/m²)
            </span>
          )}
        </p>

        {/* Signal delta */}
        {result.signal && result.signal_delta_pct != null && (
          <div className={`mt-3 p-3 rounded-xl ${signalCfg?.bg} border ${signalCfg?.border}`}>
            <p className={`text-[12px] font-medium ${signalCfg?.color} leading-relaxed`}>
              {result.signal === "underpriced" && `Prix demandé ${Math.abs(result.signal_delta_pct).toFixed(1)}% sous l'estimation — potentielle opportunité d'achat.`}
              {result.signal === "overpriced"  && `Prix demandé ${Math.abs(result.signal_delta_pct).toFixed(1)}% au-dessus de l'estimation — négociation possible.`}
              {result.signal === "fair"        && `Prix aligné avec le marché ${result.wilaya} ±${Math.abs(result.signal_delta_pct).toFixed(1)}%.`}
            </p>
          </div>
        )}
      </div>

      {/* Confidence + trend */}
      <div className="px-6 py-3 border-t border-white/8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-[11px] text-cream/40 font-medium uppercase tracking-wider">Niveau de confiance</span>
          {result.market_trend_12m != null && (
            <span className={`text-[11px] font-semibold flex items-center gap-1 ${result.market_trend_12m >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {result.market_trend_12m >= 0 ? "▲" : "▼"} {Math.abs(result.market_trend_12m).toFixed(1)}% /an
            </span>
          )}
        </div>
        <ConfidenceBar value={result.confidence}/>
      </div>

      {/* Adjustments (expandable) */}
      {result.adjustments.length > 0 && (
        <div className="border-t border-white/8">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-white/5 transition">
            <span className="text-[11px] text-cream/40 font-bold uppercase tracking-wider">
              {result.adjustments.length} ajustement{result.adjustments.length > 1 ? "s" : ""} appliqué{result.adjustments.length > 1 ? "s" : ""}
            </span>
            <svg className={`w-4 h-4 text-cream/30 transition-transform ${expanded ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
          {expanded && (
            <div className="px-6 pb-4 bg-white/5">
              {result.adjustments.map(adj => (
                <AdjRow key={adj.factor} label={adj.label} multiplier={adj.multiplier}/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-black/20 border-t border-white/8 flex items-center justify-between">
        <p className="text-[10px] text-cream/25 tracking-wider">Indice Hestia™ · Données marché {new Date().getFullYear()}</p>
        <p className="text-[10px] text-cream/25">Estimation non contractuelle</p>
      </div>
    </div>
  );
}
