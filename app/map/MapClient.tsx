"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import CommuteFilter from "@/components/commute/CommuteFilter";
import { generateCircleGeoJSON, isWithinCommute } from "@/lib/commute";
import type { CommuteState } from "@/lib/commute";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MapListing {
  id: string; title: string; price: number; area_m2: number;
  rooms: number | null; action: string; type: string;
  wilaya: string | null; district: string | null;
  lat: number; lng: number;
  primary_image_url: string | null;
  ai_signal: "underpriced" | "fair" | "overpriced" | null;
  is_featured: boolean; is_verified: boolean;
  has_parking: boolean; has_elevator: boolean;
}
interface MapFilters {
  action: string; type: string; wilaya: string;
  minPrice: number | ""; maxPrice: number | ""; rooms: number | "";
}
interface Props { listings: MapListing[]; initialFilters: MapFilters; }

// ─── Constants ────────────────────────────────────────────────────────────────
// Free CARTO Voyager tile style — no API key required
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

const WILAYAS = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan","Bizerte","Béja","Jendouba","Le Kef","Siliana","Kairouan","Kasserine","Sidi Bouzid","Sousse","Monastir","Mahdia","Sfax","Gafsa","Tozeur","Kébili","Gabès","Médenine","Tataouine"];
const TYPES = [{v:"appartement",l:"Appartement"},{v:"villa",l:"Villa"},{v:"terrain",l:"Terrain"},{v:"bureau",l:"Bureau"},{v:"duplex",l:"Duplex"},{v:"studio",l:"Studio"}];
const AI_CFG = {
  underpriced: { dot:"#10b981", label:"Sous-évalué" },
  fair:        { dot:"#f59e0b", label:"Juste prix"  },
  overpriced:  { dot:"#ef4444", label:"Sur-évalué"  },
};
const BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

// ─── Format helpers ────────────────────────────────────────────────────────────
const fmtPrice = (p: number, a: string) => {
  if (a === "location") return `${p.toLocaleString("fr-TN")} TND/mois`;
  if (p >= 1_000_000)   return `${(p / 1_000_000).toFixed(2)}M TND`;
  if (p >= 1_000)       return `${(p / 1_000).toFixed(0)}K TND`;
  return `${p.toLocaleString("fr-TN")} TND`;
};
const fmtPriceShort = (p: number) => {
  if (p >= 1_000_000) return `${(p/1_000_000).toFixed(1)}M`;
  if (p >= 1_000)     return `${Math.round(p/1_000)}K`;
  return `${p}`;
};

