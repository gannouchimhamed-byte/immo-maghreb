import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import {
  getPromoterById, getPromoterListings, getPromoterStats,
  CONSTRUCTION_STATUS_CFG,
  type Promoter, type PromoterListing,
} from "@/lib/promoter";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const { id } = await params;
  const p = await getPromoterById(id);
  if (!p) return {};
  return {
    title: `${p.company_name} — Promoteur immobilier en Tunisie | Hestia`,
    description: p.description?.slice(0, 160) || `Découvrez les projets de ${p.company_name} sur Hestia.`,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (p: number, a: string) => {
  if (a === "location") return `${Math.round(p).toLocaleString("fr-TN")} TND/mois`;
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(2)}M TND`;
  if (p >= 1_000)     return `${(p / 1_000).toFixed(0)}K TND`;
  return `${p.toLocaleString("fr-TN")} TND`;
};
const BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

// ─── Star rating ──────────────────────────────────────────────────────────────
function Stars({ rating, count }: { rating: number | null; count: number }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map(n => (
        <svg key={n} className={`w-4 h-4 ${n <= Math.round(rating) ? "text-gold" : "text-navy/15"}`}
          viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 0l1.5 4.5H13l-3.5 2.5L11 12 7 9.5 3 12l1.5-5L1 4.5h4.5L7 0z"/>
        </svg>
      ))}
      <span className="text-[13px] font-semibold text-navy ml-1">{rating.toFixed(1)}</span>
      <span className="text-[12px] text-cream-muted">({count} avis)</span>
    </div>
  );
}

// ─── Listing mini card ────────────────────────────────────────────────────────
function ListingCard({ l }: { l: PromoterListing }) {
  const statusCfg = l.construction_status ? CONSTRUCTION_STATUS_CFG[l.construction_status] : null;
  const location = [l.district || l.delegation, l.wilaya].filter(Boolean).join(", ");

  return (
    <Link href={`/listings/${l.id}`} className="no-underline group">
      <article className="bg-[#FDFAF6] border border-navy/10 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-navy/5 overflow-hidden">
          {l.primary_image_url ? (
            <Image src={l.primary_image_url} alt={l.title} fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              placeholder="blur" blurDataURL={BLUR} sizes="(max-width:640px) 100vw, 33vw"/>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl opacity-10">🏛</div>
          )}
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {statusCfg && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${statusCfg.bg} ${statusCfg.color}`}>
                {statusCfg.icon} {statusCfg.label}
              </span>
            )}
            {l.is_featured && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gold text-navy">★ Vedette</span>
            )}
          </div>
          <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-lg ${l.action==="vente"?"bg-navy text-gold":"bg-gold text-navy"}`}>
            {l.action === "vente" ? "VENTE" : "LOCATION"}
          </span>
          {l.project_name && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy/70 to-transparent px-3 py-2">
              <p className="text-[11px] text-cream/80 font-semibold">{l.project_name}</p>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="font-display text-[18px] font-semibold text-navy leading-tight">
            {fmtPrice(l.price, l.action)}
          </p>
          <p className="text-[12px] text-navy/70 line-clamp-1 mt-1">{l.title}</p>
          {location && (
            <p className="text-[11px] text-cream-muted mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 0C3.79 0 2 1.79 2 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z"/>
              </svg>
              {location}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-navy/60">
            <span className="font-medium text-navy">{l.area_m2}m²</span>
            {l.rooms && <><span>·</span><span>{l.rooms}p</span></>}
            {l.bathrooms && <><span>·</span><span>{l.bathrooms}SDB</span></>}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {l.has_parking  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy/5 text-navy/60">🅿</span>}
            {l.has_elevator && <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy/5 text-navy/60">⬆</span>}
            {l.has_pool     && <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy/5 text-navy/60">🏊</span>}
            {l.has_terrace  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy/5 text-navy/60">☀</span>}
          </div>
          <p className="text-[11px] text-cream-muted mt-2">
            👁 {(l.view_count || 0).toLocaleString("fr-TN")} vues
          </p>
        </div>
      </article>
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default async function PromoterPage({ params }: { params: any }) {
  const { id } = await params;
  let promoter: Promoter | null = null;
  let listings: PromoterListing[] = [];

  try {
    [promoter, listings] = await Promise.all([
      getPromoterById(id),
      getPromoterListings(id),
    ]);
  } catch { notFound(); }
  if (!promoter) notFound();

  const stats   = await getPromoterStats(listings);
  const projects = [...new Set(listings.map(l => l.project_name).filter(Boolean))] as string[];
  const wilayas  = [...new Set(listings.map(l => l.wilaya).filter(Boolean))] as string[];
  const waMsg   = encodeURIComponent(`Bonjour ${promoter.company_name}, je suis intéressé(e) par vos projets immobiliers sur Hestia.`);
  const initials = promoter.company_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  // Group listings by project
  const byProject: Record<string, PromoterListing[]> = {};
  const noProject: PromoterListing[] = [];
  listings.forEach(l => {
    if (l.project_name) {
      byProject[l.project_name] = [...(byProject[l.project_name] || []), l];
    } else {
      noProject.push(l);
    }
  });

  return (
    <>
      <Navbar/>
      <main className="bg-cream min-h-screen pb-16">

        {/* ── HERO BANNER ──────────────────────────────────────────────── */}
        <div className="relative bg-navy h-48 sm:h-56 overflow-hidden">
          {promoter.banner_url ? (
            <img src={promoter.banner_url} alt="" className="w-full h-full object-cover opacity-40"/>
          ) : (
            <div className="absolute inset-0 opacity-[0.05]"
              style={{backgroundImage:"repeating-linear-gradient(45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 40px)",backgroundSize:"40px 40px"}}/>
          )}
          {/* Breadcrumb */}
          <div className="absolute top-4 left-6 flex items-center gap-2 text-[11px] text-cream/50">
            <Link href="/" className="hover:text-cream transition no-underline">Accueil</Link>
            <span>/</span>
            <Link href="/promoteurs" className="hover:text-cream transition no-underline">Promoteurs</Link>
            <span>/</span>
            <span className="text-cream/80">{promoter.company_name}</span>
          </div>
        </div>

        {/* ── PROFILE HEADER ───────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative -mt-12 mb-8 flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl bg-[#FDFAF6] border-4 border-white shadow-xl flex items-center justify-center shrink-0 overflow-hidden">
              {promoter.logo_url
                ? <img src={promoter.logo_url} alt={promoter.company_name} className="w-20 h-20 object-contain"/>
                : <span className="font-display text-[26px] font-bold text-navy">{initials}</span>}
            </div>

            <div className="flex-1 sm:pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-display text-[28px] sm:text-[34px] text-navy font-semibold leading-tight">
                  {promoter.company_name}
                </h1>
                {promoter.is_verified && (
                  <span className="flex items-center gap-1 bg-gold/20 text-navy text-[11px] font-bold px-2.5 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 14 14" fill="currentColor">
                      <path d="M7 0l1.5 4.5H13l-3.5 2.5L11 12 7 9.5 3 12l1.5-5L1 4.5h4.5L7 0z"/>
                    </svg>
                    Certifié Hestia
                  </span>
                )}
                {promoter.is_featured && (
                  <span className="bg-gold text-navy text-[10px] font-bold px-2.5 py-1 rounded-full">★ Partenaire</span>
                )}
              </div>
              {promoter.slogan && <p className="text-cream-muted text-[14px] italic">{promoter.slogan}</p>}
              <Stars rating={promoter.rating} count={promoter.review_count}/>
            </div>

            {/* Contact buttons */}
            <div className="flex gap-2 sm:pb-2 shrink-0 flex-wrap">
              {promoter.whatsapp_phone && (
                <a href={`https://wa.me/${promoter.whatsapp_phone.replace(/\D/g,"")}?text=${waMsg}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-[13px] font-bold hover:bg-[#22c55e] transition shadow-lg shadow-emerald-500/20 no-underline">
                  💬 WhatsApp
                </a>
              )}
              {promoter.phone && (
                <a href={`tel:${promoter.phone}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-navy/15 text-navy text-[13px] font-semibold hover:bg-cream transition no-underline">
                  📞 Appeler
                </a>
              )}
              {promoter.website && (
                <a href={promoter.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-navy/15 text-navy text-[13px] font-semibold hover:bg-cream transition no-underline">
                  🌐 Site web
                </a>
              )}
            </div>
          </div>

          {/* ── STATS + BIO GRID ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-10">

            {/* LEFT: Bio + wilayas */}
            <div className="space-y-5">
              {/* Description */}
              {promoter.description && (
                <div className="bg-[#FDFAF6] rounded-2xl border border-navy/10 p-6">
                  <h2 className="font-display text-[17px] text-navy font-semibold mb-3">À propos de {promoter.company_name}</h2>
                  <p className="text-[13px] text-navy/70 leading-relaxed">{promoter.description}</p>
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: "🏗", v: promoter.total_projects, l: "Projets réalisés" },
                  { icon: "🏠", v: promoter.total_units,    l: "Unités construites" },
                  { icon: "✅", v: promoter.delivered_units, l: "Unités livrées" },
                  { icon: "📅", v: promoter.established_year
                    ? `${new Date().getFullYear() - promoter.established_year} ans`
                    : "—", l: "d'expérience" },
                ].map(s => (
                  <div key={s.l} className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-4 text-center">
                    <div className="text-xl mb-1">{s.icon}</div>
                    <p className="font-display text-[22px] text-navy font-semibold leading-none">{s.v}</p>
                    <p className="text-[10px] text-cream-muted mt-1">{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Wilayas coverage */}
              {(promoter.wilayas_covered || wilayas).length > 0 && (
                <div className="bg-[#FDFAF6] rounded-2xl border border-navy/10 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-3">Zones d'intervention</p>
                  <div className="flex flex-wrap gap-2">
                    {(promoter.wilayas_covered || wilayas).map(w => (
                      <Link key={w} href={`/listings?wilaya=${w}&promoter_id=${promoter!.id}`}
                        className="px-3 py-1.5 rounded-full bg-navy/5 text-navy text-[12px] font-medium hover:bg-navy hover:text-gold transition no-underline flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gold" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M6 0C3.79 0 2 1.79 2 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z"/>
                        </svg>
                        {w}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Contact card */}
            <div className="space-y-4">
              <div className="bg-[#FDFAF6] rounded-2xl border border-navy/10 p-5 sticky top-20">
                <p className="text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-4">Contacter le promoteur</p>

                {promoter.address && (
                  <div className="flex items-start gap-2 mb-3 text-[12px] text-navy/70">
                    <span className="text-base shrink-0">📍</span>
                    <span>{promoter.address}</span>
                  </div>
                )}
                {promoter.phone && (
                  <div className="flex items-center gap-2 mb-2 text-[12px] text-navy/70">
                    <span className="text-base">📞</span>
                    <a href={`tel:${promoter.phone}`} className="hover:text-gold transition">{promoter.phone}</a>
                  </div>
                )}
                {promoter.email && (
                  <div className="flex items-center gap-2 mb-4 text-[12px] text-navy/70">
                    <span className="text-base">📧</span>
                    <a href={`mailto:${promoter.email}`} className="hover:text-gold transition truncate">{promoter.email}</a>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {promoter.whatsapp_phone && (
                    <a href={`https://wa.me/${promoter.whatsapp_phone.replace(/\D/g,"")}?text=${waMsg}`}
                      target="_blank" rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-[13px] font-bold hover:bg-[#22c55e] transition no-underline">
                      💬 Contacter via WhatsApp
                    </a>
                  )}
                  {promoter.phone && (
                    <a href={`tel:${promoter.phone}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-navy/15 text-navy text-[13px] font-semibold hover:bg-cream transition no-underline">
                      📞 Appeler maintenant
                    </a>
                  )}
                </div>

                {/* Specialties */}
                {promoter.specialties && promoter.specialties.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-navy/8">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-navy/40 mb-2">Spécialités</p>
                    <div className="flex flex-wrap gap-1.5">
                      {promoter.specialties.map(s => (
                        <span key={s} className="text-[11px] px-2.5 py-1 rounded-full border border-gold/30 text-cream-muted capitalize">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {promoter.established_year && (
                  <p className="text-[11px] text-cream-muted text-center mt-4">
                    Actif depuis {promoter.established_year}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── LISTINGS BY PROJECT ───────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <h2 className="font-display text-[24px] text-navy font-semibold">
                Tous les biens · {listings.length}
              </h2>
              {/* Summary pills */}
              <div className="flex flex-wrap gap-2">
                {stats.forSale > 0 && (
                  <span className="text-[11px] px-3 py-1 rounded-full bg-navy text-gold font-semibold">
                    {stats.forSale} à vendre
                  </span>
                )}
                {stats.forRent > 0 && (
                  <span className="text-[11px] px-3 py-1 rounded-full bg-gold/20 text-navy font-semibold">
                    {stats.forRent} à louer
                  </span>
                )}
                {stats.avgPrice > 0 && (
                  <span className="text-[11px] px-3 py-1 rounded-full border border-navy/15 text-navy/60">
                    Prix moyen: {(stats.avgPrice / 1000).toFixed(0)}K TND
                  </span>
                )}
              </div>
            </div>

            {listings.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center bg-[#FDFAF6] rounded-2xl border border-navy/8">
                <div className="text-4xl mb-3">🏗</div>
                <p className="font-display text-[18px] text-navy font-semibold mb-1">Aucun bien disponible</p>
                <p className="text-cream-muted text-[13px]">Ce promoteur n'a pas encore publié de biens sur Hestia.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Listings grouped by project */}
                {Object.entries(byProject).map(([projectName, projectListings]) => (
                  <section key={projectName}>
                    {/* Project header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-navy flex items-center justify-center text-gold text-sm shrink-0">🏢</div>
                      <div>
                        <h3 className="font-display text-[18px] text-navy font-semibold">{projectName}</h3>
                        <p className="text-[11px] text-cream-muted">{projectListings.length} unité{projectListings.length>1?"s":""}</p>
                      </div>
                      {projectListings[0]?.construction_status && (() => {
                        const cfg = CONSTRUCTION_STATUS_CFG[projectListings[0].construction_status];
                        return cfg ? (
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} ml-auto`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {projectListings.map(l => <ListingCard key={l.id} l={l}/>)}
                    </div>
                  </section>
                ))}

                {/* Listings without project */}
                {noProject.length > 0 && (
                  <section>
                    {Object.keys(byProject).length > 0 && (
                      <h3 className="font-display text-[18px] text-navy font-semibold mb-4">Autres biens</h3>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {noProject.map(l => <ListingCard key={l.id} l={l}/>)}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          {/* ── JSON-LD ───────────────────────────────────────────────── */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateAgent",
            name: promoter.company_name,
            url: `https://hestia.tn/promoteurs/${promoter.id}`,
            description: promoter.description || undefined,
            telephone: promoter.phone || undefined,
            email: promoter.email || undefined,
            address: promoter.address ? {
              "@type": "PostalAddress",
              addressLocality: promoter.wilaya || undefined,
              addressCountry: "TN",
              streetAddress: promoter.address,
            } : undefined,
            aggregateRating: promoter.rating ? {
              "@type": "AggregateRating",
              ratingValue: promoter.rating,
              reviewCount: promoter.review_count,
            } : undefined,
          })}}/>
        </div>
      </main>
    </>
  );
}
