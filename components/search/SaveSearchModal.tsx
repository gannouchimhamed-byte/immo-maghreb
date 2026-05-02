"use client";

import { useState } from "react";
import { createSavedSearch } from "@/lib/supabase/client";
import type { SearchFilters } from "./SearchFilters";

interface Props {
  filters: SearchFilters;
  onClose: () => void;
  onSaved?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement", villa: "Villa", terrain: "Terrain",
  bureau: "Bureau", duplex: "Duplex", studio: "Studio",
};

function filterSummary(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.wilaya)   parts.push(String(filters.wilaya));
  if (filters.action)   parts.push(filters.action === "vente" ? "Vente" : "Location");
  if (filters.type)     parts.push(TYPE_LABELS[String(filters.type)] || String(filters.type));
  if (filters.minPrice) parts.push(`min ${Number(filters.minPrice).toLocaleString("fr-TN")} TND`);
  if (filters.maxPrice) parts.push(`max ${Number(filters.maxPrice).toLocaleString("fr-TN")} TND`);
  if (filters.rooms)    parts.push(`${filters.rooms}+ pièces`);
  if (filters.hasParking) parts.push("Parking");
  return parts.length ? parts.join(" · ") : "Tous les biens";
}

function defaultName(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.wilaya) parts.push(String(filters.wilaya));
  if (filters.type)   parts.push(TYPE_LABELS[String(filters.type)] || String(filters.type));
  if (filters.action) parts.push(filters.action === "vente" ? "Vente" : "Location");
  return parts.join(" — ") || "Ma recherche";
}

export default function SaveSearchModal({ filters, onClose, onSaved }: Props) {
  const [name, setName] = useState(defaultName(filters));
  const [channel, setChannel] = useState<"whatsapp" | "email" | "push">("whatsapp");
  const [frequency, setFrequency] = useState<"instant" | "daily" | "weekly">("instant");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const activeFilters = Object.entries(filters).filter(([k, v]) =>
    v !== "" && v !== undefined && v !== false && v !== null && k !== "commute"
  );

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const { commute, ...serializableFilters } = filters as any;
    const result = await createSavedSearch({
      name: name.trim(),
      filters: serializableFilters,
      channel,
      frequency,
    });
    setSaving(false);
    if (result) {
      setSaved(true);
      setTimeout(() => { onSaved?.(); onClose(); }, 1800);
    } else {
      setError("Erreur lors de la sauvegarde. Réessayez.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#FDFAF6] rounded-2xl shadow-2xl overflow-hidden animate-fade-up">

        {/* Header */}
        <div className="bg-navy px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-gold" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6c0 4.5 6 10 6 10s6-5.5 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-display text-[17px] text-cream font-semibold">Sauvegarder la recherche</h3>
                <p className="text-[11px] text-cream/50 mt-0.5">Alerté dès qu'un bien correspond</p>
              </div>
            </div>
            <button onClick={onClose} className="text-cream/40 hover:text-cream transition-colors mt-0.5">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {activeFilters.slice(0, 5).map(([k, v]) => (
                <span key={k} className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-cream/70">
                  {typeof v === "boolean" ? `✓ ${k}` : `${k}: ${v}`}
                </span>
              ))}
              {activeFilters.length > 5 && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-cream/50">+{activeFilters.length - 5} autres</span>
              )}
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Success */}
          {saved ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 32 32" fill="none">
                  <path d="M6 16l8 8 12-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="font-display text-[18px] text-navy font-semibold">Alerte activée !</p>
              <p className="text-[12px] text-cream-muted mt-1">Notifié dès qu'un bien correspond à vos critères.</p>
            </div>
          ) : (
            <>
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1.5">Nom de l'alerte</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ex: Appartement Lac 2 — 400K"
                  className="w-full px-3 py-2.5 rounded-xl border border-navy/15 bg-white text-[13px] text-navy placeholder:text-cream-muted/50 focus:outline-none focus:ring-2 focus:ring-gold/40"/>
              </div>

              {/* Channel */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-2">Recevoir via</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: "whatsapp" as const, l: "WhatsApp", i: "💬" },
                    { v: "email"    as const, l: "Email",     i: "📧" },
                    { v: "push"     as const, l: "Push",      i: "🔔" },
                  ]).map(c => (
                    <button key={c.v} onClick={() => setChannel(c.v)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-[12px] font-semibold transition-all ${
                        channel === c.v ? "border-navy bg-navy text-gold" : "border-navy/15 bg-white text-cream-muted hover:border-navy/30"
                      }`}>
                      <span className="text-xl leading-none">{c.i}</span>{c.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-2">Fréquence</label>
                <div className="flex gap-2">
                  {([
                    { v: "instant" as const, l: "Instantané", d: "Dès la publication" },
                    { v: "daily"   as const, l: "Quotidien",  d: "Résumé chaque matin" },
                    { v: "weekly"  as const, l: "Hebdo",      d: "Récap chaque lundi" },
                  ]).map(f => (
                    <button key={f.v} onClick={() => setFrequency(f.v)}
                      className={`flex-1 py-2.5 px-2 rounded-xl border-2 text-center transition-all ${
                        frequency === f.v ? "border-gold bg-gold/10 text-navy" : "border-navy/15 bg-white text-cream-muted hover:border-navy/30"
                      }`}>
                      <p className="text-[12px] font-bold">{f.l}</p>
                      <p className="text-[9px] mt-0.5 opacity-60">{f.d}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-navy/5 border border-navy/10">
                <svg className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 115.5 5 1.5 1.5 0 017 6.5z"/>
                </svg>
                <p className="text-[11px] text-navy/70">{filterSummary(filters)}</p>
              </div>

              {error && <p className="text-[12px] text-rose-500 text-center">{error}</p>}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-navy/15 text-[13px] font-medium text-cream-muted hover:bg-cream transition">
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving || !name.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-navy text-gold text-[13px] font-bold disabled:opacity-40 hover:bg-navy/90 transition flex items-center justify-center gap-2">
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"/>Sauvegarde…</>
                    : <>🔔 Activer l'alerte</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
