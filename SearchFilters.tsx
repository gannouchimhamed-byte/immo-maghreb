"use client";
import { useState, useCallback } from "react";

export interface SearchFilters {
  action?: string;
  type?: string;
  wilaya?: string;
  minPrice?: number | "";
  maxPrice?: number | "";
  minArea?: number | "";
  maxArea?: number | "";
  rooms?: number | "";
  minFloor?: number | "";
  maxFloor?: number | "";
  hasParking?: boolean;
  hasElevator?: boolean;
  hasPool?: boolean;
  hasTerrace?: boolean;
  deed?: string;
}

interface Props {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
  isOpen: boolean;
  onClose: () => void;
  resultCount?: number;
}

const WILAYAS = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan","Bizerte","Béja","Jendouba","Le Kef","Siliana","Kairouan","Kasserine","Sidi Bouzid","Sousse","Monastir","Mahdia","Sfax","Gafsa","Tozeur","Kébili","Gabès","Médenine","Tataouine"];
const TYPES = [{v:"appartement",l:"Appartement",i:"🏢"},{v:"villa",l:"Villa",i:"🏡"},{v:"terrain",l:"Terrain",i:"🌿"},{v:"bureau",l:"Bureau",i:"🏛"},{v:"duplex",l:"Duplex",i:"🏠"},{v:"studio",l:"Studio",i:"🛏"}];
const DEEDS = [{v:"titre_bleu",l:"Titre Bleu"},{v:"titre_arabe",l:"Titre Arabe"},{v:"henchir",l:"Henchir"},{v:"wakf",l:"Wakf"},{v:"manucipe",l:"Manucipe"}];

