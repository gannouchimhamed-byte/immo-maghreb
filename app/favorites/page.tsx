"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { getUser, getFavorites } from "@/lib/auth";

const BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

const fmtPrice = (p: number, a: string) => {
  if (a === "location") return `${Math.round(p).toLocaleString("fr-TN")} TND/mois`;
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(2)}M TND`;
  if (p >= 1_000) return `${(p / 1_000).toFixed(0)}K TND`;
  return `${p.toLocaleString("fr-TN")} TND`;
};

type SortKey = "date" | "price_asc" | "price_desc" | "area";

export default function FavoritesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("date");
  const [filterAction, setFilterAction] = useState<"all" | "vente" | "location">("all");

  useEffect(() => {
    getUser().then(async u => {
      if (!u) { router.push("/auth/login?returnTo=/favorites"); return; }
      setUserId(u.id);
      const favs = await getFavorites(u.id);
      setFavorites(favs);
      setLoading(false);
    });
  }, [router]);

  // Remove from list when un-favorited
  const handleUnfav = useCallback((listingId: string) => {
    setFavorites(prev => prev.filter(f => f.listing?.id !== listingId));
  }, []);

  // Filter + sort
  const displayed = [...favorites]
    .filter(f => filterAction === "all" || f.listing?.action === filterAction)
    .sort((a, b) => {
      const la = a.listing, lb = b.listing;
      if (!la || !lb) return 0;
      if (sort === "price_asc")  return la.price - lb.price;
      if (sort === "price_desc") return lb.price - la.price;
      if (sort === "area")       return lb.area_m2 - la.area_m2;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <>
      <Navbar/>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16">

        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-2">· Mes biens ·</div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-[32px] text-navy font-semibold leading-tight">
                Mes favoris
              </h1>
              <p className="text-cream-muted text-[13px] mt-1">
                {loading ? "Chargement…" : `${displayed.length} bien${displayed.length !== 1 ? "s" : ""} sauvegardé${displayed.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <Link href="/listings"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-gold text-[13px] font-bold hover:bg-navy/90 transition no-underline">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Chercher des biens
            </Link>
          </div>
        </div>

        {/* Filter + Sort bar */}
        {!loading && favorites.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Action filter */}
            <div className="flex rounded-xl border border-navy/15 overflow-hidden text-[12px] font-semibold">
              {([["all","Tous"],["vente","Vente"],["location","Location"]] as const).map(([v,l]) => (
                <button key={v} onClick={() => setFilterAction(v)}
                  className={`px-3.5 py-2 transition-colors ${filterAction === v ? "bg-navy text-gold" : "text-cream-muted hover:bg-cream"}`}>
                  {l}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[12px] text-cream-muted">Trier par</span>
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                className="text-[12px] border border-navy/15 rounded-lg px-3 py-2 bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold/30 appearance-none pr-7"
                style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center",backgroundSize:"14px"}}>
                <option value="date">Date d'ajout</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="area">Surface</option>
              </select>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className="bg-[#FDFAF6] rounded-2xl border border-navy/8 animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-navy/8"/>
                <div className="p-4 space-y-2">
                  <div className="h-5 w-2/3 bg-navy/8 rounded"/>
                  <div className="h-3 bg-navy/5 rounded"/>
                  <div className="h-3 w-1/2 bg-navy/5 rounded"/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && favorites.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="w-24 h-24 rounded-full bg-navy/5 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-navy/20" viewBox="0 0 24 24" fill="none">
                <path d="M12 21S3 15.5 3 8.5a5.5 5.5 0 0111 0 5.5 5.5 0 0111 0c0 7-9 12.5-9 12.5z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h2 className="font-display text-[26px] text-navy font-semibold mb-2">Aucun favori</h2>
            <p className="text-cream-muted text-[14px] max-w-sm leading-relaxed mb-8">
              Cliquez sur le ❤ à côté d'un bien pour le sauvegarder ici. Retrouvez-les à tout moment.
            </p>
            <div className="flex gap-3">
              <Link href="/listings" className="px-6 py-3 rounded-xl bg-navy text-gold font-bold text-[13px] hover:bg-navy/90 transition no-underline">
                Explorer les annonces →
              </Link>
              <Link href="/map" className="px-6 py-3 rounded-xl border-2 border-navy/15 text-navy font-semibold text-[13px] hover:bg-cream transition no-underline">
                🗺 Voir la carte
              </Link>
            </div>
          </div>
        )}

        {/* No results after filter */}
        {!loading && favorites.length > 0 && displayed.length === 0 && (
          <div className="text-center py-16 text-cream-muted">
            <p className="text-[14px]">Aucun favori pour ce filtre.</p>
            <button onClick={() => setFilterAction("all")} className="mt-3 text-gold hover:underline text-[13px]">
              Voir tous les favoris
            </button>
          </div>
        )}

        {/* Favorites grid */}
        {!loading && displayed.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map(fav => {
              const l = fav.listing;
              if (!l) return null;
              const pricePerM2 = l.area_m2 > 0 ? Math.round(l.price / l.area_m2) : null;
              const location = [l.district || l.delegation, l.wilaya].filter(Boolean).join(", ");

              return (
                <article key={fav.id}
                  className="group bg-[#FDFAF6] border border-navy/10 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col">

                  {/* Image */}
                  <Link href={`/listings/${l.id}`} className="block relative aspect-[4/3] overflow-hidden">
                    {l.primary_image_url ? (
                      <Image src={l.primary_image_url} alt={l.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        placeholder="blur" blurDataURL={BLUR} sizes="(max-width:640px) 100vw, 25vw"/>
                    ) : (
                      <div className="w-full h-full bg-navy/5 flex items-center justify-center">
                        <span className="text-4xl opacity-20">🏛</span>
                      </div>
                    )}
                    {/* Action badge */}
                    <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-lg ${l.action==="vente"?"bg-navy text-gold":"bg-gold text-navy"}`}>
                      {l.action === "vente" ? "VENTE" : "LOCATION"}
                    </span>
                  </Link>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-4 gap-2">
                    {/* Price row */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display text-[18px] font-semibold text-navy leading-tight">
                        {fmtPrice(l.price, l.action)}
                      </p>
                      {/* Heart — ImmoScout24 style: next to price/title, always visible */}
                      <FavoriteButton
                        listingId={l.id}
                        userId={userId}
                        initialFaved={true}
                        size="md"
                        variant="card"
                        onToggle={added => { if (!added) handleUnfav(l.id); }}
                      />
                    </div>

                    {pricePerM2 && (
                      <p className="text-[11px] text-cream-muted">{pricePerM2.toLocaleString("fr-TN")} TND/m²</p>
                    )}

                    {/* Title */}
                    <Link href={`/listings/${l.id}`}
                      className="text-[13px] font-semibold text-navy line-clamp-2 leading-snug hover:text-gold transition-colors no-underline">
                      {l.title}
                    </Link>

                    {/* Location */}
                    {location && (
                      <p className="text-[11px] text-cream-muted flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M6 0C3.79 0 2 1.79 2 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4zm0 5.5C5.17 5.5 4.5 4.83 4.5 4S5.17 2.5 6 2.5 7.5 3.17 7.5 4 6.83 5.5 6 5.5z"/>
                        </svg>
                        {location}
                      </p>
                    )}

                    {/* Specs */}
                    <div className="flex items-center gap-3 text-[11px] text-navy/60">
                      <span className="font-medium text-navy">{l.area_m2}m²</span>
                      {l.rooms && <><span>·</span><span>{l.rooms} pièce{l.rooms > 1 ? "s" : ""}</span></>}
                      {l.bathrooms && <><span>·</span><span>{l.bathrooms} SDB</span></>}
                    </div>

                    {/* Amenities */}
                    {(l.has_parking || l.has_elevator || l.has_pool) && (
                      <div className="flex flex-wrap gap-1">
                        {l.has_parking  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy/5 text-navy/60">🅿</span>}
                        {l.has_elevator && <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy/5 text-navy/60">⬆</span>}
                        {l.has_pool     && <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy/5 text-navy/60">🏊</span>}
                      </div>
                    )}

                    {/* Saved date + CTA */}
                    <div className="mt-auto pt-2 border-t border-navy/8 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-cream-muted">
                        ❤ {new Date(fav.created_at).toLocaleDateString("fr-TN", { day: "numeric", month: "short" })}
                      </span>
                      <Link href={`/listings/${l.id}`}
                        className="text-[11px] font-semibold text-navy hover:text-gold transition-colors no-underline flex items-center gap-0.5">
                        Voir le bien <span className="opacity-50">→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </main>
    </>
  );
}
