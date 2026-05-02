"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import {
  getSavedSearches, deleteSavedSearch, toggleSavedSearch,
  type SavedSearch,
} from "@/lib/supabase/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CHANNEL_CFG = {
  whatsapp: { icon: "💬", label: "WhatsApp", color: "bg-emerald-100 text-emerald-700" },
  email:    { icon: "📧", label: "Email",     color: "bg-blue-100 text-blue-700" },
  push:     { icon: "🔔", label: "Push",      color: "bg-purple-100 text-purple-700" },
};
const FREQ_CFG = {
  instant: { label: "Instantané", icon: "⚡" },
  daily:   { label: "Quotidien",  icon: "📅" },
  weekly:  { label: "Hebdo",      icon: "📆" },
};
const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement", villa: "Villa", terrain: "Terrain",
  bureau: "Bureau", duplex: "Duplex", studio: "Studio",
};

function filterToUrl(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== "" && v !== undefined && v !== false && v !== null) {
      params.set(k, String(v));
    }
  });
  return `/listings?${params.toString()}`;
}

function filterSummary(filters: Record<string, any>): string {
  const parts: string[] = [];
  if (filters.wilaya)   parts.push(filters.wilaya);
  if (filters.action)   parts.push(filters.action === "vente" ? "Vente" : "Location");
  if (filters.type)     parts.push(TYPE_LABELS[filters.type] || filters.type);
  if (filters.minPrice) parts.push(`min ${Number(filters.minPrice).toLocaleString("fr-TN")} TND`);
  if (filters.maxPrice) parts.push(`max ${Number(filters.maxPrice).toLocaleString("fr-TN")} TND`);
  if (filters.rooms)    parts.push(`${filters.rooms}+ pièces`);
  if (filters.hasParking)   parts.push("Parking");
  if (filters.hasElevator)  parts.push("Ascenseur");
  return parts.length ? parts.join(" · ") : "Tous les biens";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

// ─── Alert card ───────────────────────────────────────────────────────────────
function AlertCard({
  search,
  onDelete,
  onToggle,
}: {
  search: SavedSearch;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const channelCfg = CHANNEL_CFG[search.channel] || CHANNEL_CFG.whatsapp;
  const freqCfg    = FREQ_CFG[search.frequency] || FREQ_CFG.instant;

  const handleDelete = async () => {
    if (!confirm("Supprimer cette alerte ?")) return;
    setDeleting(true);
    await deleteSavedSearch(search.id);
    onDelete(search.id);
  };

  const handleToggle = async () => {
    setToggling(true);
    await toggleSavedSearch(search.id, !search.active);
    onToggle(search.id, !search.active);
    setToggling(false);
  };

  return (
    <div className={`bg-[#FDFAF6] rounded-2xl border transition-all ${
      search.active ? "border-navy/10 shadow-sm" : "border-navy/5 opacity-60"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Active toggle */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`relative w-11 h-6 rounded-full shrink-0 mt-0.5 transition-colors duration-200 ${
              search.active ? "bg-gold" : "bg-navy/15"
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
              search.active ? "left-5" : "left-0.5"
            }`}/>
          </button>

          <div className="min-w-0">
            <h3 className="font-display text-[16px] font-semibold text-navy truncate">{search.name}</h3>
            <p className="text-[12px] text-cream-muted mt-0.5">{filterSummary(search.filters)}</p>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-8 h-8 rounded-full flex items-center justify-center text-cream-muted hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
          title="Supprimer"
        >
          {deleting ? (
            <div className="w-4 h-4 border border-rose-400 border-t-transparent rounded-full animate-spin"/>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${channelCfg.color}`}>
          {channelCfg.icon} {channelCfg.label}
        </span>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-navy/8 text-navy/70 flex items-center gap-1">
          {freqCfg.icon} {freqCfg.label}
        </span>
        {search.match_count > 0 && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gold/15 text-navy flex items-center gap-1">
            🏠 {search.match_count} bien{search.match_count > 1 ? "s" : ""} actuel{search.match_count > 1 ? "s" : ""}
          </span>
        )}
        {!search.active && (
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-navy/5 text-cream-muted">
            En pause
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-navy/8">
        <p className="text-[11px] text-cream-muted">
          Créée {timeAgo(search.created_at)}
          {search.last_triggered_at && ` · Dernière alerte ${timeAgo(search.last_triggered_at)}`}
        </p>
        <Link
          href={filterToUrl(search.filters)}
          className="text-[11px] text-gold font-semibold hover:underline underline-offset-2 no-underline flex items-center gap-1"
        >
          Voir les biens
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AlertesClient() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedSearches().then(data => {
      setSearches(data);
      setLoading(false);
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setSearches(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleToggle = useCallback((id: string, active: boolean) => {
    setSearches(prev => prev.map(s => s.id === id ? { ...s, active: active } : s));
  }, []);

  const activeCount   = searches.filter(s => s.active).length;
  const inactiveCount = searches.filter(s => !s.active).length;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-2">· Mes Alertes ·</div>
          <h1 className="font-display text-[32px] text-navy font-semibold leading-tight">
            Recherches sauvegardées
          </h1>
          <p className="text-cream-muted text-[14px] mt-2">
            Soyez le premier informé dès qu'un bien correspond à vos critères.
          </p>
        </div>

        {/* Stats */}
        {!loading && searches.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { n: searches.length, l: "Alertes totales",  icon: "🔔" },
              { n: activeCount,     l: "Actives",           icon: "✅" },
              { n: inactiveCount,   l: "En pause",          icon: "⏸" },
            ].map(s => (
              <div key={s.l} className="bg-[#FDFAF6] rounded-xl border border-navy/10 p-4 text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="font-display text-[24px] text-navy font-semibold">{s.n}</div>
                <div className="text-[11px] text-cream-muted mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-navy/5 animate-pulse"/>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && searches.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-navy/5 flex items-center justify-center mb-5 text-4xl">🔔</div>
            <h2 className="font-display text-[22px] text-navy font-semibold mb-2">Aucune alerte</h2>
            <p className="text-cream-muted text-[14px] max-w-sm mb-8 leading-relaxed">
              Créez votre première alerte depuis la page Annonces. Vous serez notifié dès qu'un bien correspond.
            </p>
            <Link href="/listings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy text-gold font-bold text-[14px] hover:bg-navy/90 transition no-underline">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Rechercher des biens
            </Link>
          </div>
        )}

        {/* Alert list */}
        {!loading && searches.length > 0 && (
          <div className="space-y-4">
            {/* Active */}
            {activeCount > 0 && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest text-cream-muted">
                  Actives ({activeCount})
                </p>
                {searches.filter(s => s.active).map(s => (
                  <AlertCard key={s.id} search={s} onDelete={handleDelete} onToggle={handleToggle}/>
                ))}
              </>
            )}

            {/* Paused */}
            {inactiveCount > 0 && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest text-cream-muted mt-8">
                  En pause ({inactiveCount})
                </p>
                {searches.filter(s => !s.active).map(s => (
                  <AlertCard key={s.id} search={s} onDelete={handleDelete} onToggle={handleToggle}/>
                ))}
              </>
            )}
          </div>
        )}

        {/* CTA: create new */}
        {!loading && searches.length > 0 && (
          <div className="mt-10 p-6 rounded-2xl bg-navy border border-gold/15 text-center">
            <p className="font-display text-[18px] text-cream font-semibold mb-1">Créer une nouvelle alerte</p>
            <p className="text-[13px] text-cream/50 mb-4">Définissez vos critères et activez une alerte depuis la page Annonces.</p>
            <Link href="/listings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-navy font-bold text-[13px] hover:bg-gold/90 transition no-underline">
              🔍 Lancer une recherche
            </Link>
          </div>
        )}
      </main>

      <footer className="bg-navy-dark py-6 mt-16 border-t border-white/5">
        <p className="text-center text-[11px] text-cream/20 tracking-widest">© 2026 HESTIA · TOUS DROITS RÉSERVÉS</p>
      </footer>
    </>
  );
}
