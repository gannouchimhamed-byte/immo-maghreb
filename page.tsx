import { getFeaturedListings } from "@/lib/supabase/client";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import ListingCard from "@/components/listings/ListingCard";

export const revalidate = 60;

const WILAYAS_QUICK = ["Tunis","Sousse","Sfax","Nabeul","Monastir","Hammamet"];

export default async function HomePage() {
  let listings: any[] = [];
  try { listings = await getFeaturedListings(); } catch {}

  return (
    <>
      <Navbar/>
      <div className="bg-cream min-h-screen font-sans">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative min-h-[88vh] flex items-center bg-navy overflow-hidden">
          {/* Geometric grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"repeating-linear-gradient(45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 40px),repeating-linear-gradient(-45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 40px)",backgroundSize:"40px 40px"}}/>
          {/* Giant H watermark */}
          <div className="absolute right-[-2%] top-1/2 -translate-y-1/2 font-display text-[clamp(200px,35vw,480px)] text-gold/[0.04] leading-none select-none pointer-events-none">H</div>
          {/* Gold arcs */}
          <div className="absolute top-10 right-20 w-72 h-72 rounded-[50%_50%_0_0] border border-gold/10 border-b-0"/>
          <div className="absolute top-16 right-28 w-56 h-56 rounded-[50%_50%_0_0] border border-gold/[0.06] border-b-0"/>

          <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10 w-full py-20">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/25 rounded-full px-4 py-2 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"/>
                <span className="text-[11px] text-gold font-semibold tracking-[0.15em] uppercase">Plateforme N°1 · Tunisie</span>
              </div>

              <h1 className="font-display text-[clamp(40px,7vw,80px)] text-cream font-normal leading-[1.05] mb-6">
                Trouvez votre<br/>
                <em className="not-italic text-gold">chez-vous</em>
              </h1>
              <p className="text-cream/55 text-[16px] leading-relaxed mb-10 max-w-xl">
                L'immobilier tunisien réinventé — estimation IA, alertes WhatsApp, et les meilleures annonces de Tunis à Sfax.
              </p>

              {/* Search bar */}
              <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-xl mb-10">
                <input type="text" placeholder="Quartier, ville, wilaya…"
                  className="flex-1 bg-transparent px-4 py-3 text-cream placeholder:text-cream/35 text-[14px] focus:outline-none"/>
                <div className="flex gap-2">
                  <select className="bg-white/10 border border-white/10 text-cream/70 text-[13px] rounded-xl px-3 py-3 focus:outline-none appearance-none">
                    <option value="">Vente / Location</option>
                    <option value="vente">Vente</option>
                    <option value="location">Location</option>
                  </select>
                  <Link href="/listings" className="px-6 py-3 bg-gold text-navy text-[13px] font-bold rounded-xl hover:bg-gold-light transition-colors whitespace-nowrap">
                    Rechercher →
                  </Link>
                </div>
              </div>

              {/* Quick wilaya links */}
              <div className="flex flex-wrap gap-2">
                {WILAYAS_QUICK.map(w=>(
                  <Link key={w} href={`/listings?wilaya=${w}`}
                    className="px-3 py-1.5 rounded-full border border-white/15 text-cream/60 text-[12px] hover:border-gold/40 hover:text-gold transition-all">
                    {w}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ────────────────────────────────────────────────── */}
        <div className="bg-navy-dark border-t border-gold/10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap justify-center gap-x-12 gap-y-3">
            {[["8+","Annonces actives"],["24","Wilayas couvertes"],["IA","Estimation incluse"],["WhatsApp","Contact direct"]].map(([v,l])=>(
              <div key={l} className="text-center">
                <div className="font-display text-[22px] text-gold font-semibold leading-none">{v}</div>
                <div className="text-[11px] text-cream/35 mt-1 tracking-wide">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURED LISTINGS ────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-2">· Sélection ·</div>
              <h2 className="font-display text-[32px] text-navy font-semibold leading-tight">Biens en vedette</h2>
            </div>
            <Link href="/listings" className="text-[13px] text-cream-muted hover:text-gold transition-colors underline underline-offset-4">
              Voir tous →
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listings.map((l: any) => <ListingCard key={l.id} listing={l}/>)}
            </div>
          ) : (
            <div className="text-center py-16 text-cream-muted">
              <p className="font-display text-xl mb-2">Aucune annonce vedette pour le moment</p>
              <Link href="/listings" className="text-gold hover:underline text-[13px]">Voir toutes les annonces →</Link>
            </div>
          )}
        </section>

        {/* ── WHY HESTIA ───────────────────────────────────────────────── */}
        <section className="bg-navy py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-3">· Pourquoi Hestia ·</div>
              <h2 className="font-display text-[36px] text-cream font-semibold">La différence Hestia</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {icon:"🤖",title:"Estimation IA",desc:"XGBoost calibré sur le marché tunisien. Prix juste ou opportunité détectée automatiquement."},
                {icon:"📲",title:"Contact WhatsApp",desc:"Un clic pour contacter l'agent directement. Pas de formulaires, pas d'attente."},
                {icon:"🔔",title:"Alertes intelligentes",desc:"Sauvegardez vos critères. Soyez alerté dès qu'un bien correspond, en temps réel."},
                {icon:"⚖",title:"Comparaison",desc:"Comparez 3 biens côte à côte — prix/m², équipements, distance, signal IA."},
              ].map(f=>(
                <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-gold/30 transition-all group">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-display text-[18px] text-cream font-semibold mb-2 group-hover:text-gold transition-colors">{f.title}</h3>
                  <p className="text-cream/45 text-[13px] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="bg-navy-dark py-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-display text-cream/40 text-sm tracking-widest">HESTIA</div>
            <p className="text-[11px] text-cream/25 tracking-widest">© 2026 HESTIA · TOUS DROITS RÉSERVÉS</p>
            <div className="flex gap-4">
              <Link href="/listings" className="text-[11px] text-cream/35 hover:text-gold transition-colors">Annonces</Link>
              <Link href="/listings?action=vente" className="text-[11px] text-cream/35 hover:text-gold transition-colors">Vente</Link>
              <Link href="/listings?action=location" className="text-[11px] text-cream/35 hover:text-gold transition-colors">Location</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
