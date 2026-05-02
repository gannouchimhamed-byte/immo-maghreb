"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import {
  fetchSavedSearches, updateSavedSearch, deleteSavedSearch,
  describeFilters, CHANNEL_CFG, FREQUENCY_CFG,
  type SavedSearch, type AlertChannel, type AlertFrequency,
} from "@/lib/saved-searches";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `Il y a ${d} jour${d > 1 ? "s" : ""}`;
  if (h > 0) return `Il y a ${h}h`;
  if (m > 0) return `Il y a ${m} min`;
  return "À l'instant";
}

function buildListingsUrl(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  const fields = ["action","type","wilaya","minPrice","maxPrice","minArea","maxArea","rooms","deed"];
  fields.forEach(k => { if (filters[k]) params.set(k, String(filters[k])); });
  return `/listings?${params.toString()}`;
}

// ─── Single alert card ────────────────────────────────────────────────────────
function AlertCard({
  search,
  onToggle,
  onDelete,
  onChannelChange,
  onFrequencyChange,
}: {
  search: SavedSearch;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onChannelChange: (id: string, ch: AlertChannel) => void;
  onFrequencyChange: (id: string, fr: AlertFrequency) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const channelCfg   = CHANNEL_CFG[search.channel];
  const frequencyCfg = FREQUENCY_CFG[search.frequency];
  const preview      = describeFilters(search.filters);

  return (
    <div className={`bg-[#FDFAF6] rounded-2xl border overflow-hidden transition-all ${
      search.active ? "border-navy/10" : "border-navy/5 opacity-60"
    }`}>
      {/* Main row */}
      <div className="flex items-start gap-4 p-5">
        {/* Active toggle */}
        <button
          onClick={() => onToggle(search.id, !search.active)}
          className={`relative w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
            search.active ? "bg-gold" : "bg-navy/15"
          }`}
          title={search.active ? "Désactiver" : "Activer"}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            search.active ? "left-5" : "left-1"
          }`}/>
        </button>

        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-display text-[16px] font-semibold text-navy leading-snug">{search.name}</h3>
            {!search.active && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy/8 text-navy/50 font-medium">Pausée</span>
            )}
          </div>

          {/* Filter summary */}
          <p className="text-[12px] text-cream-muted mt-1 leading-relaxed line-clamp-1">{preview}</p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* Channel */}
            <span className="flex items-center gap-1.5 text-[11px] font-medium"
              style={{ color: channelCfg.color }}>
              <span>{channelCfg.icon}</span>
              {channelCfg.label}
            </span>

            {/* Frequency */}
            <span className="flex items-center gap-1 text-[11px] text-cream-muted">
              <span>{frequencyCfg.icon}</span>
              {frequencyCfg.label}
            </span>

            {/* Match count */}
            {search.match_count > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-gold font-semibold">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0l1.5 4.5H12L8.5 7l1.5 5L6 9l-4 3 1.5-5L0 4.5h4.5L6 0z"/>
                </svg>
                {search.match_count} correspondance{search.match_count > 1 ? "s" : ""}
              </span>
            )}

            {/* Last triggered */}
            {search.last_triggered_at && (
              <span className="text-[10px] text-cream-muted">
                Dernière alerte: {timeAgo(search.last_triggered_at)}
              </span>
            )}

            <span className="text-[10px] text-cream-muted ml-auto">
              Créée {timeAgo(search.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Link href={buildListingsUrl(search.filters)}
            className="w-8 h-8 rounded-lg bg-navy/5 hover:bg-navy/10 flex items-center justify-center transition-colors"
            title="Voir les annonces">
            <svg className="w-4 h-4 text-navy/60" viewBox="0 0 16 16" fill="none">
              <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3M9 1h6m0 0v6m0-6L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          <button onClick={() => setExpanded(!expanded)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${expanded ? "bg-navy text-gold" : "bg-navy/5 hover:bg-navy/10"}`}
            title="Modifier">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            onClick={async () => {
              if (!confirm("Supprimer cette alerte ?")) return;
              setDeleting(true);
              await onDelete(search.id);
            }}
            disabled={deleting}
            className="w-8 h-8 rounded-lg bg-navy/5 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors"
            title="Supprimer">
            {deleting
              ? <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin"/>
              : <svg className="w-4 h-4 text-navy/40" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5h10M6 5V3h4v2M7 8v5M9 8v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
            }
          </button>
        </div>
      </div>

      {/* Expanded settings */}
      {expanded && (
        <div className="border-t border-navy/8 bg-cream/50 px-5 py-4 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-navy/50">Modifier les préférences</p>

          {/* Channel */}
          <div>
            <p className="text-[11px] text-cream-muted mb-2">Canal de notification</p>
            <div className="flex gap-2">
              {(["whatsapp", "email", "push"] as AlertChannel[]).map(c => {
                const cfg = CHANNEL_CFG[c];
                return (
                  <button key={c} onClick={() => onChannelChange(search.id, c)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold transition-all ${
                      search.channel === c
                        ? "bg-navy text-gold border-navy"
                        : "bg-white text-cream-muted border-navy/15 hover:border-navy/30"
                    }`}>
                    <span>{cfg.icon}</span>{cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <p className="text-[11px] text-cream-muted mb-2">Fréquence</p>
            <div className="flex gap-2">
              {(["instant", "daily", "weekly"] as AlertFrequency[]).map(f => {
                const cfg = FREQUENCY_CFG[f];
                return (
                  <button key={f} onClick={() => onFrequencyChange(search.id, f)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold transition-all ${
                      search.frequency === f
                        ? "bg-gold/15 text-navy border-gold"
                        : "bg-white text-cream-muted border-navy/15 hover:border-navy/30"
                    }`}>
                    <span>{cfg.icon}</span>{cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter details */}
          <div>
            <p className="text-[11px] text-cream-muted mb-2">Critères de recherche</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(search.filters)
                .filter(([k, v]) => v && v !== "" && k !== "commute")
                .map(([k, v]) => (
                  <span key={k} className="text-[10px] px-2 py-1 rounded-full bg-navy/8 text-navy/60">
                    {k}: {String(v)}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SavedSearchesClient() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchSavedSearches();
    setSearches(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    setSearches(prev => prev.map(s => s.id === id ? { ...s, active } : s));
    await updateSavedSearch(id, { active });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteSavedSearch(id);
    setSearches(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleChannelChange = useCallback(async (id: string, channel: AlertChannel) => {
    setSearches(prev => prev.map(s => s.id === id ? { ...s, channel } : s));
    await updateSavedSearch(id, { channel });
  }, []);

  const handleFrequencyChange = useCallback(async (id: string, frequency: AlertFrequency) => {
    setSearches(prev => prev.map(s => s.id === id ? { ...s, frequency } : s));
    await updateSavedSearch(id, { frequency });
  }, []);

  const displayed = searches.filter(s => {
    if (filter === "active") return s.active;
    if (filter === "paused") return !s.active;
    return true;
  });

  const activeCount = searches.filter(s => s.active).length;

  return (
    <>
      <Navbar savedSearchCount={activeCount} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <div className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-2">· Mes alertes ·</div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-[32px] text-navy font-semibold leading-tight">
                Mes recherches sauvegardées
              </h1>
              <p className="text-cream-muted text-[13px] mt-1">
                {searches.length === 0
                  ? "Aucune alerte configurée"
                  : `${activeCount} alerte${activeCount !== 1 ? "s" : ""} active${activeCount !== 1 ? "s" : ""} sur ${searches.length}`}
              </p>
            </div>
            <Link href="/listings"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-gold text-[13px] font-bold hover:bg-navy/90 transition no-underline">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Nouvelle recherche
            </Link>
          </div>
        </div>

        {/* Stats row */}
        {searches.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Alertes actives", value: activeCount, icon: "🔔", color: "text-gold" },
              { label: "En pause", value: searches.length - activeCount, icon: "⏸", color: "text-cream-muted" },
              { label: "Correspondances", value: searches.reduce((s, x) => s + (x.match_count || 0), 0), icon: "🏠", color: "text-emerald-600" },
            ].map(stat => (
              <div key={stat.label} className="bg-[#FDFAF6] rounded-xl border border-navy/10 p-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className={`font-display text-[28px] font-semibold ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] text-cream-muted mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {searches.length > 0 && (
          <div className="flex gap-2 mb-6">
            {([["all", "Toutes"], ["active", "Actives"], ["paused", "En pause"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`px-4 py-2 rounded-full text-[12px] font-semibold border transition-all ${
                  filter === k ? "bg-navy text-gold border-navy" : "bg-white text-cream-muted border-navy/15 hover:border-navy/30"
                }`}>{l}</button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#FDFAF6] rounded-2xl border border-navy/8 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-6 rounded-full bg-navy/10"/>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-navy/8 rounded w-1/2"/>
                    <div className="h-3 bg-navy/5 rounded w-3/4"/>
                    <div className="flex gap-3 mt-3">
                      <div className="h-3 bg-navy/5 rounded w-16"/>
                      <div className="h-3 bg-navy/5 rounded w-20"/>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searches.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-navy/5 flex items-center justify-center mb-6 text-4xl">🔔</div>
            <h2 className="font-display text-[24px] text-navy font-semibold mb-2">Aucune alerte configurée</h2>
            <p className="text-cream-muted text-[14px] max-w-sm leading-relaxed mb-8">
              Sauvegardez votre recherche sur la page des annonces et recevez une notification dès qu'un nouveau bien correspond.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/listings" className="px-6 py-3 rounded-xl bg-navy text-gold text-[13px] font-bold hover:bg-navy/90 transition no-underline">
                Parcourir les annonces →
              </Link>
              <Link href="/map" className="px-6 py-3 rounded-xl border-2 border-navy/20 text-navy text-[13px] font-semibold hover:bg-cream transition no-underline">
                🗺 Voir la carte
              </Link>
            </div>

            {/* How it works */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl">
              {[
                { step: "1", icon: "🔍", title: "Filtrez", desc: "Utilisez les filtres sur la page annonces (type, wilaya, budget, trajet…)" },
                { step: "2", icon: "💾", title: "Sauvegardez", desc: "Cliquez sur « Sauvegarder cette recherche » dans le panneau de filtres" },
                { step: "3", icon: "🔔", title: "Soyez alerté", desc: "Recevez WhatsApp, email ou push dès qu'un nouveau bien correspond" },
              ].map(item => (
                <div key={item.step} className="bg-[#FDFAF6] rounded-xl border border-navy/8 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-navy text-gold text-[11px] font-bold flex items-center justify-center shrink-0">{item.step}</span>
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <p className="font-semibold text-[13px] text-navy mb-1">{item.title}</p>
                  <p className="text-[12px] text-cream-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12 text-cream-muted">
            <p className="text-[14px]">Aucune alerte dans cette catégorie.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {displayed.map(s => (
              <AlertCard
                key={s.id}
                search={s}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onChannelChange={handleChannelChange}
                onFrequencyChange={handleFrequencyChange}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="bg-navy-dark py-8 mt-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[11px] text-cream/20 tracking-widest">© 2026 HESTIA · TOUS DROITS RÉSERVÉS</p>
        </div>
      </footer>
    </>
  );
}