function Section({ title, children, open: defaultOpen=true }: { title:string; children:React.ReactNode; open?:boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-navy/8 last:border-0">
      <button className="w-full flex items-center justify-between py-3 text-left group" onClick={() => setOpen(!open)}>
        <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-navy group-hover:text-gold transition-colors">{title}</span>
        <svg className={`w-4 h-4 text-cream-muted transition-transform duration-200 ${open?"":"rotate-[-90deg]"}`} viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function SaveModal({ onClose, onSave }: { onClose:()=>void; onSave:(n:string,c:string,f:string)=>void }) {
  const [name,setName] = useState("");
  const [channel,setChannel] = useState("whatsapp");
  const [freq,setFreq] = useState("instant");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="w-full max-w-md bg-[#FDFAF6] rounded-2xl p-6 shadow-2xl animate-fade-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center">
            <svg className="w-5 h-5 text-gold" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6c0 4.5 6 10 6 10s6-5.5 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/></svg>
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-navy">Sauvegarder cette recherche</h3>
            <p className="text-[12px] text-cream-muted">Alerté dès qu'un bien correspond</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1.5">Nom de l'alerte</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Appartement Lac 2 — 400K"
            className="w-full px-3 py-2.5 rounded-lg border border-navy/15 bg-white text-[13px] text-navy placeholder:text-cream-muted/60 focus:outline-none focus:ring-2 focus:ring-gold/40"/>
        </div>
        <div className="mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-2">Canal</label>
          <div className="grid grid-cols-3 gap-2">
            {[{v:"whatsapp",l:"WhatsApp",i:"💬"},{v:"email",l:"Email",i:"📧"},{v:"push",l:"Push",i:"🔔"}].map(c=>(
              <button key={c.v} onClick={()=>setChannel(c.v)}
                className={`py-2 px-3 rounded-lg border text-[12px] font-medium transition-all ${channel===c.v?"bg-navy text-gold border-navy":"bg-white text-cream-muted border-navy/15 hover:border-navy/30"}`}>
                <span className="block text-base mb-0.5">{c.i}</span>{c.l}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-2">Fréquence</label>
          <div className="flex gap-2">
            {[{v:"instant",l:"Instantané"},{v:"daily",l:"Quotidien"},{v:"weekly",l:"Hebdo"}].map(f=>(
              <button key={f.v} onClick={()=>setFreq(f.v)}
                className={`flex-1 py-2 rounded-lg border text-[12px] font-medium transition-all ${freq===f.v?"bg-gold/15 text-navy border-gold":"bg-white text-cream-muted border-navy/15 hover:border-navy/30"}`}>
                {f.l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-navy/15 text-[13px] font-medium text-cream-muted hover:bg-cream transition">Annuler</button>
          <button onClick={()=>name.trim()&&onSave(name.trim(),channel,freq)} disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-lg bg-navy text-gold text-[13px] font-semibold disabled:opacity-40 hover:bg-navy-light transition">
            Activer l'alerte
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SearchFilters({ filters, onChange, isOpen, onClose, resultCount }: Props) {
  const [showSave, setShowSave] = useState(false);
  const upd = useCallback((k: keyof SearchFilters, v: unknown) => onChange({...filters,[k]:v}), [filters,onChange]);
  const hasFilters = Object.values(filters).some(v=>v!==""&&v!==undefined&&v!==false&&!(Array.isArray(v)&&v.length===0));

  const panel = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-navy/8 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-display text-[15px] font-bold text-navy">Filtres</h2>
          {resultCount!==undefined && <p className="text-[11px] text-cream-muted mt-0.5">{resultCount} bien{resultCount!==1?"s":""} trouvé{resultCount!==1?"s":""}</p>}
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && <button onClick={()=>onChange({})} className="text-[11px] text-cream-muted hover:text-rose-500 transition-colors underline">Tout effacer</button>}
          <button onClick={onClose} className="lg:hidden w-7 h-7 flex items-center justify-center rounded-full hover:bg-navy/8 transition">
            <svg className="w-4 h-4 text-cream-muted" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin">

        <Section title="Transaction">
          <div className="grid grid-cols-3 gap-1.5">
            {[{v:"",l:"Tous"},{v:"vente",l:"Vente"},{v:"location",l:"Location"}].map(a=>(
              <button key={a.v} onClick={()=>upd("action",a.v)}
                className={`py-2 rounded-lg text-[12px] font-semibold border transition-all ${filters.action===a.v?"bg-navy text-gold border-navy":"bg-white text-cream-muted border-navy/15 hover:border-navy/30"}`}>
                {a.l}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Type de bien">
          <div className="grid grid-cols-2 gap-1.5">
            {TYPES.map(t=>(
              <button key={t.v} onClick={()=>upd("type",filters.type===t.v?"":t.v)}
                className={`flex items-center gap-2 py-2 px-3 rounded-lg text-[12px] border transition-all ${filters.type===t.v?"bg-navy text-gold border-navy":"bg-white text-cream-muted border-navy/15 hover:border-navy/30"}`}>
                <span className="text-base leading-none">{t.i}</span>{t.l}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Wilaya">
          <select value={filters.wilaya||""} onChange={e=>upd("wilaya",e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-navy/15 bg-white text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-gold/40 appearance-none"
            style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",backgroundSize:"16px"}}>
            <option value="">Toutes les wilayas</option>
            {WILAYAS.map(w=><option key={w} value={w}>{w}</option>)}
          </select>
        </Section>

        <Section title="Budget (TND)" open={false}>
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label className="block text-[10px] text-cream-muted mb-1">Min</label>
              <input type="number" placeholder="0" value={filters.minPrice||""} onChange={e=>upd("minPrice",e.target.value?Number(e.target.value):"")}
                className="w-full px-3 py-2 rounded-lg border border-navy/15 bg-white text-[12px] focus:outline-none focus:ring-2 focus:ring-gold/40"/>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-cream-muted mb-1">Max</label>
              <input type="number" placeholder="∞" value={filters.maxPrice||""} onChange={e=>upd("maxPrice",e.target.value?Number(e.target.value):"")}
                className="w-full px-3 py-2 rounded-lg border border-navy/15 bg-white text-[12px] focus:outline-none focus:ring-2 focus:ring-gold/40"/>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[{l:"< 100K",max:100000},{l:"100–300K",min:100000,max:300000},{l:"300–600K",min:300000,max:600000},{l:"> 600K",min:600000}].map(p=>(
              <button key={p.l} onClick={()=>onChange({...filters,minPrice:p.min||"",maxPrice:p.max||""})}
                className="text-[10px] px-2.5 py-1 rounded-full border border-gold/40 text-cream-muted hover:bg-gold/10 hover:text-navy transition">{p.l}</button>
            ))}
          </div>
        </Section>

        <Section title="Surface (m²)" open={false}>
          <div className="flex gap-2">
            <div className="flex-1"><label className="block text-[10px] text-cream-muted mb-1">Min</label>
              <input type="number" placeholder="0" value={filters.minArea||""} onChange={e=>upd("minArea",e.target.value?Number(e.target.value):"")}
                className="w-full px-3 py-2 rounded-lg border border-navy/15 bg-white text-[12px] focus:outline-none focus:ring-2 focus:ring-gold/40"/>
            </div>
            <div className="flex-1"><label className="block text-[10px] text-cream-muted mb-1">Max</label>
              <input type="number" placeholder="∞" value={filters.maxArea||""} onChange={e=>upd("maxArea",e.target.value?Number(e.target.value):"")}
                className="w-full px-3 py-2 rounded-lg border border-navy/15 bg-white text-[12px] focus:outline-none focus:ring-2 focus:ring-gold/40"/>
            </div>
          </div>
        </Section>

        <Section title="Pièces" open={false}>
          <div className="flex gap-1.5">
            {["",1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>upd("rooms",n)}
                className={`flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-all ${filters.rooms===n?"bg-navy text-gold border-navy":"bg-white text-cream-muted border-navy/15 hover:border-navy/30"}`}>
                {n===""?"Tous":n===5?"5+":n}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Étage" open={false}>
          <div className="flex gap-2">
            <div className="flex-1"><label className="block text-[10px] text-cream-muted mb-1">Min</label>
              <input type="number" min={0} placeholder="RDC" value={filters.minFloor??""} onChange={e=>upd("minFloor",e.target.value!==""?Number(e.target.value):"")}
                className="w-full px-3 py-2 rounded-lg border border-navy/15 bg-white text-[12px] focus:outline-none focus:ring-2 focus:ring-gold/40"/>
            </div>
            <div className="flex-1"><label className="block text-[10px] text-cream-muted mb-1">Max</label>
              <input type="number" min={0} placeholder="∞" value={filters.maxFloor??""} onChange={e=>upd("maxFloor",e.target.value!==""?Number(e.target.value):"")}
                className="w-full px-3 py-2 rounded-lg border border-navy/15 bg-white text-[12px] focus:outline-none focus:ring-2 focus:ring-gold/40"/>
            </div>
          </div>
        </Section>

        <Section title="Équipements" open={false}>
          {[{k:"hasParking",l:"Parking",i:"🅿"},{k:"hasElevator",l:"Ascenseur",i:"⬆"},{k:"hasPool",l:"Piscine",i:"🏊"},{k:"hasTerrace",l:"Terrasse",i:"☀"}].map(eq=>(
            <label key={eq.k} className="flex items-center gap-3 py-1.5 cursor-pointer group">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${filters[eq.k as keyof SearchFilters]?"bg-navy border-navy":"border-navy/20 group-hover:border-navy/40"}`}
                onClick={()=>upd(eq.k as keyof SearchFilters, !filters[eq.k as keyof SearchFilters])}>
                {filters[eq.k as keyof SearchFilters] && <svg className="w-3 h-3 text-gold" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </div>
              <span className="text-[13px] text-navy">{eq.i} {eq.l}</span>
            </label>
          ))}
        </Section>

        <Section title="Titre de propriété" open={false}>
          <select value={filters.deed||""} onChange={e=>upd("deed",e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-navy/15 bg-white text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-gold/40 appearance-none"
            style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",backgroundSize:"16px"}}>
            <option value="">Tous les titres</option>
            {DEEDS.map(d=><option key={d.v} value={d.v}>{d.l}</option>)}
          </select>
        </Section>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-navy/8 flex flex-col gap-2 shrink-0">
        <button onClick={()=>setShowSave(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-gold text-navy text-[13px] font-semibold hover:bg-gold/10 transition">
          <svg className="w-4 h-4 text-gold" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Sauvegarder cette recherche
        </button>
        <p className="text-center text-[10px] text-cream-muted">Recevez une alerte dès qu'un bien correspond</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-72 shrink-0 bg-[#FDFAF6] border border-navy/10 rounded-xl overflow-hidden h-[calc(100vh-100px)] sticky top-20">{panel}</aside>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
          <div className="relative ml-auto w-80 h-full bg-[#FDFAF6] shadow-2xl flex flex-col animate-slide-in-right">{panel}</div>
        </div>
      )}
      {showSave && <SaveModal onClose={()=>setShowSave(false)} onSave={(n,c,f)=>{console.log("save",{n,c,f,filters});setShowSave(false);}}/>}
    </>
  );
}
