"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (p: number, a: string) => {
  if (a === "location") return `${p.toLocaleString("fr-TN")} TND/mois`;
  if (p >= 1_000_000)   return `${(p / 1_000_000).toFixed(2)}M TND`;
  if (p >= 1_000)       return `${(p / 1_000).toFixed(0)}K TND`;
  return `${p.toLocaleString("fr-TN")} TND`;
};

const WILAYAS = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Sousse","Monastir","Sfax","Gabès","Bizerte","Zaghouan","Béja","Jendouba","Le Kef","Siliana","Kairouan","Kasserine","Sidi Bouzid","Mahdia","Gafsa","Tozeur","Kébili","Médenine","Tataouine"];
const TYPES   = [{v:"appartement",l:"Appartement"},{v:"villa",l:"Villa"},{v:"terrain",l:"Terrain"},{v:"bureau",l:"Bureau"},{v:"duplex",l:"Duplex"},{v:"studio",l:"Studio"}];

const AI_CFG = {
  underpriced: { dot: "#10b981", label: "Sous-évalué" },
  fair:        { dot: "#f59e0b", label: "Juste prix" },
  overpriced:  { dot: "#ef4444", label: "Sur-évalué" },
};

const BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

// ─── Listing Card (list panel) ─────────────────────────────────────────────────
function ListCard({ l, active, onClick }: { l: MapListing; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 p-3 cursor-pointer transition-all border-b border-navy/8 hover:bg-cream ${active ? "bg-gold/8 border-l-2 border-l-gold" : ""}`}
    >
      {/* Thumbnail */}
      <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-navy/5 relative">
        {l.primary_image_url ? (
          <Image src={l.primary_image_url} alt={l.title} fill className="object-cover"
            placeholder="blur" blurDataURL={BLUR} sizes="80px"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">🏛</div>
        )}
        {l.is_featured && (
          <span className="absolute top-1 left-1 text-[8px] font-bold bg-gold text-navy px-1 py-0.5 rounded">★</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Price */}
        <div className="flex items-start justify-between gap-1">
          <p className="font-display text-[15px] font-semibold text-navy leading-tight truncate">
            {fmtPrice(l.price, l.action)}
          </p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${l.action === "vente" ? "bg-navy text-gold" : "bg-gold text-navy"}`}>
            {l.action === "vente" ? "VENTE" : "LOC"}
          </span>
        </div>

        {/* Title */}
        <p className="text-[12px] text-navy/70 leading-snug line-clamp-1 mt-0.5">{l.title}</p>

        {/* Specs row */}
        <div className="flex items-center gap-2 mt-1 text-[11px] text-cream-muted">
          <span className="font-medium text-navy/60">{l.area_m2}m²</span>
          {l.rooms && <><span>·</span><span>{l.rooms} p.</span></>}
          {l.district && <><span>·</span><span className="truncate">{l.district}</span></>}
          {!l.district && l.wilaya && <><span>·</span><span>{l.wilaya}</span></>}
        </div>

        {/* AI signal */}
        {l.ai_signal && (
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: AI_CFG[l.ai_signal].dot }}/>
            <span className="text-[10px]" style={{ color: AI_CFG[l.ai_signal].dot }}>{AI_CFG[l.ai_signal].label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Popup Card ───────────────────────────────────────────────────────────────
function PopupCard({ l, onClose }: { l: MapListing; onClose: () => void }) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-72 bg-[#FDFAF6] rounded-2xl shadow-2xl overflow-hidden border border-navy/10 animate-fade-up">
      {/* Close */}
      <button onClick={onClose}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-navy/80 text-cream flex items-center justify-center text-xs hover:bg-navy transition">
        ✕
      </button>

      {/* Image */}
      <div className="relative h-36 w-full bg-navy/5">
        {l.primary_image_url ? (
          <Image src={l.primary_image_url} alt={l.title} fill className="object-cover"
            placeholder="blur" blurDataURL={BLUR} sizes="288px"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-10">🏛</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent"/>
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <p className="font-display text-[18px] text-cream font-semibold leading-none">
            {fmtPrice(l.price, l.action)}
          </p>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${l.action === "vente" ? "bg-navy text-gold" : "bg-gold text-navy"}`}>
            {l.action === "vente" ? "Vente" : "Location"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-[13px] font-semibold text-navy leading-snug line-clamp-2 mb-2">{l.title}</p>

        {/* Specs */}
        <div className="flex items-center gap-3 text-[12px] text-cream-muted mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gold" viewBox="0 0 12 12" fill="currentColor"><path d="M1 11V4L6 1l5 3v7H8V7H4v4H1z"/></svg>
            {l.area_m2}m²
          </span>
          {l.rooms && <span>{l.rooms} pièces</span>}
          {(l.district || l.wilaya) && (
            <span className="flex items-center gap-1 truncate">
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0C3.79 0 2 1.79 2 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z"/></svg>
              {l.district || l.wilaya}
            </span>
          )}
        </div>

        {/* AI badge + verified */}
        <div className="flex items-center gap-2 mb-3">
          {l.ai_signal && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: `${AI_CFG[l.ai_signal].dot}18`, color: AI_CFG[l.ai_signal].dot }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: AI_CFG[l.ai_signal].dot }}/>
              {AI_CFG[l.ai_signal].label}
            </span>
          )}
          {l.is_verified && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-navy">★ Vérifié</span>
          )}
        </div>

        {/* Amenities */}
        <div className="flex gap-1.5 mb-3">
          {l.has_parking  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy/5 text-navy/60">🅿 Parking</span>}
          {l.has_elevator && <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy/5 text-navy/60">⬆ Ascenseur</span>}
        </div>

        {/* CTA */}
        <Link href={`/listings/${l.id}`}
          className="block w-full text-center py-2.5 rounded-xl bg-navy text-gold text-[13px] font-bold hover:bg-navy/90 transition no-underline">
          Voir le détail →
        </Link>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, count }: {
  filters: MapFilters; onChange: (f: MapFilters) => void; count: number;
}) {
  const upd = (k: keyof MapFilters, v: any) => onChange({ ...filters, [k]: v });
  return (
    <div className="bg-[#FDFAF6] border-b border-navy/10 px-4 py-3 flex flex-wrap items-center gap-2">
      {/* Action */}
      <div className="flex rounded-lg border border-navy/15 overflow-hidden text-[12px] font-semibold">
        {[{v:"",l:"Tous"},{v:"vente",l:"Vente"},{v:"location",l:"Location"}].map(a => (
          <button key={a.v} onClick={() => upd("action", a.v)}
            className={`px-3 py-1.5 transition-colors ${filters.action === a.v ? "bg-navy text-gold" : "text-cream-muted hover:bg-cream"}`}>
            {a.l}
          </button>
        ))}
      </div>

      {/* Type */}
      <select value={filters.type} onChange={e => upd("type", e.target.value)}
        className="h-[34px] px-3 rounded-lg border border-navy/15 text-[12px] text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold/40 appearance-none"
        style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center",backgroundSize:"14px",paddingRight:"28px"}}>
        <option value="">Tous les types</option>
        {TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
      </select>

      {/* Wilaya */}
      <select value={filters.wilaya} onChange={e => upd("wilaya", e.target.value)}
        className="h-[34px] px-3 rounded-lg border border-navy/15 text-[12px] text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold/40 appearance-none"
        style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center",backgroundSize:"14px",paddingRight:"28px"}}>
        <option value="">Toutes les wilayas</option>
        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
      </select>

      {/* Min price */}
      <input type="number" placeholder="Prix min" value={filters.minPrice || ""}
        onChange={e => upd("minPrice", e.target.value ? Number(e.target.value) : "")}
        className="h-[34px] w-28 px-3 rounded-lg border border-navy/15 text-[12px] text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"/>

      {/* Max price */}
      <input type="number" placeholder="Prix max" value={filters.maxPrice || ""}
        onChange={e => upd("maxPrice", e.target.value ? Number(e.target.value) : "")}
        className="h-[34px] w-28 px-3 rounded-lg border border-navy/15 text-[12px] text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"/>

      {/* Rooms */}
      <div className="flex gap-1">
        {["",1,2,3,4].map(n => (
          <button key={n} onClick={() => upd("rooms", n)}
            className={`h-[34px] w-9 rounded-lg text-[12px] font-semibold border transition-all ${filters.rooms === n ? "bg-navy text-gold border-navy" : "bg-white text-cream-muted border-navy/15 hover:border-navy/30"}`}>
            {n === "" ? "∞" : n === 4 ? "4+" : n}
          </button>
        ))}
      </div>

      {/* Count badge */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-[12px] text-cream-muted font-medium">
          {count} bien{count !== 1 ? "s" : ""}
        </span>
        {(filters.action || filters.type || filters.wilaya || filters.minPrice || filters.maxPrice || filters.rooms) && (
          <button onClick={() => onChange({ action:"", type:"", wilaya:"", minPrice:"", maxPrice:"", rooms:"" })}
            className="text-[11px] text-rose-500 hover:underline">
            Effacer
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Map Client ──────────────────────────────────────────────────────────
export default function MapClient({ listings: initialListings, initialFilters }: Props) {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxError, setMapboxError] = useState(false);
  const [filters, setFilters] = useState<MapFilters>(initialFilters);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [popupListing, setPopupListing] = useState<MapListing | null>(null);
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");
  const [searchThisArea, setSearchThisArea] = useState(false);
  const [listings, setListings] = useState<MapListing[]>(initialListings);

  const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // ── Filter listings client-side ──────────────────────────────────────────
  const filtered = listings.filter(l => {
    if (filters.action && l.action !== filters.action) return false;
    if (filters.type && l.type !== filters.type) return false;
    if (filters.wilaya && l.wilaya !== filters.wilaya) return false;
    if (filters.minPrice && l.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false;
    if (filters.rooms && (l.rooms === null || l.rooms < Number(filters.rooms))) return false;
    return true;
  });

  // ── Init Mapbox ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!TOKEN) { setMapboxError(true); return; }

    let mapboxgl: any;
    import("mapbox-gl").then(mod => {
      mapboxgl = mod.default;
      mapboxgl.accessToken = TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: [10.18, 36.81],
        zoom: 7,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), "top-right");

      map.on("load", () => {
        setMapLoaded(true);
        // Custom map style tweaks
        map.setPaintProperty("land", "background-color", "#F7F3EE");
        map.setPaintProperty("water", "fill-color", "#c8d8e8");
      });

      map.on("moveend", () => setSearchThisArea(true));

      mapRef.current = map;
    }).catch(() => setMapboxError(true));

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [TOKEN]);

  // ── Add/update markers when filtered listings change ──────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    let mapboxgl: any;

    import("mapbox-gl").then(mod => {
      mapboxgl = mod.default;

      // Remove old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      filtered.forEach(l => {
        // Create custom marker element
        const el = document.createElement("div");
        el.className = "hestia-marker";

        const isActive = l.id === activeId;
        const aiColor = l.ai_signal === "underpriced" ? "#10b981" : l.ai_signal === "overpriced" ? "#ef4444" : "#D4AF64";
        const bgColor = l.is_featured ? "#D4AF64" : "#1B2B3A";
        const textColor = l.is_featured ? "#1B2B3A" : "#D4AF64";

        const priceLabel = l.price >= 1_000_000
          ? `${(l.price / 1_000_000).toFixed(1)}M`
          : l.price >= 1_000
          ? `${Math.round(l.price / 1_000)}K`
          : `${l.price}`;

        el.innerHTML = `
          <div style="
            background:${bgColor};
            color:${textColor};
            font-family:'Inter',sans-serif;
            font-size:11px;
            font-weight:700;
            padding:5px 9px;
            border-radius:20px;
            white-space:nowrap;
            box-shadow:${isActive ? "0 0 0 3px #D4AF64,0 4px 12px rgba(0,0,0,0.25)" : "0 2px 8px rgba(0,0,0,0.20)"};
            cursor:pointer;
            transition:transform 0.15s ease, box-shadow 0.15s ease;
            transform:${isActive ? "scale(1.15)" : "scale(1)"};
            display:flex;align-items:center;gap:4px;
            border:${isActive ? "2px solid #D4AF64" : "none"};
          ">
            ${l.ai_signal ? `<span style="width:6px;height:6px;border-radius:50%;background:${aiColor};display:inline-block;"></span>` : ""}
            ${priceLabel}
          </div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${bgColor};margin:0 auto;"></div>
        `;

        el.addEventListener("click", () => {
          setActiveId(l.id);
          setPopupListing(l);
          mapRef.current?.flyTo({ center: [l.lng, l.lat], zoom: Math.max(mapRef.current.getZoom(), 13), duration: 600 });
        });

        el.addEventListener("mouseenter", () => {
          el.querySelector("div")!.style.transform = "scale(1.1)";
        });
        el.addEventListener("mouseleave", () => {
          if (l.id !== activeId) (el.querySelector("div") as HTMLElement)!.style.transform = "scale(1)";
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([l.lng, l.lat])
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      });
    });
  }, [filtered.length, activeId, mapLoaded, JSON.stringify(filters)]);

  // ── Fit map to filtered listings ──────────────────────────────────────────
  const fitToListings = useCallback(() => {
    if (!mapRef.current || filtered.length === 0) return;
    import("mapbox-gl").then(mod => {
      const mapboxgl = mod.default;
      const bounds = new mapboxgl.LngLatBounds();
      filtered.forEach(l => bounds.extend([l.lng, l.lat]));
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 800 });
    });
  }, [filtered]);

  useEffect(() => {
    if (mapLoaded && filtered.length > 0) {
      setTimeout(fitToListings, 300);
    }
  }, [mapLoaded]);

  // ── Fly to listing when clicked in list ──────────────────────────────────
  const handleListClick = useCallback((l: MapListing) => {
    setActiveId(l.id);
    setPopupListing(l);
    setMobileTab("map");
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [l.lng, l.lat], zoom: 15, duration: 800 });
    }
  }, []);

  return (
    <>
      <Navbar />
      <div className="flex flex-col h-[calc(100vh-64px)]">

        {/* Filter bar */}
        <FilterBar filters={filters} onChange={setFilters} count={filtered.length} />

        {/* Mobile tab switcher */}
        <div className="lg:hidden flex border-b border-navy/10 bg-[#FDFAF6]">
          {(["map","list"] as const).map(tab => (
            <button key={tab} onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2.5 text-[13px] font-semibold transition-colors capitalize ${mobileTab === tab ? "border-b-2 border-gold text-navy" : "text-cream-muted"}`}>
              {tab === "map" ? "🗺 Carte" : `📋 Liste (${filtered.length})`}
            </button>
          ))}
        </div>

        {/* Main content: list + map */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT: Scrollable list ──────────────────────────────────── */}
          <div className={`w-full lg:w-[380px] lg:flex flex-col shrink-0 border-r border-navy/10 bg-[#FDFAF6] ${mobileTab === "list" ? "flex" : "hidden"}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-navy/8 shrink-0">
              <p className="text-[12px] font-bold uppercase tracking-widest text-cream-muted">
                {filtered.length} bien{filtered.length !== 1 ? "s" : ""}
              </p>
              <button onClick={fitToListings}
                className="text-[11px] text-gold hover:underline font-medium flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6a5 5 0 1010 0A5 5 0 001 6zM6 3v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Centrer la carte
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-center px-6">
                <div className="w-14 h-14 rounded-full bg-navy/5 flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-navy/20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <p className="font-display text-[16px] text-navy font-semibold mb-1">Aucun bien trouvé</p>
                <p className="text-[12px] text-cream-muted">Modifiez les filtres pour voir plus de résultats</p>
                <button onClick={() => setFilters({ action:"",type:"",wilaya:"",minPrice:"",maxPrice:"",rooms:"" })}
                  className="mt-4 px-4 py-2 rounded-lg bg-navy text-gold text-[12px] font-semibold">
                  Effacer les filtres
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {filtered.map(l => (
                  <ListCard key={l.id} l={l} active={activeId === l.id} onClick={() => handleListClick(l)} />
                ))}
              </div>
            )}

            {/* Footer: link to grid view */}
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

          {/* ── RIGHT: Map ────────────────────────────────────────────── */}
          <div className={`flex-1 relative ${mobileTab === "map" ? "block" : "hidden lg:block"}`}>

            {/* Map container */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* No token fallback */}
            {mapboxError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream z-20 text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center mb-4 text-3xl">🗺</div>
                <h2 className="font-display text-[24px] text-navy font-semibold mb-2">Token Mapbox manquant</h2>
                <p className="text-cream-muted text-[14px] max-w-sm mb-6 leading-relaxed">
                  Pour activer la carte, ajoutez votre token Mapbox dans les variables d'environnement Vercel.
                </p>
                <div className="bg-navy rounded-xl p-4 text-left w-full max-w-md mb-4">
                  <p className="text-[11px] font-bold text-gold tracking-widest uppercase mb-2">Variable à ajouter sur Vercel</p>
                  <code className="text-cream text-[13px] font-mono">NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...</code>
                </div>
                <a href="https://mapbox.com" target="_blank" rel="noreferrer"
                  className="px-5 py-2.5 rounded-lg bg-gold text-navy font-bold text-[13px] hover:bg-gold/90 transition no-underline">
                  Obtenir un token gratuit →
                </a>
              </div>
            )}

            {/* Loading overlay */}
            {!mapLoaded && !mapboxError && TOKEN && (
              <div className="absolute inset-0 bg-cream flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin"/>
                  <p className="text-[13px] text-cream-muted font-medium">Chargement de la carte…</p>
                </div>
              </div>
            )}

            {/* Search this area button */}
            {searchThisArea && mapLoaded && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <button
                  onClick={() => {
                    setSearchThisArea(false);
                    if (mapRef.current) {
                      const bounds = mapRef.current.getBounds();
                      // Could trigger a radius search here — for now just dismiss
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FDFAF6] border border-navy/15 shadow-lg text-[12px] font-semibold text-navy hover:bg-cream transition-all animate-fade-up">
                  <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Rechercher dans cette zone
                </button>
              </div>
            )}

            {/* Legend */}
            {mapLoaded && (
              <div className="absolute bottom-6 right-4 z-20 bg-[#FDFAF6]/95 backdrop-blur-sm rounded-xl border border-navy/10 px-3 py-2 shadow-lg">
                <p className="text-[9px] font-bold uppercase tracking-widest text-cream-muted mb-1.5">Signal IA</p>
                <div className="flex flex-col gap-1">
                  {[
                    { color: "#10b981", label: "Sous-évalué" },
                    { color: "#f59e0b", label: "Juste prix" },
                    { color: "#ef4444", label: "Sur-évalué" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }}/>
                      <span className="text-[10px] text-navy/70">{item.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-1 border-t border-navy/8 pt-1">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-gold"/>
                    <span className="text-[10px] text-navy/70">Vedette</span>
                  </div>
                </div>
              </div>
            )}

            {/* Popup card */}
            {popupListing && (
              <PopupCard
                l={popupListing}
                onClose={() => { setPopupListing(null); setActiveId(null); }}
              />
            )}

            {/* Attribution */}
            <div className="absolute bottom-2 left-2 z-10 text-[9px] text-navy/30">
              © Mapbox · © OpenStreetMap · Hestia
            </div>
          </div>
        </div>
      </div>

      {/* Mapbox GL CSS */}
      <style>{`
        .mapboxgl-ctrl-group { background: #FDFAF6 !important; border: 0.5px solid rgba(27,43,58,0.15) !important; border-radius: 8px !important; }
        .mapboxgl-ctrl-group button { background: transparent !important; }
        .mapboxgl-ctrl-group button:hover { background: #F7F3EE !important; }
        .mapboxgl-ctrl-icon { filter: invert(15%) sepia(20%) saturate(500%) hue-rotate(180deg); }
        .hestia-marker { cursor: pointer; }
        .hestia-marker:hover > div { transform: scale(1.08); }
        .mapboxgl-canvas { border-radius: 0; }
      `}</style>
    </>
  );
}
