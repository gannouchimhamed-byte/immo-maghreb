"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export interface Listing {
  id: string;
  title: string;
  price: number;
  area_m2: number;
  rooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  wilaya: string | null;
  delegation: string | null;
  district: string | null;
  primary_image_url: string | null;
  image_urls: string[];
  has_parking: boolean;
  has_elevator: boolean;
  has_pool: boolean;
  has_terrace: boolean;
  is_featured: boolean;
  is_verified: boolean;
  ai_signal: "underpriced" | "fair" | "overpriced" | null;
  ai_price_per_m2: number | null;
  metro_distance: number | null;
  beach_distance: number | null;
  school_distance: number | null;
  action: "vente" | "location";
  type: string;
  deed: string | null;
  view_count?: number;
  market_trend?: number | null;
}

interface ListingCardProps {
  listing: Listing;
  onCompareToggle?: (id: string) => void;
  isInComparison?: boolean;
  style?: React.CSSProperties;
}

const formatPrice = (price: number, action: string) => {
  if (action === "location") return `${price.toLocaleString("fr-TN")} TND/mois`;
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2)}M TND`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K TND`;
  return `${price.toLocaleString("fr-TN")} TND`;
};

const AI_CFG = {
  underpriced: { label: "Sous-évalué", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  overpriced:  { label: "Sur-évalué",  cls: "bg-rose-50 text-rose-700 border-rose-200",       dot: "bg-rose-500" },
  fair:        { label: "Juste prix",  cls: "bg-amber-50 text-amber-700 border-amber-200",     dot: "bg-amber-500" },
};

const DEED_LABELS: Record<string, string> = {
  titre_bleu: "Titre Bleu", titre_arabe: "Titre Arabe",
  henchir: "Henchir", wakf: "Wakf", manucipe: "Manucipe",
};
const TYPE_LABELS: Record<string, string> = {
  appartement:"Appartement", villa:"Villa", terrain:"Terrain",
  bureau:"Bureau", duplex:"Duplex", studio:"Studio", ferme:"Ferme",
};

const BLUR_PLACEHOLDER = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAARCAAEAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgQF/8QAIRAAAQQBBAMAAAAAAAAAAAAAAQACAxEEEiExQVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqhh6rU6hJtb7Kmqqmh7W0LqOgDtD/9k=";

export default function ListingCard({ listing: l, onCompareToggle, isInComparison = false, style }: ListingCardProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  const imgs = [l.primary_image_url, ...(l.image_urls || [])].filter(Boolean) as string[];
  const pricePerM2 = l.area_m2 > 0 ? Math.round(l.price / l.area_m2) : null;
  const location = [l.district || l.delegation, l.wilaya].filter(Boolean).join(", ");

  return (
    <article
      className={`group relative flex flex-col bg-[#FDFAF6] rounded-xl overflow-hidden transition-all duration-300 ease-out ${
        isInComparison
          ? "ring-2 ring-gold shadow-lg shadow-gold/20"
          : "shadow-sm hover:shadow-xl hover:-translate-y-0.5"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={style}
    >
      {/* Compare toggle */}
      {onCompareToggle && (
        <button
          onClick={e => { e.preventDefault(); onCompareToggle(l.id); }}
          className={`absolute top-3 left-3 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
            isInComparison
              ? "bg-gold border-gold"
              : "bg-white/80 border-white/60 backdrop-blur-sm opacity-0 group-hover:opacity-100"
          }`}
          title="Comparer ce bien"
        >
          {isInComparison && (
            <svg className="w-3.5 h-3.5 text-navy" viewBox="0 0 14 14" fill="none">
              <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      )}

      {/* Image */}
      <Link href={`/listings/${l.id}`} className="block relative aspect-[4/3] overflow-hidden">
        {imgs.length > 0 ? (
          <Image src={imgs[imgIdx]} alt={l.title} fill sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
            className={`object-cover transition-transform duration-700 ease-out ${hovered ? "scale-105" : "scale-100"}`}
            placeholder="blur" blurDataURL={BLUR_PLACEHOLDER}/>
        ) : (
          <div className="w-full h-full bg-navy/5 flex items-center justify-center">
            <span className="text-4xl opacity-20">🏛</span>
          </div>
        )}

        {/* Image dots */}
        {imgs.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {imgs.slice(0,5).map((_,i) => (
              <button key={i} onClick={e=>{e.preventDefault();setImgIdx(i);}}
                className={`h-1 rounded-full transition-all duration-200 ${i===imgIdx?"w-4 bg-white":"w-1.5 bg-white/50"}`}/>
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-widest uppercase ${
            l.action==="vente" ? "bg-navy text-gold" : "bg-gold text-navy"
          }`}>{l.action === "vente" ? "Vente" : "Location"}</span>
          {l.is_featured && <span className="px-2 py-0.5 rounded bg-gold text-navy text-[10px] font-bold tracking-wider">★ VEDETTE</span>}
        </div>

        {/* Verified ribbon */}
        {l.is_verified && (
          <div className="absolute bottom-0 left-0 z-10 flex items-center gap-1 bg-navy/90 text-gold px-2.5 py-1 text-[10px] font-semibold tracking-wider">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0L7.5 4.5H12L8.5 7L10 11.5L6 9L2 11.5L3.5 7L0 4.5H4.5L6 0Z"/></svg>
            VÉRIFIÉ HESTIA
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Price */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[22px] font-bold text-navy leading-tight tracking-tight font-display">
              {formatPrice(l.price, l.action)}
            </p>
            {pricePerM2 && (
              <p className="text-[12px] text-cream-muted mt-0.5 flex items-center gap-1.5">
                <span className="font-medium text-navy/60">{pricePerM2.toLocaleString("fr-TN")} TND/m²</span>
                {l.market_trend != null && (
                  <span className={`text-[11px] font-medium flex items-center gap-0.5 ${l.market_trend>=0?"text-emerald-600":"text-rose-500"}`}>
                    {l.market_trend>=0?"▲":"▼"}{Math.abs(l.market_trend).toFixed(1)}%
                  </span>
                )}
              </p>
            )}
          </div>
          {l.ai_signal && (() => { const cfg = AI_CFG[l.ai_signal]; return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${cfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
              {cfg.label}
            </span>
          );})()}
        </div>

        {/* Title & location */}
        <div>
          <Link href={`/listings/${l.id}`}
            className="text-[14px] font-semibold text-navy leading-snug line-clamp-2 hover:text-gold transition-colors duration-150">
            {l.title}
          </Link>
          {location && (
            <p className="mt-1 text-[12px] text-cream-muted flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0C3.79 0 2 1.79 2 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4zm0 5.5C5.17 5.5 4.5 4.83 4.5 4S5.17 2.5 6 2.5 7.5 3.17 7.5 4 6.83 5.5 6 5.5z"/></svg>
              {location}
            </p>
          )}
        </div>

        {/* Specs */}
        <div className="flex flex-wrap gap-3 text-[12px] text-navy/70">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 14 14" fill="currentColor"><path d="M1 13V5L7 1l6 4v8H9V9H5v4H1z"/></svg>
            <strong className="text-navy">{l.area_m2}</strong> m²
          </span>
          {l.rooms != null && l.rooms > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="5" width="12" height="7" rx="1"/><path d="M3 5V3a1 1 0 011-1h6a1 1 0 011 1v2"/></svg>
              <strong className="text-navy">{l.rooms}</strong> {l.rooms===1?"pièce":"pièces"}
            </span>
          )}
          {l.bathrooms != null && l.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 14 14" fill="currentColor"><path d="M1 8h12a1 1 0 010 2H1a1 1 0 010-2zM3 3.5C3 2.12 4.12 1 5.5 1S8 2.12 8 3.5V8H3V3.5z"/></svg>
              <strong className="text-navy">{l.bathrooms}</strong> SDB
            </span>
          )}
          {l.floor != null && l.floor > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 14 14" fill="currentColor"><path d="M2 13V6l5-4 5 4v7h-3V9H5v4H2z"/></svg>
              Ét. <strong className="text-navy">{l.floor}</strong>
            </span>
          )}
        </div>

        {/* Amenities */}
        {(l.has_parking || l.has_elevator || l.has_pool || l.has_terrace) && (
          <div className="flex flex-wrap gap-1.5">
            {l.has_parking  && <span className="text-[11px] px-2 py-0.5 rounded bg-navy/5 text-navy/70 border border-navy/10">🅿 Parking</span>}
            {l.has_elevator && <span className="text-[11px] px-2 py-0.5 rounded bg-navy/5 text-navy/70 border border-navy/10">⬆ Ascenseur</span>}
            {l.has_pool     && <span className="text-[11px] px-2 py-0.5 rounded bg-navy/5 text-navy/70 border border-navy/10">🏊 Piscine</span>}
            {l.has_terrace  && <span className="text-[11px] px-2 py-0.5 rounded bg-navy/5 text-navy/70 border border-navy/10">☀ Terrasse</span>}
          </div>
        )}

        {/* Distances */}
        {(l.metro_distance || l.beach_distance || l.school_distance) && (
          <div className="flex flex-wrap gap-1.5">
            {l.metro_distance  && <span className="text-[11px] px-2 py-0.5 rounded bg-cream text-cream-muted">🚇 {l.metro_distance<1000?`${l.metro_distance}m`:`${(l.metro_distance/1000).toFixed(1)}km`}</span>}
            {l.beach_distance  && <span className="text-[11px] px-2 py-0.5 rounded bg-cream text-cream-muted">🏖 {l.beach_distance<1000?`${l.beach_distance}m`:`${(l.beach_distance/1000).toFixed(1)}km`}</span>}
            {l.school_distance && <span className="text-[11px] px-2 py-0.5 rounded bg-cream text-cream-muted">🏫 {l.school_distance<1000?`${l.school_distance}m`:`${(l.school_distance/1000).toFixed(1)}km`}</span>}
          </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"/>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          {l.deed && <span className="text-[10px] px-2 py-0.5 rounded-full border border-gold/30 text-cream-muted font-medium">{DEED_LABELS[l.deed]||l.deed}</span>}
          <span className="text-[10px] text-cream-muted font-medium uppercase tracking-wider ml-auto">{TYPE_LABELS[l.type]||l.type}</span>
        </div>
      </div>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context":"https://schema.org","@type":"RealEstateListing",
        name:l.title, url:`https://hestia.tn/listings/${l.id}`,
        image:l.primary_image_url||undefined,
        offers:{"@type":"Offer",price:l.price,priceCurrency:"TND",
          availability:l.action==="vente"?"https://schema.org/ForSale":"https://schema.org/ForRent"},
        address:{"@type":"PostalAddress",addressLocality:l.wilaya||undefined,addressCountry:"TN"},
        floorSize:{"@type":"QuantitativeValue",value:l.area_m2,unitCode:"MTK"},
      })}}/>
    </article>
  );
}