// ─── List Card ────────────────────────────────────────────────────────────────
function ListCard({ l, active, onClick }: { l: MapListing; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className={`flex gap-3 p-3 cursor-pointer transition-all border-b border-navy/8 hover:bg-cream/80 ${
        active ? "bg-gold/8 border-l-[3px] border-l-gold" : "border-l-[3px] border-l-transparent"
      }`}>
      <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 relative bg-navy/5">
        {l.primary_image_url ? (
          <Image src={l.primary_image_url} alt={l.title} fill className="object-cover"
            placeholder="blur" blurDataURL={BLUR} sizes="80px"/>
        ) : <div className="w-full h-full flex items-center justify-center text-xl opacity-20">🏛</div>}
        {l.is_featured && <span className="absolute top-1 left-1 text-[8px] font-bold bg-gold text-navy px-1 rounded">★</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="font-display text-[15px] font-semibold text-navy leading-tight">{fmtPrice(l.price, l.action)}</p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${l.action==="vente"?"bg-navy text-gold":"bg-gold text-navy"}`}>
            {l.action==="vente"?"VENTE":"LOC"}
          </span>
        </div>
        <p className="text-[12px] text-navy/70 line-clamp-1 mt-0.5">{l.title}</p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-cream-muted">
          <span className="font-medium text-navy/60">{l.area_m2}m²</span>
          {l.rooms && <><span>·</span><span>{l.rooms}p</span></>}
          {(l.district||l.wilaya) && <><span>·</span><span className="truncate">{l.district||l.wilaya}</span></>}
        </div>
        {l.ai_signal && (
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{background:AI_CFG[l.ai_signal].dot}}/>
            <span className="text-[10px]" style={{color:AI_CFG[l.ai_signal].dot}}>{AI_CFG[l.ai_signal].label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Popup Card ───────────────────────────────────────────────────────────────
function PopupCard({ l, onClose }: { l: MapListing; onClose: () => void }) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-72 bg-[#FDFAF6] rounded-2xl shadow-2xl overflow-hidden border border-navy/10 animate-fade-up">
      <button onClick={onClose}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-navy/80 text-cream text-xs flex items-center justify-center hover:bg-navy transition">✕</button>
      <div className="relative h-36 bg-navy/5">
        {l.primary_image_url
          ? <Image src={l.primary_image_url} alt={l.title} fill className="object-cover" placeholder="blur" blurDataURL={BLUR} sizes="288px"/>
          : <div className="w-full h-full flex items-center justify-center text-5xl opacity-10">🏛</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent"/>
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <p className="font-display text-[18px] text-cream font-semibold leading-none">{fmtPrice(l.price, l.action)}</p>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${l.action==="vente"?"bg-navy text-gold":"bg-gold text-navy"}`}>
            {l.action==="vente"?"Vente":"Location"}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-[13px] font-semibold text-navy line-clamp-2 mb-2">{l.title}</p>
        <div className="flex items-center gap-3 text-[12px] text-cream-muted mb-2">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gold" viewBox="0 0 12 12" fill="currentColor"><path d="M1 11V4L6 1l5 3v7H8V7H4v4H1z"/></svg>
            {l.area_m2}m²
          </span>
          {l.rooms && <span>{l.rooms} pièces</span>}
          {(l.district||l.wilaya) && <span className="truncate">{l.district||l.wilaya}</span>}
        </div>
        <div className="flex gap-1.5 mb-3">
          {l.ai_signal && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{background:`${AI_CFG[l.ai_signal].dot}18`,color:AI_CFG[l.ai_signal].dot}}>
              <span className="w-1.5 h-1.5 rounded-full" style={{background:AI_CFG[l.ai_signal].dot}}/>
              {AI_CFG[l.ai_signal].label}
            </span>
          )}
          {l.is_verified && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-navy">★ Vérifié</span>}
          {l.has_parking && <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy/5 text-navy/60">🅿</span>}
          {l.has_elevator && <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy/5 text-navy/60">⬆</span>}
        </div>
        <Link href={`/listings/${l.id}`}
          className="block w-full text-center py-2.5 rounded-xl bg-navy text-gold text-[13px] font-bold hover:bg-navy/90 transition no-underline">
          Voir le détail →
        </Link>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, count }: { filters: MapFilters; onChange:(f:MapFilters)=>void; count:number; }) {
  const upd = (k: keyof MapFilters, v: any) => onChange({...filters,[k]:v});
  const hasFilters = !!(filters.action||filters.type||filters.wilaya||filters.minPrice||filters.maxPrice||filters.rooms);
  const SEL_STYLE = {
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,
    backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center",backgroundSize:"14px",paddingRight:"28px"
  };

  return (
    <div className="bg-[#FDFAF6] border-b border-navy/10 px-4 py-3 flex flex-wrap items-center gap-2 shrink-0">
      {/* Transaction */}
      <div className="flex rounded-lg border border-navy/15 overflow-hidden text-[12px] font-semibold">
        {[{v:"",l:"Tous"},{v:"vente",l:"Vente"},{v:"location",l:"Location"}].map(a=>(
          <button key={a.v} onClick={()=>upd("action",a.v)}
            className={`px-3 py-1.5 transition-colors ${filters.action===a.v?"bg-navy text-gold":"text-cream-muted hover:bg-cream"}`}>{a.l}</button>
        ))}
      </div>

      <select value={filters.type} onChange={e=>upd("type",e.target.value)}
        className="h-[34px] px-3 rounded-lg border border-navy/15 text-[12px] text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold/40 appearance-none" style={SEL_STYLE}>
        <option value="">Tous les types</option>
        {TYPES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
      </select>

      <select value={filters.wilaya} onChange={e=>upd("wilaya",e.target.value)}
        className="h-[34px] px-3 rounded-lg border border-navy/15 text-[12px] text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold/40 appearance-none" style={SEL_STYLE}>
        <option value="">Toutes les wilayas</option>
        {WILAYAS.map(w=><option key={w} value={w}>{w}</option>)}
      </select>

      <input type="number" placeholder="Prix min" value={filters.minPrice||""}
        onChange={e=>upd("minPrice",e.target.value?Number(e.target.value):"")}
        className="h-[34px] w-24 px-3 rounded-lg border border-navy/15 text-[12px] focus:outline-none focus:ring-2 focus:ring-gold/40"/>

      <input type="number" placeholder="Prix max" value={filters.maxPrice||""}
        onChange={e=>upd("maxPrice",e.target.value?Number(e.target.value):"")}
        className="h-[34px] w-24 px-3 rounded-lg border border-navy/15 text-[12px] focus:outline-none focus:ring-2 focus:ring-gold/40"/>

      <div className="flex gap-1">
        {["",1,2,3,4].map(n=>(
          <button key={n} onClick={()=>upd("rooms",n)}
            className={`h-[34px] w-9 rounded-lg text-[12px] font-semibold border transition-all ${filters.rooms===n?"bg-navy text-gold border-navy":"bg-white text-cream-muted border-navy/15 hover:border-navy/30"}`}>
            {n===""?"∞":n===4?"4+":n}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-[12px] text-cream-muted font-medium">{count} bien{count!==1?"s":""}</span>
        {hasFilters && (
          <button onClick={()=>onChange({action:"",type:"",wilaya:"",minPrice:"",maxPrice:"",rooms:""})}
            className="text-[11px] text-rose-500 hover:underline">Effacer</button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MapClient({ listings, initialFilters }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filters, setFilters] = useState<MapFilters>(initialFilters);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [popup, setPopup] = useState<MapListing | null>(null);
  const [mobileTab, setMobileTab] = useState<"map"|"list">("map");
  const [searchArea, setSearchArea] = useState(false);
  const [commute, setCommute] = useState<CommuteState | null>(null);
  const [showCommutePanel, setShowCommutePanel] = useState(false);

  // Client-side filter + commute filter
  const filtered = listings.filter(l => {
    if (filters.action && l.action !== filters.action) return false;
    if (filters.type && l.type !== filters.type) return false;
    if (filters.wilaya && l.wilaya !== filters.wilaya) return false;
    if (filters.minPrice && l.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false;
    if (filters.rooms && (l.rooms===null || l.rooms < Number(filters.rooms))) return false;
    if (commute && !isWithinCommute(l.lat, l.lng, commute)) return false;
    return true;
  });

  // ── Init MapLibre ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    import("maplibre-gl").then(mod => {
      const maplibregl = mod.default;

      const map = new maplibregl.Map({
        container: mapContainerRef.current!,
        style: MAP_STYLE,
        center: [10.18, 36.81],
        zoom: 7,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(
        new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
        "top-right"
      );
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

      map.on("load", () => setMapLoaded(true));
      map.on("moveend", () => setSearchArea(true));
      map.on("click", (e: any) => {
        const features = map.queryRenderedFeatures(e.point);
        if (!features.length) { setPopup(null); setActiveId(null); }
      });

      mapRef.current = map;
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // ── Render markers whenever filtered set changes ───────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    import("maplibre-gl").then(mod => {
      const maplibregl = mod.default;

      // Remove old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      filtered.forEach(l => {
        const isActive = l.id === activeId;
        const bgColor   = l.is_featured ? "#D4AF64" : "#1B2B3A";
        const textColor = l.is_featured ? "#1B2B3A" : "#D4AF64";
        const aiColor   = l.ai_signal === "underpriced" ? "#10b981"
                        : l.ai_signal === "overpriced"  ? "#ef4444"
                        : "#D4AF64";

        const el = document.createElement("div");
        el.style.cssText = "cursor:pointer;";
        el.innerHTML = `
          <div style="
            background:${bgColor};color:${textColor};
            font-family:Inter,sans-serif;font-size:11px;font-weight:700;
            padding:5px 9px;border-radius:20px;white-space:nowrap;
            box-shadow:${isActive
              ? "0 0 0 3px #D4AF64,0 4px 14px rgba(0,0,0,0.28)"
              : "0 2px 8px rgba(0,0,0,0.22)"};
            transform:${isActive?"scale(1.18)":"scale(1)"};
            transition:transform 0.15s ease,box-shadow 0.15s ease;
            display:flex;align-items:center;gap:4px;
            border:${isActive?"2px solid #D4AF64":"2px solid transparent"};
          ">
            ${l.ai_signal?`<span style="width:6px;height:6px;border-radius:50%;background:${aiColor};display:inline-block;flex-shrink:0;"></span>`:""}
            ${fmtPriceShort(l.price)}
          </div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${bgColor};margin:0 auto;margin-top:-1px;"></div>
        `;

        el.addEventListener("mouseenter", () => {
          const div = el.querySelector("div") as HTMLElement;
          if (div) div.style.transform = "scale(1.1)";
        });
        el.addEventListener("mouseleave", () => {
          if (l.id !== activeId) {
            const div = el.querySelector("div") as HTMLElement;
            if (div) div.style.transform = "scale(1)";
          }
        });
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setActiveId(l.id);
          setPopup(l);
          mapRef.current?.flyTo({ center: [l.lng, l.lat], zoom: Math.max(mapRef.current.getZoom(), 13), duration: 700 });
        });

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([l.lng, l.lat])
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, activeId, mapLoaded, filters.action, filters.type, filters.wilaya, filters.minPrice, filters.maxPrice, filters.rooms]);

  // ── Draw / update isochrone circle when commute changes ───────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    const SOURCE_ID = "commute-circle";
    const FILL_ID   = "commute-fill";
    const LINE_ID   = "commute-line";
    const PIN_ID    = "commute-pin";

    // Remove old layers + source
    if (map.getLayer(FILL_ID)) map.removeLayer(FILL_ID);
    if (map.getLayer(LINE_ID)) map.removeLayer(LINE_ID);
    if (map.getLayer(PIN_ID))  map.removeLayer(PIN_ID);
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);

    if (!commute) return;

    import("@/lib/commute").then(({ commuteRadiusKm, generateCircleGeoJSON }) => {
      const radius = commuteRadiusKm(commute.mode, commute.maxMinutes);
      const circleFeature = generateCircleGeoJSON(commute.lat, commute.lng, radius);
      const pinFeature = {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [commute.lng, commute.lat] },
        properties: {},
      };

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [circleFeature, pinFeature] },
      });

      // Semi-transparent fill
      map.addLayer({
        id: FILL_ID, type: "fill", source: SOURCE_ID,
        filter: ["==", "$type", "Polygon"],
        paint: { "fill-color": "#D4AF64", "fill-opacity": 0.10 },
      });

      // Gold border
      map.addLayer({
        id: LINE_ID, type: "line", source: SOURCE_ID,
        filter: ["==", "$type", "Polygon"],
        paint: { "line-color": "#D4AF64", "line-width": 2, "line-dasharray": [4, 3], "line-opacity": 0.7 },
      });

      // Center pin (destination)
      map.addLayer({
        id: PIN_ID, type: "circle", source: SOURCE_ID,
        filter: ["==", "$type", "Point"],
        paint: { "circle-radius": 7, "circle-color": "#D4AF64", "circle-stroke-width": 3, "circle-stroke-color": "#1B2B3A" },
      });

      // Fly to destination
      map.flyTo({ center: [commute.lng, commute.lat], zoom: Math.max(10, 13 - Math.log2(radius)), duration: 1000 });
    });
  }, [commute, mapLoaded]);
  const fitBounds = useCallback(() => {
    if (!mapRef.current || filtered.length === 0) return;
    import("maplibre-gl").then(mod => {
      const maplibregl = mod.default;
      const bounds = new maplibregl.LngLatBounds();
      filtered.forEach(l => bounds.extend([l.lng, l.lat]));
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 900 });
    });
  }, [filtered]);

  useEffect(() => {
    if (mapLoaded && filtered.length > 0) setTimeout(fitBounds, 400);
  }, [mapLoaded]);

  const handleListClick = useCallback((l: MapListing) => {
    setActiveId(l.id);
    setPopup(l);
    setMobileTab("map");
    mapRef.current?.flyTo({ center: [l.lng, l.lat], zoom: 15, duration: 900 });
  }, []);

  return (
    <>
      <Navbar />
      <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>

        {/* Filter bar */}
        <FilterBar filters={filters} onChange={setFilters} count={filtered.length} />

        {/* Commute toggle button (sits on filter bar right side on desktop) */}
        <div className="hidden sm:flex absolute right-4 top-[68px] z-20">
          <button onClick={() => setShowCommutePanel(p => !p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-semibold shadow-lg transition-all ${
              commute
                ? "bg-navy text-gold border-navy"
                : "bg-[#FDFAF6] text-navy border-navy/20 hover:border-navy/40"
            }`}>
            ⏱
            {commute ? `Trajet · ${commute.maxMinutes}min` : "Temps de trajet"}
            {commute && (
              <button onClick={(e) => { e.stopPropagation(); setCommute(null); setShowCommutePanel(false); }}
                className="w-4 h-4 rounded-full bg-white/20 hover:bg-rose-400 flex items-center justify-center ml-1 transition-colors">
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden flex border-b border-navy/10 bg-[#FDFAF6] shrink-0">
          {(["map","list"] as const).map(tab => (
            <button key={tab} onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2.5 text-[13px] font-semibold transition-colors ${mobileTab===tab?"border-b-2 border-gold text-navy":"text-cream-muted"}`}>
              {tab==="map" ? "🗺 Carte" : `📋 Liste (${filtered.length})`}
            </button>
          ))}
        </div>

        {/* Split layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LIST (left) ────────────────────────────────────────────── */}
          <div className={`w-full lg:w-[380px] shrink-0 border-r border-navy/10 bg-[#FDFAF6] flex-col ${mobileTab==="list"?"flex":"hidden lg:flex"}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-navy/8 shrink-0">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-cream-muted">
                  {filtered.length} bien{filtered.length!==1?"s":""}
                </p>
                {commute && (
                  <p className="text-[10px] text-gold mt-0.5">⏱ {commute.maxMinutes} min · {commute.address.split(",")[0]}</p>
                )}
              </div>
              <button onClick={fitBounds} className="text-[11px] text-gold hover:underline font-medium flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="7" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="1" y="7" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="7" y="7" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                Vue globale
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
                <div className="w-14 h-14 rounded-full bg-navy/5 flex items-center justify-center mb-3 text-2xl">📍</div>
                <p className="font-display text-[16px] text-navy font-semibold mb-1">Aucun bien trouvé</p>
                <p className="text-[12px] text-cream-muted mb-4">Modifiez les filtres</p>
                <button onClick={() => setFilters({action:"",type:"",wilaya:"",minPrice:"",maxPrice:"",rooms:""})}
                  className="px-4 py-2 rounded-lg bg-navy text-gold text-[12px] font-semibold">
                  Effacer les filtres
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {filtered.map(l => (
                  <ListCard key={l.id} l={l} active={activeId===l.id} onClick={() => handleListClick(l)} />
                ))}
              </div>
            )}

            <div className="shrink-0 p-3 border-t border-navy/8 bg-cream">
              <Link href={`/listings?action=${filters.action}&wilaya=${filters.wilaya}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-navy text-gold text-[12px] font-bold hover:bg-navy/90 transition no-underline">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
                  <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
                </svg>
                Voir en grille
              </Link>
            </div>
          </div>

          {/* ── MAP (right) ─────────────────────────────────────────────── */}
          <div className={`flex-1 relative ${mobileTab==="map"?"block":"hidden lg:block"}`}>

            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Loading */}
            {!mapLoaded && (
              <div className="absolute inset-0 bg-cream flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin"/>
                  <p className="text-[13px] text-cream-muted font-medium">Chargement de la carte…</p>
                </div>
              </div>
            )}

            {/* Commute panel */}
            {showCommutePanel && (
              <div className="absolute top-4 left-4 z-20 animate-fade-up">
                <CommuteFilter
                  value={commute}
                  onChange={(v) => { setCommute(v); if (!v) setShowCommutePanel(false); }}
                  compact={false}
                />
              </div>
            )}

            {/* Search this area */}
            {searchArea && mapLoaded && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <button onClick={() => setSearchArea(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FDFAF6] border border-navy/15 shadow-lg text-[12px] font-semibold text-navy hover:bg-cream transition-all animate-fade-up">
                  <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Rechercher dans cette zone
                </button>
              </div>
            )}

            {/* AI legend */}
            {mapLoaded && (
              <div className="absolute bottom-8 right-4 z-20 bg-[#FDFAF6]/95 backdrop-blur-sm rounded-xl border border-navy/10 px-3 py-2.5 shadow-lg">
                <p className="text-[9px] font-bold uppercase tracking-widest text-cream-muted mb-2">Signal IA</p>
                {[{color:"#10b981",label:"Sous-évalué"},{color:"#f59e0b",label:"Juste prix"},{color:"#ef4444",label:"Sur-évalué"}].map(i=>(
                  <div key={i.label} className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{background:i.color}}/>
                    <span className="text-[10px] text-navy/70">{i.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 border-t border-navy/8 pt-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-gold"/>
                  <span className="text-[10px] text-navy/70">Bien vedette</span>
                </div>
              </div>
            )}

            {/* Property popup */}
            {popup && (
              <PopupCard l={popup} onClose={() => { setPopup(null); setActiveId(null); }}/>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .maplibregl-ctrl-group { background:#FDFAF6!important; border:0.5px solid rgba(27,43,58,0.15)!important; border-radius:8px!important; box-shadow:0 2px 8px rgba(0,0,0,0.1)!important; }
        .maplibregl-ctrl-group button { background:transparent!important; }
        .maplibregl-ctrl-group button:hover { background:#F7F3EE!important; }
        .maplibregl-ctrl-attrib { background:rgba(253,250,246,0.85)!important; border-radius:6px!important; font-size:10px!important; }
      `}</style>
    </>
  );
}
