"use client";
import { useState } from "react";
import Link from "next/link";

export default function ListingCard({ l, currency = "TND" }: { l: any; currency?: string }) {
  const [saved, setSaved] = useState(false);
  const rates: any = { TND: 1, EUR: 0.295, USD: 0.323 };
  const symbols: any = { TND: "DT", EUR: "€", USD: "$" };
  const price = Math.round(l.price * (rates[currency] || 1));
  const priceStr = price >= 1000000
    ? `${(price/1000000).toFixed(1)}M ${symbols[currency]}`
    : price >= 1000
    ? `${Math.round(price/1000)}k ${symbols[currency]}`
    : `${price.toLocaleString("fr-TN")} ${symbols[currency]}`;

  return (
    <Link href={`/listings/${l.id}`} style={{ display:"block", textDecoration:"none" }}>
      <div style={{ background:"#FDFBF7", borderRadius:14, overflow:"hidden", border:"1px solid #EDE5D4", cursor:"pointer" }}>
        <div style={{ position:"relative", height:190 }}>
          <img src={l.primary_image_url || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"} alt={l.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 50%,rgba(28,18,8,.5))" }} />
          <div style={{ position:"absolute", top:10, left:10, display:"flex", gap:5 }}>
            {l.is_featured && <span style={{ padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700, background:"#1C1208", color:"#D4A853" }}>Premium</span>}
            <span style={{ padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700, background:l.action==="vente"?"#2D6A4F":"#1A56A4", color:"#fff" }}>
              {l.action==="vente"?"Vente":"Location"}
            </span>
          </div>
          <button onClick={e=>{e.preventDefault();setSaved(!saved)}} style={{ position:"absolute", top:8, right:8, width:30, height:30, borderRadius:"50%", background:"rgba(253,251,247,.9)", border:"none", cursor:"pointer", fontSize:14 }}>
            {saved?"❤️":"🤍"}
          </button>
          <div style={{ position:"absolute", bottom:10, left:12, fontFamily:"Georgia,serif", fontSize:20, fontWeight:600, color:"#fff" }}>{priceStr}</div>
        </div>
        <div style={{ padding:"12px 14px" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#1C1208", marginBottom:3 }}>{l.title}</div>
          <div style={{ fontSize:11, color:"#9A8070", marginBottom:10 }}>📍 {l.city}, {l.wilaya}</div>
          <div style={{ display:"flex", gap:12, paddingTop:8, borderTop:"1px solid #EDE5D4", fontSize:11, color:"#5C3D1E" }}>
            {l.rooms>0&&<span>🛏 {l.rooms}p</span>}
            <span>📐 {l.area_m2}m²</span>
            <span style={{ marginLeft:"auto", color:"#9A8070" }}>👁 {l.view_count||0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
