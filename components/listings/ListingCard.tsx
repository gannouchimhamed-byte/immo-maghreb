"use client";
import { useState } from "react";
import Link from "next/link";

interface Listing {
  id: string;
  type: string;
  action: string;
  title: string;
  price: number;
  area_m2: number;
  rooms?: number;
  wilaya: string;
  city: string;
  district?: string;
  primary_image_url?: string;
  deed?: string;
  is_featured?: boolean;
  is_verified?: boolean;
  view_count?: number;
  mosque_distance?: number;
  school_distance?: number;
  ai_signal?: string;
  ai_estimate?: number;
}

interface ListingCardProps {
  listing: Listing;
  currency?: string;
}

const RATES: Record<string, number> = { TND: 1, EUR: 0.295, USD: 0.323 };
const SYMBOLS: Record<string, string> = { TND: "DT", EUR: "€", USD: "$" };

export function formatPrice(price: number, currency = "TND") {
  const v = Math.round(price * (RATES[currency] ?? 1));
  const s = SYMBOLS[currency] ?? "DT";
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M ${s}`;
  if (v >= 1000) return `${Math.round(v / 1000)}k ${s}`;
  return `${v.toLocaleString("fr-TN")} ${s}`;
}

export default function ListingCard({ listing: l, currency = "TND" }: ListingCardProps) {
  const [saved, setSaved] = useState(false);

  const signalColor = l.ai_signal === "underpriced" ? "#2D6A4F" : l.ai_signal === "overpriced" ? "#B91C1C" : "#C4611F";
  const signalLabel = l.ai_signal === "underpriced" ? "Sous-évalué" : l.ai_signal === "overpriced" ? "Sur-évalué" : "Juste";

  return (
    <Link href={`/listings/${l.id}`} style={{ display: "block", textDecoration: "none" }}>
      <div style={{ background: "#FDFBF7", borderRadius: 14, overflow: "hidden", border: "1px solid #EDE5D4", transition: "transform .25s, box-shadow .25s", cursor: "pointer" }}>
        <div style={{ position: "relative", height: 190 }}>
          <img
            src={l.primary_image_url || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=75"}
            alt={l.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 50%,rgba(28,18,8,.5))" }} />
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5 }}>
            {l.is_featured && <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#1C1208", color: "#D4A853" }}>Premium</span>}
            <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: l.action === "vente" ? "#2D6A4F" : "#1A56A4", color: "#fff" }}>
              {l.action === "vente" ? "Vente" : "Location"}
            </span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); setSaved(!saved); }}
            style={{ position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: "50%", background: "rgba(253,251,247,.9)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: 14 }}
          >
            {saved ? "❤️" : "🤍"}
          </button>
          <div style={{ position: "absolute", bottom: 10, left: 12 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 600, color: "#fff" }}>{formatPrice(l.price, currency)}</div>
            {l.action === "location" && <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)" }}>/mois</div>}
          </div>
          {l.is_verified && (
            <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", alignItems: "center", gap: 3, background: "rgba(45,106,79,.9)", borderRadius: 12, padding: "2px 7px" }}>
              <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>✓ Vérifié</span>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1C1208", marginBottom: 3 }}>{l.title}</div>
          <div style={{ fontSize: 11, color: "#9A8070", marginBottom: 10 }}>📍 {l.city}, {l.wilaya}</div>
          <div style={{ display: "flex", gap: 12, paddingTop: 8, borderTop: "1px solid #EDE5D4", fontSize: 11, color: "#5C3D1E", alignItems: "center" }}>
            {l.rooms && l.rooms > 0 && <span>🛏 {l.rooms}p</span>}
            <span>📐 {l.area_m2}m²</span>
            {l.ai_signal && (
              <span style={{ marginLeft: "auto", padding: "2px 7px", borderRadius: 10, fontSize: 9, fontWeight: 700, background: `${signalColor}20`, color: signalColor }}>
                {signalLabel}
              </span>
            )}
            <span style={{ color: "#9A8070", fontSize: 10 }}>👁 {l.view_count ?? 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
