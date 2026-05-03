"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";

// ── Tunisia wilaya centroids ──────────────────────────────────────────────────
const CENTROIDS: Record<string, [number, number]> = {
  "Tunis":       [10.1815, 36.8065],
  "Ariana":      [10.1937, 36.8625],
  "Ben Arous":   [10.2218, 36.7453],
  "Manouba":     [10.0990, 36.8098],
  "Nabeul":      [10.7353, 36.4513],
  "Zaghouan":    [10.1425, 36.4027],
  "Bizerte":     [9.8642,  37.2744],
  "Béja":        [9.1817,  36.7328],
  "Jendouba":    [8.7803,  36.5013],
  "Le Kef":      [8.7145,  36.1676],
  "Siliana":     [9.3712,  36.0849],
  "Sousse":      [10.6418, 35.8288],
  "Monastir":    [10.8262, 35.7643],
  "Mahdia":      [11.0622, 35.5047],
  "Sfax":        [10.7603, 34.7400],
  "Kairouan":    [10.0963, 35.6781],
  "Kasserine":   [8.8314,  35.1723],
  "Sidi Bouzid": [9.4849,  34.9084],
  "Gabès":       [9.9987,  33.8833],
  "Médenine":    [10.5054, 33.3549],
  "Tataouine":   [10.4519, 32.9211],
  "Gafsa":       [8.7842,  34.4250],
  "Tozeur":      [8.1335,  33.9197],
  "Kébili":      [8.9715,  33.7062],
};

// ── Price → color scale (TND / m²) ───────────────────────────────────────────
const SCALE = [
  { max: 500,      color: "#F0EBE3", label: "< 500" },
  { max: 1500,     color: "#E8CC8A", label: "500 – 1 500" },
  { max: 2500,     color: "#D4AF64", label: "1 500 – 2 500" },
  { max: 4000,     color: "#B8922A", label: "2 500 – 4 000" },
  { max: Infinity, color: "#1B2B3A", label: "> 4 000" },
];

