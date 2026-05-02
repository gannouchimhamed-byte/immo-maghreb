"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Row { wilaya:string; property_type:string; action:string; avg_price_m2:number; trend_12m_pct:number; sample_size:number; period_end:string; }

export default function PriceTrendWidget({ wilaya, action="vente", propertyType="appartement", className="" }:
  { wilaya:string; action?:string; propertyType?:string; className?:string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row|null>(null);
  const [selAction, setSelAction] = useState(action);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from("market_index").select("*").eq("wilaya",wilaya).eq("action",selAction)
      .then(({data})=>{ if(data){ setRows(data); setSelected(data.find(r=>r.property_type===propertyType)||data[0]||null); } setLoading(false); });
  },[wilaya,selAction,propertyType]);

  const LABELS: Record<string,string> = {appartement:"Appart.",villa:"Villa",terrain:"Terrain",bureau:"Bureau",duplex:"Duplex",studio:"Studio",ferme:"Ferme"};

  if (loading) return <div className={`animate-pulse rounded-xl bg-navy/5 h-44 ${className}`}/>;
  if (!selected) return null;

  const up = selected.trend_12m_pct >= 0;
  const pct = selected.trend_12m_pct;
  const barW = Math.abs(Math.max(-30,Math.min(30,pct))/30)*100;

  return (
    <div className={`bg-[#FDFAF6] border border-navy/10 rounded-xl overflow-hidden ${className}`}>
      <div className="px-4 pt-4 pb-3 border-b border-navy/8">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-cream-muted">Marché Immobilier</p>
            <h3 className="font-display text-[16px] font-bold text-navy mt-0.5">{wilaya}</h3>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-navy/15 text-[11px] font-semibold">
            {(["vente","location"] as const).map(a=>(
              <button key={a} onClick={()=>setSelAction(a)}
                className={`px-2.5 py-1.5 transition-colors capitalize ${selAction===a?"bg-navy text-gold":"text-cream-muted hover:bg-cream"}`}>{a}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {rows.map(r=>(
            <button key={r.property_type} onClick={()=>setSelected(r)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${selected.property_type===r.property_type?"bg-navy text-gold border-navy":"border-navy/15 text-cream-muted hover:border-navy/30"}`}>
              {LABELS[r.property_type]||r.property_type}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-4">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] text-cream-muted font-medium mb-1">Prix moyen / m²</p>
            <p className="font-display text-[28px] font-bold text-navy leading-none tabular-nums">
              {Math.round(selected.avg_price_m2).toLocaleString("fr-TN")}
              <span className="font-sans text-[14px] font-normal text-cream-muted ml-1">TND</span>
            </p>
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${up?"bg-emerald-100":"bg-rose-100"}`}>{up?"📈":"📉"}</div>
        </div>
        <p className="text-[11px] text-cream-muted mb-1.5">Évolution 12 mois</p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 rounded-full bg-navy/8 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${up?"bg-emerald-400":"bg-rose-400"}`}
              style={{width:`${barW}%`,marginLeft:up?"50%":`${50-barW}%`}}/>
          </div>
          <span className={`text-[13px] font-bold tabular-nums ${up?"text-emerald-600":"text-rose-500"}`}>
            {up?"+":""}{pct.toFixed(1)}%
          </span>
        </div>
        <p className={`text-[12px] font-medium px-3 py-2 rounded-lg ${up?"bg-emerald-50 text-emerald-700":pct<-5?"bg-rose-50 text-rose-700":"bg-cream text-cream-muted"}`}>
          {up?`Les prix à ${wilaya} ont augmenté de ${pct.toFixed(1)}% — marché porteur.`:`Les prix ont baissé de ${Math.abs(pct).toFixed(1)}% — opportunité d'achat.`}
        </p>
      </div>
      <div className="px-4 py-3 bg-cream border-t border-navy/8 flex items-center justify-between">
        <p className="text-[10px] text-cream-muted">Basé sur {selected.sample_size||"N/A"} transactions</p>
        <p className="text-[10px] text-cream-muted">Indice Hestia™ · {new Date(selected.period_end||"").toLocaleDateString("fr-TN",{month:"short",year:"numeric"})}</p>
      </div>
    </div>
  );
}
