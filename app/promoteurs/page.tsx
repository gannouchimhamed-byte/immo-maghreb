import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import { getAllPromoters } from "@/lib/promoter";
import type { Promoter } from "@/lib/promoter";

export const metadata: Metadata = {
  title: "Promoteurs immobiliers en Tunisie — Hestia",
  description: "Découvrez les meilleurs promoteurs immobiliers en Tunisie. Appartements, villas et bureaux neufs à Tunis, Sousse, Sfax.",
};
export const revalidate = 60;

// ─── Star rating ──────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <svg key={n} className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? "text-gold" : "text-navy/15"}`}
          viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 0l1.5 4.5H13l-3.5 2.5L11 12 7 9.5 3 12l1.5-5L1 4.5h4.5L7 0z"/>
        </svg>
      ))}
      <span className="text-[11px] font-semibold text-navy/60 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Promoter card ─────────────────────────────────────────────────────────────
function PromoterCard({ p }: { p: Promoter }) {
  const initials = p.company_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <Link href={`/promoteurs/${p.id}`} className="no-underline group">
      <article className="bg-[#FDFAF6] border border-navy/10 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">

        {/* Banner / header */}
        <div className="relative h-28 bg-gradient-to-br from-navy to-navy/80 overflow-hidden">
          {p.banner_url ? (
            <img src={p.banner_url} alt="" className="w-full h-full object-cover opacity-50"/>
          ) : (
            <div className="absolute inset-0 opacity-[0.06]"
              style={{backgroundImage:"repeating-linear-gradient(45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 30px)",backgroundSize:"30px 30px"}}/>
          )}
          {/* Featured badge */}
          {p.is_featured && (
            <span className="absolute top-3 right-3 bg-gold text-navy text-[10px] font-bold px-2.5 py-1 rounded-full">
              ★ Partenaire Hestia
            </span>
          )}
          {/* Logo */}
          <div className="absolute -bottom-6 left-5 w-14 h-14 rounded-2xl bg-[#FDFAF6] border-2 border-white shadow-lg flex items-center justify-center">
            {p.logo_url
              ? <img src={p.logo_url} alt={p.company_name} className="w-10 h-10 object-contain rounded-xl"/>
              : <span className="font-display text-[16px] font-bold text-navy">{initials}</span>}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 px-5 pt-9 pb-5 gap-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-[17px] font-semibold text-navy leading-tight group-hover:text-gold transition-colors">
                {p.company_name}
              </h3>
              {p.is_verified && (
                <svg className="w-5 h-5 text-gold shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 0l1.8 5.4H17l-4.2 3.1 1.6 5.4-4.4-3.1-4.4 3.1 1.6-5.4L3 5.4h5.2L10 0z"/>
                </svg>
              )}
            </div>
            {p.slogan && <p className="text-[12px] text-cream-muted mt-0.5 italic">{p.slogan}</p>}
          </div>

          <Stars rating={p.rating}/>

          <p className="text-[12px] text-navy/60 leading-relaxed line-clamp-2 flex-1">
            {p.description}
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-navy/8">
            {[
              { v: p.total_projects, l: "Projets" },
              { v: p.total_units, l: "Unités" },
              { v: p.established_year ? `${new Date().getFullYear() - p.established_year}` : "—", l: p.established_year ? "ans d'expérience" : "" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-[18px] text-navy font-semibold leading-none">{s.v}</p>
                <p className="text-[10px] text-cream-muted mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Wilayas + specialties */}
          <div className="flex flex-wrap gap-1.5">
            {p.wilaya && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy/8 text-navy/70 font-medium flex items-center gap-1">
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M5 0C3.07 0 1.5 1.57 1.5 3.5c0 2.63 3.5 6.5 3.5 6.5s3.5-3.87 3.5-6.5C8.5 1.57 6.93 0 5 0zm0 4.75a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"/>
                </svg>
                {p.wilaya}
              </span>
            )}
            {(p.specialties || []).slice(0, 2).map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-gold/30 text-cream-muted capitalize">{s}</span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <span className="text-[12px] font-semibold text-navy group-hover:text-gold transition-colors">
              Voir tous les projets →
            </span>
            {p.review_count > 0 && (
              <span className="text-[10px] text-cream-muted">{p.review_count} avis</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default async function PromotersPage() {
  let promoters: Promoter[] = [];
  try { promoters = await getAllPromoters(); } catch {}

  const featured  = promoters.filter(p => p.is_featured);
  const rest      = promoters.filter(p => !p.is_featured);
  const totalUnits = promoters.reduce((s, p) => s + p.total_units, 0);

  return (
    <>
      <Navbar/>
      <main className="bg-cream min-h-screen">

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <div className="bg-navy py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{backgroundImage:"repeating-linear-gradient(45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 40px)",backgroundSize:"40px 40px"}}/>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-3">· Annuaire promoteurs ·</div>
            <h1 className="font-display text-[42px] sm:text-[52px] text-cream font-normal leading-tight mb-4">
              Les meilleurs promoteurs<br className="hidden sm:block"/>
              <em className="not-italic text-gold"> immobiliers</em> en Tunisie
            </h1>
            <p className="text-cream/50 text-[15px] max-w-xl leading-relaxed mb-8">
              Découvrez les projets neufs directement auprès des promoteurs certifiés Hestia. {totalUnits.toLocaleString("fr-TN")}+ unités disponibles.
            </p>
            {/* Stats bar */}
            <div className="flex flex-wrap gap-6">
              {[
                { v: promoters.length, l: "Promoteurs référencés" },
                { v: promoters.reduce((s,p)=>s+p.total_projects,0), l: "Projets au total" },
                { v: `${totalUnits.toLocaleString("fr-TN")}+`, l: "Unités disponibles" },
              ].map(s => (
                <div key={s.l}>
                  <p className="font-display text-[24px] text-gold font-semibold leading-none">{s.v}</p>
                  <p className="text-[11px] text-cream/40 mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">

          {/* ── Featured promoters ─────────────────────────────────────── */}
          {featured.length > 0 && (
            <section className="mb-14">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-gold text-xl">★</span>
                <h2 className="font-display text-[26px] text-navy font-semibold">Partenaires Hestia</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map(p => <PromoterCard key={p.id} p={p}/>)}
              </div>
            </section>
          )}

          {/* ── All promoters ──────────────────────────────────────────── */}
          {rest.length > 0 && (
            <section>
              <h2 className="font-display text-[22px] text-navy font-semibold mb-6">
                Tous les promoteurs
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map(p => <PromoterCard key={p.id} p={p}/>)}
              </div>
            </section>
          )}

          {promoters.length === 0 && (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="text-5xl mb-4">🏗</div>
              <h2 className="font-display text-[26px] text-navy font-semibold mb-2">Aucun promoteur référencé</h2>
              <p className="text-cream-muted text-[13px]">Revenez bientôt.</p>
            </div>
          )}

          {/* ── CTA for promoters ──────────────────────────────────────── */}
          <div className="mt-16 bg-navy rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05]"
              style={{backgroundImage:"repeating-linear-gradient(45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 25px)",backgroundSize:"25px 25px"}}/>
            <div className="relative z-10">
              <p className="text-gold font-bold text-[11px] tracking-[0.2em] uppercase mb-3">· Vous êtes promoteur ? ·</p>
              <h2 className="font-display text-[28px] text-cream font-semibold mb-3">
                Référencez vos projets sur Hestia
              </h2>
              <p className="text-cream/50 text-[14px] max-w-lg mx-auto mb-6 leading-relaxed">
                Atteignez des milliers d'acheteurs potentiels en Tunisie. Créez votre page promoteur et publiez vos projets gratuitement.
              </p>
              <Link href="/auth/login?returnTo=/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gold text-navy font-bold text-[14px] hover:bg-gold/90 transition no-underline">
                Créer mon compte promoteur →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
