"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Listing } from "./ListingCard";

interface Props { listings: Listing[]; onRemove: (id:string)=>void; onClear: ()=>void; }

const fmtP = (price:number,action:string) => {
  if (action==="location") return `${price.toLocaleString("fr-TN")} TND/mois`;
  if (price>=1_000_000) return `${(price/1_000_000).toFixed(2)}M TND`;
  if (price>=1_000) return `${(price/1_000).toFixed(0)}K TND`;
  return `${price.toLocaleString("fr-TN")} TND`;
};
const AI = { underpriced:{bg:"bg-emerald-100",text:"text-emerald-700",l:"✓ Sous-évalué"}, fair:{bg:"bg-amber-100",text:"text-amber-700",l:"Juste prix"}, overpriced:{bg:"bg-rose-100",text:"text-rose-700",l:"⚠ Sur-évalué"} };

function Row({label,values}:{label:string;values:React.ReactNode[]}) {
  return (
    <tr className="border-b border-navy/6 hover:bg-cream/50 transition-colors">
      <td className="py-3 pr-4 text-[11px] font-bold text-cream-muted uppercase tracking-wider w-32 shrink-0">{label}</td>
      {values.map((v,i)=><td key={i} className="py-3 px-3 text-[13px] text-navy text-center">{v??<span className="text-cream-muted">—</span>}</td>)}
    </tr>
  );
}

function Check({val}:{val:boolean}) {
  return val
    ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600"><svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
    : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-navy/5 text-navy/20"><svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>;
}

export default function ComparisonEngine({ listings, onRemove, onClear }: Props) {
  const [expanded, setExpanded] = useState(true);
  if (!listings.length) return null;

  const ppm2 = listings.map(l => l.area_m2>0?Math.round(l.price/l.area_m2):null);
  const valid = ppm2.filter(Boolean) as number[];
  const minPPM2 = valid.length?Math.min(...valid):null;
  const maxPPM2 = valid.length?Math.max(...valid):null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 ease-out ${expanded?"translate-y-0":"translate-y-[calc(100%-48px)]"}`}>
      {/* Handle */}
      <div className="flex items-center justify-between px-6 py-3 bg-navy cursor-pointer select-none" onClick={()=>setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <span className="text-gold text-sm font-bold tracking-wide">⚖ Comparer ({listings.length}/3)</span>
          <div className="flex gap-1.5">
            {listings.map(l=>(
              <div key={l.id} className="w-6 h-6 rounded-full ring-2 ring-gold/40 overflow-hidden bg-navy/40">
                {l.primary_image_url && <Image src={l.primary_image_url} alt={l.title} width={24} height={24} className="object-cover w-full h-full"/>}
              </div>
            ))}
          </div>
          {listings.length<3 && <span className="text-[11px] text-gold/50 italic">+ {3-listings.length} emplacement{listings.length<2?"s":""}</span>}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={e=>{e.stopPropagation();onClear();}} className="text-[11px] text-cream-muted hover:text-rose-400 transition-colors">Tout effacer</button>
          <svg className={`w-5 h-5 text-gold transition-transform duration-200 ${expanded?"rotate-180":""}`} viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FDFAF6] border-t-2 border-gold/20 overflow-auto max-h-[70vh]">
        <div className="min-w-[600px]">
          <table className="w-full">
            <colgroup>
              <col className="w-32"/>
              {listings.map(l=><col key={l.id}/>)}
              {Array.from({length:3-listings.length}).map((_,i)=><col key={i}/>)}
            </colgroup>
            <thead>
              <tr>
                <th/>
                {listings.map(l=>(
                  <th key={l.id} className="p-4 align-top">
                    <div className="relative">
                      <button onClick={()=>onRemove(l.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-navy/10 hover:bg-rose-100 hover:text-rose-500 flex items-center justify-center transition-colors z-10">
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-cream">
                        {l.primary_image_url&&<Image src={l.primary_image_url} alt={l.title} width={200} height={150} className="w-full h-full object-cover"/>}
                      </div>
                      <Link href={`/listings/${l.id}`} className="text-[12px] font-semibold text-navy hover:text-gold transition-colors line-clamp-2 leading-snug block">{l.title}</Link>
                      <p className="font-display text-[15px] font-bold text-navy mt-1">{fmtP(l.price,l.action)}</p>
                    </div>
                  </th>
                ))}
                {Array.from({length:3-listings.length}).map((_,i)=>(
                  <th key={i} className="p-4 align-top">
                    <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-navy/10 flex items-center justify-center mb-2">
                      <span className="text-cream-muted/40 text-xs text-center px-2">Sélectionnez<br/>un bien</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_td]:px-3">
              <Row label="Prix / m²" values={listings.map((l,i)=>{
                const p=ppm2[i]; if(!p) return null;
                const best=p===minPPM2&&valid.length>1; const worst=p===maxPPM2&&valid.length>1;
                return <span className={`font-semibold ${best?"text-emerald-600":worst?"text-rose-500":""}`}>
                  {p.toLocaleString("fr-TN")} TND
                  {best&&<span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Meilleur</span>}
                </span>;
              })}/>
              <Row label="Surface" values={listings.map(l=>`${l.area_m2} m²`)}/>
              <Row label="Pièces" values={listings.map(l=>l.rooms||null)}/>
              <Row label="Sdb" values={listings.map(l=>l.bathrooms||null)}/>
              <Row label="Étage" values={listings.map(l=>l.floor!=null?(l.floor===0?"RDC":`${l.floor}ème`):null)}/>
              <Row label="Wilaya" values={listings.map(l=>l.wilaya||null)}/>
              <Row label="Signal IA" values={listings.map(l=>{
                if(!l.ai_signal) return null;
                const c=AI[l.ai_signal];
                return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>{c.l}</span>;
              })}/>
              {listings.some(l=>l.market_trend!=null)&&<Row label="Tendance" values={listings.map(l=>l.market_trend!=null?<span className={`font-semibold ${l.market_trend>=0?"text-emerald-600":"text-rose-500"}`}>{l.market_trend>=0?"▲":"▼"} {Math.abs(l.market_trend).toFixed(1)}%</span>:null)}/>}
              <Row label="Parking" values={listings.map(l=><Check key={l.id} val={l.has_parking}/>)}/>
              <Row label="Ascenseur" values={listings.map(l=><Check key={l.id} val={l.has_elevator}/>)}/>
              <Row label="Piscine" values={listings.map(l=><Check key={l.id} val={l.has_pool}/>)}/>
              {listings.some(l=>l.metro_distance)&&<Row label="🚇 Métro" values={listings.map(l=>l.metro_distance?l.metro_distance<1000?`${l.metro_distance}m`:`${(l.metro_distance/1000).toFixed(1)}km`:null)}/>}
              {listings.some(l=>l.beach_distance)&&<Row label="🏖 Mer" values={listings.map(l=>l.beach_distance?l.beach_distance<1000?`${l.beach_distance}m`:`${(l.beach_distance/1000).toFixed(1)}km`:null)}/>}
              <tr>
                <td/>
                {listings.map(l=><td key={l.id} className="py-4 text-center">
                  <Link href={`/listings/${l.id}`} className="inline-block w-full py-2.5 rounded-lg bg-navy text-gold text-[12px] font-bold hover:bg-navy-light transition">Voir le bien →</Link>
                </td>)}
                {Array.from({length:3-listings.length}).map((_,i)=><td key={i}/>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
