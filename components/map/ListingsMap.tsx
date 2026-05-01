"use client";
import { useEffect, useRef } from "react";

interface Listing {
  id: string;
  lat?: number;
  lng?: number;
  price: number;
  type: string;
  action: string;
}

interface ListingsMapProps {
  listings?: Listing[];
  height?: number | string;
  className?: string;
}

export function ListingsMap({ listings = [], height = 400, className = "" }: ListingsMapProps) {
  return (
    <div className={className} style={{ height, background: "linear-gradient(135deg,#1a3a2a,#2d5a3d)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
      <span style={{ fontSize: 36 }}>🗺️</span>
      <div style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>Carte interactive — {listings.length} biens</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Mapbox GL · Tunisie</div>
    </div>
  );
}

export default ListingsMap;