function priceToColor(pm2: number | null) {
  if (pm2 === null) return "#C8BBC0";
  for (const s of SCALE) if (pm2 < s.max) return s.color;
  return "#1B2B3A";
}
function fmtK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1000)}K`;
  return `${n}`;
}

interface Stat {
  wilaya: string;
  avgPrice: number;
  avgPriceM2: number | null;
  minPrice: number;
  maxPrice: number;
  count: number;
}

const TYPES = ["appartement","villa","terrain","bureau","duplex","studio"];

export default function AtlasClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const [action,   setAction]   = useState("all");
  const [type,     setType]     = useState("all");
  const [stats,    setStats]    = useState<Stat[]>([]);
  const [selected, setSelected] = useState<Stat | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [ready,    setReady]    = useState(false);

  // ── Fetch price data ────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (action !== "all") p.set("action", action);
    if (type   !== "all") p.set("type",   type);
    try {
      const r = await fetch(`/api/atlas?${p}`);
      const d = await r.json();
      setStats(d.stats || []);
    } catch { setStats([]); }
    finally   { setLoading(false); }
  }, [action, type]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Init MapLibre ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: [9.5, 34.5],
      zoom: 5.8,
      minZoom: 4,
      maxZoom: 13,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      map.addSource("atlas", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      // Glow
      map.addLayer({ id: "glow", type: "circle", source: "atlas",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": ["+", ["get", "r"], 12],
          "circle-opacity": 0.12,
          "circle-blur": 1.5,
        },
      });
      // Circle
      map.addLayer({ id: "bubble", type: "circle", source: "atlas",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": ["get", "r"],
          "circle-opacity": 0.88,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#FFFFFF",
        },
      });
      // Price label
      map.addLayer({ id: "price-lbl", type: "symbol", source: "atlas",
        layout: {
          "text-field": ["get", "priceLbl"],
          "text-size": 11,
          "text-font": ["Noto Sans Bold"],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": ["case", [">=", ["get", "pm2"], 2500], "#FFFFFF", "#1B2B3A"],
          "text-halo-color": "rgba(255,255,255,0.25)",
          "text-halo-width": 1,
        },
      });
      // Wilaya name
      map.addLayer({ id: "name-lbl", type: "symbol", source: "atlas",
        layout: {
          "text-field": ["get", "wilaya"],
          "text-size": 10,
          "text-font": ["Noto Sans Regular"],
          "text-anchor": "top",
          "text-offset": [0, 2],
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#1B2B3A",
          "text-opacity": 0.65,
          "text-halo-color": "rgba(255,255,255,0.9)",
          "text-halo-width": 1.5,
        },
      });

      map.on("click", "bubble", e => {
        const p = e.features?.[0]?.properties as any;
        if (!p) return;
        setSelected({ wilaya: p.wilaya, avgPrice: p.avgPrice, avgPriceM2: p.pm2 || null,
          minPrice: p.minPrice, maxPrice: p.maxPrice, count: p.count });
      });
      map.on("mouseenter", "bubble", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "bubble", () => { map.getCanvas().style.cursor = "";        });

      mapRef.current = map;
      setReady(true);
    });
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── Sync data → map ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const src = mapRef.current.getSource("atlas") as maplibregl.GeoJSONSource;
    if (!src) return;
    const maxC = Math.max(...stats.map(s => s.count), 1);
    const features = stats
      .filter(s => CENTROIDS[s.wilaya])
      .map(s => {
        const pm2   = s.avgPriceM2 ?? 0;
        const color = priceToColor(s.avgPriceM2);
        const r     = 20 + (s.count / maxC) * 38;
        const priceLbl = s.avgPriceM2 ? `${Math.round(pm2 / 100) / 10}K` : "—";
        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: CENTROIDS[s.wilaya] },
          properties: { ...s, pm2, color, r, priceLbl },
        };
      });
    src.setData({ type: "FeatureCollection", features });
  }, [stats, ready]);

  // ── Derived totals ───────────────────────────────────────────────────────────
  const totalListings = stats.reduce((a, s) => a + s.count, 0);
  const withPm2       = stats.filter(s => s.avgPriceM2);
  const avgNational   = withPm2.length
    ? Math.round(withPm2.reduce((a, s) => a + s.avgPriceM2!, 0) / withPm2.length)
    : 0;
  const priciest = [...stats].sort((a, b) => (b.avgPriceM2 ?? 0) - (a.avgPriceM2 ?? 0))[0];
  const cheapest = [...stats].filter(s => s.avgPriceM2).sort((a, b) => (a.avgPriceM2 ?? 0) - (b.avgPriceM2 ?? 0))[0];

  return (
    <div className="relative w-full h-screen bg-[#1B2B3A] overflow-hidden flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 z-30 bg-[#1B2B3A]/95 backdrop-blur-sm border-b border-[#D4AF64]/15 px-5 py-2.5 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-[#D4AF64] transition-colors mr-1">
          <span className="text-sm">🏛</span>
          <span className="text-xs font-bold tracking-widest">HESTIA</span>
          <span className="text-white/30 text-xs ml-1">/ Atlas des Prix</span>
        </Link>
        <div className="flex-1" />

        {/* Action toggle */}
        <div className="flex bg-white/8 border border-white/10 rounded-xl p-0.5 gap-0.5">
          {[["all","Tous"],["vente","Vente"],["location","Location"]].map(([v,l]) => (
            <button key={v} onClick={() => setAction(v)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all ${
                action === v ? "bg-[#D4AF64] text-[#1B2B3A] shadow" : "text-white/60 hover:text-white"
              }`}>
              {l}
            </button>
          ))}
        </div>

        {/* Type select */}
        <select value={type} onChange={e => setType(e.target.value)}
          className="bg-white/8 border border-white/10 text-white/80 text-xs rounded-xl px-3 py-2 outline-none hover:border-[#D4AF64]/40 transition-colors capitalize">
          <option value="all">Tous les types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>

        {loading && (
          <div className="w-4 h-4 border-2 border-[#D4AF64] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Map container */}
      <div className="relative flex-1">
        <div ref={containerRef} className="absolute inset-0" />

        {/* ── Summary stats strip ──────────────────────────────────────────── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-stretch divide-x divide-[#D4AF64]/20 bg-white/92 backdrop-blur-sm rounded-2xl shadow-xl border border-[#D4AF64]/20 overflow-hidden">
          {[
            { label: "Wilayas",        value: `${stats.length}` },
            { label: "Annonces",       value: `${totalListings}` },
            { label: "Moy. nationale", value: avgNational ? `${fmtK(avgNational)} TND/m²` : "—" },
            { label: "Plus cher",      value: priciest?.wilaya ?? "—", sub: priciest?.avgPriceM2 ? `${fmtK(priciest.avgPriceM2)} TND/m²` : undefined },
            { label: "Moins cher",     value: cheapest?.wilaya ?? "—", sub: cheapest?.avgPriceM2 ? `${fmtK(cheapest.avgPriceM2)} TND/m²` : undefined },
          ].map(({ label, value, sub }) => (
            <div key={label} className="flex flex-col items-center justify-center px-5 py-2.5 min-w-[100px]">
              <p className="text-[10px] text-[#9A8878] uppercase tracking-wider font-medium">{label}</p>
              <p className="text-sm font-bold text-[#1B2B3A] mt-0.5">{value}</p>
              {sub && <p className="text-[10px] text-[#D4AF64]">{sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Legend ──────────────────────────────────────────────────────── */}
        <div className="absolute bottom-10 left-5 z-20 bg-white/92 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-xl border border-[#D4AF64]/20">
          <p className="text-[10px] font-bold text-[#1B2B3A] uppercase tracking-widest mb-3">Prix / m² (TND)</p>
          <div className="space-y-2">
            {SCALE.map(s => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full shadow-sm border border-black/5 flex-shrink-0"
                  style={{ background: s.color }} />
                <span className="text-[11px] text-[#1B2B3A]/70">{s.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 pt-2 border-t border-[#D4AF64]/15 mt-2">
              <div className="flex items-center gap-0.5">
                {[12,16,20].map(sz => (
                  <div key={sz} className="rounded-full bg-[#9A8878]/50"
                    style={{ width: sz/2, height: sz/2 }} />
                ))}
              </div>
              <span className="text-[11px] text-[#1B2B3A]/60">= volume d'annonces</span>
            </div>
          </div>
        </div>

        {/* ── Wilaya detail panel ──────────────────────────────────────────── */}
        {selected && (
          <div className="absolute top-24 right-5 z-30 w-72 rounded-2xl overflow-hidden shadow-2xl border border-[#D4AF64]/20 animate-fade-up">
            {/* header */}
            <div className="bg-[#1B2B3A] px-5 py-4 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#D4AF64] tracking-widest uppercase">Wilaya</p>
                <p className="text-2xl font-display font-semibold text-white mt-0.5">{selected.wilaya}</p>
                <p className="text-xs text-white/45 mt-0.5">{selected.count} annonce{selected.count > 1 ? "s" : ""} analysée{selected.count > 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="text-white/40 hover:text-white text-2xl leading-none mt-0.5 transition-colors">
                ×
              </button>
            </div>

            {/* body */}
            <div className="bg-white px-5 py-4 space-y-0">
              {/* Big price/m² */}
              {selected.avgPriceM2 && (
                <div className="text-center py-4 border-b border-[#D4AF64]/10">
                  <p className="text-3xl font-bold text-[#D4AF64]">{fmtK(selected.avgPriceM2)}</p>
                  <p className="text-xs text-[#9A8878] mt-0.5">TND / m² en moyenne</p>
                </div>
              )}

              {/* Stats rows */}
              {[
                { label: "Prix moyen", value: `${fmtK(selected.avgPrice)} TND` },
                { label: "Min",        value: `${fmtK(selected.minPrice)} TND` },
                { label: "Max",        value: `${fmtK(selected.maxPrice)} TND` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-[#D4AF64]/8">
                  <span className="text-xs text-[#9A8878]">{label}</span>
                  <span className="text-sm font-semibold text-[#1B2B3A]">{value}</span>
                </div>
              ))}

              {/* Gradient bar */}
              {selected.avgPriceM2 && (
                <div className="py-3">
                  <div className="flex justify-between text-[10px] text-[#9A8878] mb-1.5">
                    <span>Économique</span><span>Premium</span>
                  </div>
                  <div className="relative h-2 rounded-full overflow-visible"
                    style={{ background: "linear-gradient(to right, #E8CC8A, #D4AF64, #B8922A, #1B2B3A)" }}>
                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#D4AF64] rounded-full shadow transition-all"
                      style={{ left: `${Math.min(96, Math.max(4, (selected.avgPriceM2 / 5000) * 100))}%`, transform: "translateX(-50%) translateY(-50%)" }} />
                  </div>
                </div>
              )}

              <Link href={`/listings?wilaya=${encodeURIComponent(selected.wilaya)}`}
                className="mt-3 flex items-center justify-center gap-2 w-full bg-[#1B2B3A] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#243647] transition-colors">
                Voir les annonces →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
