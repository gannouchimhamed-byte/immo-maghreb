"use client";
import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import ListingCard, { type Listing } from "@/components/listings/ListingCard";
import SearchFilters, { type SearchFilters as SF } from "@/components/search/SearchFilters";
import ComparisonEngine from "@/components/listings/ComparisonEngine";
import PriceTrendWidget from "@/components/listings/PriceTrendWidget";

interface Props { listings: Listing[]; initialFilters: SF; }

export default function ListingsClient({ listings, initialFilters }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useState<SF>(initialFilters);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [comparison, setComparison] = useState<string[]>([]);
  const [view, setView] = useState<"grid"|"list">("grid");

  const handleFilterChange = useCallback((f: SF) => {
    setFilters(f);
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k,v]) => { if(v!==undefined&&v!==""&&v!==false) params.set(k,String(v)); });
    startTransition(() => router.push(`/listings?${params.toString()}`));
  }, [router]);

  const toggleCompare = useCallback((id: string) => {
    setComparison(prev =>
      prev.includes(id) ? prev.filter(x=>x!==id) : prev.length<3 ? [...prev,id] : prev
    );
  }, []);

  const compareListings = listings.filter(l => comparison.includes(l.id));
  const activeWilaya = filters.wilaya;

  return (
    <>
      <Navbar/>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="mb-6">
          <div className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-2">· Annonces ·</div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-[28px] font-semibold text-navy leading-tight">
                {filters.action==="vente"?"Biens à vendre":filters.action==="location"?"Biens à louer":"Tous les biens"}
                {filters.wilaya && <span className="text-gold"> · {filters.wilaya}</span>}
              </h1>
              <p className="text-cream-muted text-[13px] mt-1">{listings.length} bien{listings.length!==1?"s":""} disponible{listings.length!==1?"s":""}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter button */}
              <button onClick={() => setDrawerOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg border border-navy/20 text-[13px] font-medium text-navy hover:bg-cream transition">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Filtres
              </button>
              {/* View toggle */}
              <div className="flex rounded-lg border border-navy/15 overflow-hidden">
                <button onClick={()=>setView("grid")} className={`p-2 transition-colors ${view==="grid"?"bg-navy text-gold":"text-cream-muted hover:bg-cream"}`}>
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
                </button>
                <button onClick={()=>setView("list")} className={`p-2 transition-colors ${view==="list"?"bg-navy text-gold":"text-cream-muted hover:bg-cream"}`}>
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <SearchFilters filters={filters} onChange={handleFilterChange} isOpen={drawerOpen} onClose={()=>setDrawerOpen(false)} resultCount={listings.length}/>

          {/* Right content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Price trend widget (shows when wilaya filtered) */}
            {activeWilaya && (
              <PriceTrendWidget wilaya={activeWilaya} action={(filters.action as any)||"vente"} className="animate-fade-up"/>
            )}

            {/* Grid */}
            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-navy/5 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-navy/20" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5"/></svg>
                </div>
                <h3 className="font-display text-[18px] text-navy font-semibold mb-1">Aucun résultat</h3>
                <p className="text-cream-muted text-[13px]">Modifiez vos filtres pour voir plus de biens.</p>
                <button onClick={()=>handleFilterChange({})} className="mt-4 px-5 py-2 rounded-lg bg-navy text-gold text-[13px] font-semibold hover:bg-navy-light transition">
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className={view==="grid"
                ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                : "flex flex-col gap-4"
              }>
                {listings.map((l, i) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    onCompareToggle={toggleCompare}
                    isInComparison={comparison.includes(l.id)}
                    style={{animationDelay:`${i*30}ms`}}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Comparison engine — fixed at bottom */}
      <ComparisonEngine
        listings={compareListings}
        onRemove={(id)=>setComparison(prev=>prev.filter(x=>x!==id))}
        onClear={()=>setComparison([])}
      />

      {/* Spacer so content isn't hidden behind comparison bar */}
      {comparison.length>0 && <div className="h-14"/>}

      <footer className="bg-navy-dark py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-display text-cream/40 text-sm tracking-widest">HESTIA</div>
          <p className="text-[11px] text-cream/25 tracking-widest">© 2026 HESTIA · TOUS DROITS RÉSERVÉS</p>
          <p className="text-[11px] text-cream/25">Plateforme immobilière — Tunisie</p>
        </div>
      </footer>
    </>
  );
}
