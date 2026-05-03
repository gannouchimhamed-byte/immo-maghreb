"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import {
  getAgentProfile, getAgentListings, getAgentLeads,
  getDashboardStats, updateLeadStatus, updateLeadNote,
  scheduleVisit, toggleListingStatus, deleteListing, upsertAgentProfile,
  LEAD_STATUS_CFG, CHANNEL_CFG,
  type Lead, type AgentListing, type AgentProfile, type DashboardStats, type LeadStatus,
} from "@/lib/agent";
import { getUser } from "@/lib/auth";

// ─── Constants ────────────────────────────────────────────────────────────────
type DashTab = "overview" | "leads" | "listings" | "new-listing" | "settings";

const BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";
const WILAYAS = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan","Bizerte","Béja","Jendouba","Le Kef","Siliana","Kairouan","Kasserine","Sidi Bouzid","Sousse","Monastir","Mahdia","Sfax","Gafsa","Tozeur","Kébili","Gabès","Médenine","Tataouine"];
const TYPES = ["appartement","villa","terrain","bureau","duplex","studio","ferme"];
const TYPE_LABELS: Record<string,string> = {appartement:"Appartement",villa:"Villa",terrain:"Terrain",bureau:"Bureau",duplex:"Duplex",studio:"Studio",ferme:"Ferme"};
const fmtPrice = (p: number) => p >= 1_000_000 ? `${(p/1_000_000).toFixed(2)}M` : p >= 1_000 ? `${Math.round(p/1_000)}K` : `${p}`;
const timeAgo = (d: string) => { const diff = Date.now()-new Date(d).getTime(); const days=Math.floor(diff/86400000); if(days>0) return `${days}j`; const hrs=Math.floor(diff/3600000); if(hrs>0) return `${hrs}h`; return "récent"; };

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, highlight }: { icon: string; label: string; value: string|number; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border flex flex-col gap-1 ${highlight ? "bg-navy border-navy" : "bg-[#FDFAF6] border-navy/10"}`}>
      <span className="text-2xl">{icon}</span>
      <span className={`font-display text-[30px] font-semibold leading-none mt-1 ${highlight ? "text-gold" : "text-navy"}`}>{value}</span>
      <span className={`text-[12px] font-semibold ${highlight ? "text-cream/70" : "text-navy"}`}>{label}</span>
      {sub && <span className={`text-[11px] ${highlight ? "text-cream/40" : "text-cream-muted"}`}>{sub}</span>}
    </div>
  );
}

// ─── Lead card (Kanban-style) ──────────────────────────────────────────────────
function LeadCard({ lead, onStatusChange, onNoteChange, onVisit }: {
  lead: Lead;
  onStatusChange: (id: string, s: LeadStatus) => void;
  onNoteChange: (id: string, note: string) => void;
  onVisit: (id: string, dt: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(lead.agent_note || "");
  const [savingNote, setSavingNote] = useState(false);
  const cfg = LEAD_STATUS_CFG[lead.status];
  const chCfg = CHANNEL_CFG[lead.channel];

  const handleSaveNote = async () => {
    setSavingNote(true);
    await onNoteChange(lead.id, note);
    setSavingNote(false);
  };

  return (
    <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {/* Avatar initials */}
        <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-gold font-display text-[15px] shrink-0">
          {(lead.seeker_name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-navy text-[13px] truncate">{lead.seeker_name || "Anonyme"}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          </div>
          <p className="text-[11px] text-cream-muted mt-0.5 flex items-center gap-1.5">
            <span>{chCfg.icon}</span>{chCfg.label}
            {lead.listing && <><span>·</span><span className="truncate">{lead.listing.title}</span></>}
            <span className="ml-auto">{timeAgo(lead.created_at)}</span>
          </p>
        </div>
        <svg className={`w-4 h-4 text-cream-muted shrink-0 transition-transform ${expanded?"rotate-180":""}`} viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-navy/8 p-4 space-y-4">
          {/* Message */}
          {lead.message && (
            <div className="bg-cream rounded-xl p-3">
              <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wider mb-1">Message</p>
              <p className="text-[13px] text-navy leading-relaxed">{lead.message}</p>
            </div>
          )}

          {/* Contact info */}
          {lead.seeker_phone && (
            <div className="flex items-center gap-2">
              <a href={`https://wa.me/${lead.seeker_phone.replace(/\D/g,"")}?text=Bonjour, je vous contacte concernant votre demande sur Hestia.`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] text-[12px] font-semibold hover:bg-[#25D366]/20 transition no-underline">
                💬 WhatsApp · {lead.seeker_phone}
              </a>
            </div>
          )}

          {/* Status change */}
          <div>
            <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wider mb-2">Changer le statut</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(LEAD_STATUS_CFG) as LeadStatus[]).map(s => (
                <button key={s} onClick={() => onStatusChange(lead.id, s)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                    lead.status === s
                      ? `${LEAD_STATUS_CFG[s].bg} ${LEAD_STATUS_CFG[s].color} ring-2 ring-offset-1 ring-current`
                      : `${LEAD_STATUS_CFG[s].bg} ${LEAD_STATUS_CFG[s].color} opacity-50 hover:opacity-100`
                  }`}>
                  {LEAD_STATUS_CFG[s].icon} {LEAD_STATUS_CFG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Visit scheduling */}
          <div>
            <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wider mb-2">Planifier une visite</p>
            <div className="flex gap-2">
              <input type="datetime-local" defaultValue={lead.visit_scheduled_at?.slice(0,16) || ""}
                onChange={e => e.target.value && onVisit(lead.id, e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-navy/15 bg-white text-[12px] text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"/>
            </div>
            {lead.visit_scheduled_at && (
              <p className="text-[11px] text-emerald-600 mt-1">✓ Visite: {new Date(lead.visit_scheduled_at).toLocaleString("fr-TN")}</p>
            )}
          </div>

          {/* Agent note */}
          <div>
            <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wider mb-2">Note interne</p>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Ajouter une note privée sur ce prospect…"
              className="w-full px-3 py-2 rounded-xl border border-navy/15 bg-white text-[12px] text-navy resize-none focus:outline-none focus:ring-2 focus:ring-gold/40"/>
            <button onClick={handleSaveNote} disabled={savingNote}
              className="mt-1.5 px-3 py-1.5 rounded-lg bg-navy text-gold text-[11px] font-semibold hover:bg-navy/90 transition disabled:opacity-50">
              {savingNote ? "Sauvegarde…" : "Sauvegarder la note"}
            </button>
          </div>

          {/* Listing link */}
          {lead.listing && (
            <Link href={`/listings/${lead.listing.id}`}
              className="flex items-center gap-2 text-[12px] text-navy/60 hover:text-gold transition no-underline">
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M1 13V5L7 1l6 4v8H9V9H5v4H1z" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              Voir l'annonce: {lead.listing.title}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Listing row ───────────────────────────────────────────────────────────────
function ListingRow({ listing, onToggle, onDelete }: {
  listing: AgentListing;
  onToggle: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isActive = listing.status === "active";

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isActive ? "border-navy/10 bg-[#FDFAF6]" : "border-navy/5 bg-[#FDFAF6]/50 opacity-60"}`}>
      {/* Thumbnail */}
      <div className="w-16 h-12 rounded-lg overflow-hidden bg-navy/5 shrink-0 relative">
        {listing.primary_image_url
          ? <Image src={listing.primary_image_url} alt={listing.title} fill className="object-cover" sizes="64px" placeholder="blur" blurDataURL={BLUR}/>
          : <div className="w-full h-full flex items-center justify-center text-xl opacity-20">🏛</div>}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-navy text-[13px] truncate">{listing.title}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-navy/8 text-navy/50"}`}>
            {isActive ? "Active" : "Inactive"}
          </span>
          {listing.is_featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-navy font-bold">★ Vedette</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-cream-muted">
          <span className="font-medium text-navy">{fmtPrice(listing.price)} TND</span>
          <span>·</span><span>{listing.area_m2}m²</span>
          <span>·</span><span>{listing.wilaya || "—"}</span>
          <span>·</span>
          <span className="flex items-center gap-1">👁 {listing.view_count || 0} vues</span>
          <span>·</span>
          <span className="flex items-center gap-1">📩 {listing.lead_count || 0} leads</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Link href={`/listings/${listing.id}`}
          className="w-8 h-8 rounded-lg bg-navy/5 hover:bg-navy/10 flex items-center justify-center transition" title="Voir">
          <svg className="w-4 h-4 text-navy/50" viewBox="0 0 16 16" fill="none">
            <path d="M8 3C4.5 3 1.5 8 1.5 8s3 5 6.5 5 6.5-5 6.5-5-3-5-6.5-5z" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </Link>
        <button onClick={() => onToggle(listing.id, listing.status)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition text-[11px] ${isActive ? "bg-amber-50 hover:bg-amber-100 text-amber-600" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"}`}
          title={isActive ? "Désactiver" : "Activer"}>
          {isActive ? "⏸" : "▶"}
        </button>
        <button
          onClick={async () => { if (!confirm("Supprimer cette annonce ?")) return; setDeleting(true); await onDelete(listing.id); }}
          disabled={deleting}
          className="w-8 h-8 rounded-lg bg-navy/5 hover:bg-rose-50 hover:text-rose-500 text-navy/30 flex items-center justify-center transition">
          {deleting ? <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin"/> :
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 5.5h10M6 5.5V3.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v2M7 8.5v3.5M9 8.5v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>}
        </button>
      </div>
    </div>
  );
}

// ─── New Listing Form ──────────────────────────────────────────────────────────
function NewListingForm({ agentId, onSuccess }: { agentId: string; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: "", price: "", area_m2: "", rooms: "", bathrooms: "", floor: "",
    action: "vente", type: "appartement", wilaya: "", district: "",
    description: "", deed: "", has_parking: false, has_elevator: false,
    has_pool: false, has_terrace: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const upd = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.area_m2 || !form.wilaya) {
      setError("Titre, prix, surface et wilaya sont obligatoires."); return;
    }
    setSaving(true); setError("");
    const sb = (await import("@/lib/supabase/client")).createClient();
    const { error: err } = await sb.from("listings").insert({
      title: form.title, price: Number(form.price), area_m2: Number(form.area_m2),
      rooms: form.rooms ? Number(form.rooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      floor: form.floor ? Number(form.floor) : null,
      action: form.action, type: form.type, wilaya: form.wilaya,
      district: form.district || null, description: form.description || null,
      deed: form.deed || null,
      has_parking: form.has_parking, has_elevator: form.has_elevator,
      has_pool: form.has_pool, has_terrace: form.has_terrace,
      agent_id: agentId, status: "active",
    });
    setSaving(false);
    if (err) { setError("Erreur lors de la publication. Réessayez."); return; }
    onSuccess();
  };

  const INPUT = "w-full px-4 py-3 rounded-xl border-2 border-navy/15 bg-white text-[13px] text-navy focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all placeholder:text-cream-muted/50";
  const SEL_STYLE = {backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",backgroundSize:"16px"};
  const SELECT = `${INPUT} appearance-none`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-display text-[20px] text-navy font-semibold mb-1">Publier une annonce</h3>
        <p className="text-cream-muted text-[13px]">Remplissez les informations du bien</p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Titre de l'annonce *</label>
        <input type="text" value={form.title} onChange={e => upd("title", e.target.value)}
          placeholder="Ex: Appartement de luxe — Lac 2, Tunis" className={INPUT}/>
      </div>

      {/* Action + Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Transaction *</label>
          <select value={form.action} onChange={e => upd("action", e.target.value)} className={SELECT} style={SEL_STYLE}>
            <option value="vente">Vente</option>
            <option value="location">Location</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Type de bien *</label>
          <select value={form.type} onChange={e => upd("type", e.target.value)} className={SELECT} style={SEL_STYLE}>
            {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>
      </div>

      {/* Price + Area */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Prix (TND) *</label>
          <input type="number" value={form.price} onChange={e => upd("price", e.target.value)} placeholder="350000" className={INPUT}/>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Surface (m²) *</label>
          <input type="number" value={form.area_m2} onChange={e => upd("area_m2", e.target.value)} placeholder="120" className={INPUT}/>
        </div>
      </div>

      {/* Rooms + Bathrooms + Floor */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Pièces</label>
          <input type="number" value={form.rooms} onChange={e => upd("rooms", e.target.value)} placeholder="3" className={INPUT}/>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">SDB</label>
          <input type="number" value={form.bathrooms} onChange={e => upd("bathrooms", e.target.value)} placeholder="2" className={INPUT}/>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Étage</label>
          <input type="number" value={form.floor} onChange={e => upd("floor", e.target.value)} placeholder="3" className={INPUT}/>
        </div>
      </div>

      {/* Wilaya + District */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Wilaya *</label>
          <select value={form.wilaya} onChange={e => upd("wilaya", e.target.value)} className={SELECT} style={SEL_STYLE}>
            <option value="">Sélectionner</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Quartier / Délégation</label>
          <input type="text" value={form.district} onChange={e => upd("district", e.target.value)} placeholder="Lac 2, La Marsa…" className={INPUT}/>
        </div>
      </div>

      {/* Deed */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Titre de propriété</label>
        <select value={form.deed} onChange={e => upd("deed", e.target.value)} className={SELECT} style={SEL_STYLE}>
          <option value="">Non spécifié</option>
          <option value="titre_bleu">Titre Bleu</option>
          <option value="titre_arabe">Titre Arabe</option>
          <option value="henchir">Henchir</option>
          <option value="wakf">Wakf</option>
          <option value="manucipe">Manucipe</option>
        </select>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-3">Équipements</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {k:"has_parking",l:"🅿 Parking"},{k:"has_elevator",l:"⬆ Ascenseur"},
            {k:"has_pool",l:"🏊 Piscine"},{k:"has_terrace",l:"☀ Terrasse"},
          ].map(eq => (
            <label key={eq.k} className="flex items-center gap-2 cursor-pointer">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${(form as any)[eq.k] ? "bg-navy border-navy" : "border-navy/20 hover:border-navy/40"}`}
                onClick={() => upd(eq.k, !(form as any)[eq.k])}>
                {(form as any)[eq.k] && <svg className="w-3 h-3 text-gold" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </div>
              <span className="text-[12px] text-navy">{eq.l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Description</label>
        <textarea value={form.description} onChange={e => upd("description", e.target.value)} rows={4}
          placeholder="Décrivez le bien, ses atouts, l'environnement…"
          className={`${INPUT} resize-none`}/>
      </div>

      {error && <p className="text-[12px] text-rose-500 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{error}</p>}

      <button type="submit" disabled={saving}
        className="w-full py-4 rounded-xl bg-navy text-gold text-[14px] font-bold hover:bg-navy/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
        {saving
          ? <><div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin"/>Publication…</>
          : "✓ Publier l'annonce"}
      </button>
    </form>
  );
}

// ─── Agent Settings ────────────────────────────────────────────────────────────
function AgentSettings({ profile, userId, onSaved }: {
  profile: AgentProfile | null; userId: string; onSaved: (p: AgentProfile) => void;
}) {
  const [form, setForm] = useState({
    agency_name: profile?.agency_name || "",
    bio: profile?.bio || "",
    license_number: profile?.license_number || "",
    phone: profile?.phone || "",
    whatsapp_phone: profile?.whatsapp_phone || "",
    wilaya: profile?.wilaya || "",
    response_time_minutes: profile?.response_time_minutes?.toString() || "30",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const INPUT = "w-full px-4 py-3 rounded-xl border-2 border-navy/15 bg-white text-[13px] text-navy focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all";
  const SEL_STYLE = {backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",backgroundSize:"16px"};

  // Also update user role to 'agent'
  const handleSave = async () => {
    setSaving(true);
    const sb = (await import("@/lib/supabase/client")).createClient();
    // Set role to agent
    await sb.from("users").update({ role: "agent" }).eq("id", userId);
    // Upsert profile
    const ok = await upsertAgentProfile(userId, {
      agency_name: form.agency_name || null,
      bio: form.bio || null,
      license_number: form.license_number || null,
      phone: form.phone || null,
      whatsapp_phone: form.whatsapp_phone || null,
      wilaya: form.wilaya || null,
      response_time_minutes: form.response_time_minutes ? Number(form.response_time_minutes) : null,
    });
    setSaving(false);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-display text-[20px] text-navy font-semibold mb-1">Profil Agent</h3>
        <p className="text-cream-muted text-[13px]">Ces informations apparaissent sur vos annonces</p>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Nom de l'agence</label>
        <input type="text" value={form.agency_name} onChange={e => setForm(f=>({...f,agency_name:e.target.value}))} placeholder="Agence El Amir" className={INPUT}/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Téléphone</label>
          <input type="tel" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="+216 XX XXX XXX" className={INPUT}/>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">WhatsApp Business</label>
          <input type="tel" value={form.whatsapp_phone} onChange={e => setForm(f=>({...f,whatsapp_phone:e.target.value}))} placeholder="+216 XX XXX XXX" className={INPUT}/>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Wilaya principale</label>
          <select value={form.wilaya} onChange={e => setForm(f=>({...f,wilaya:e.target.value}))} className={`${INPUT} appearance-none`} style={SEL_STYLE}>
            <option value="">Sélectionner</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">N° de licence SAMSAR</label>
          <input type="text" value={form.license_number} onChange={e => setForm(f=>({...f,license_number:e.target.value}))} placeholder="SAM-2024-XXXX" className={INPUT}/>
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Temps de réponse moyen (minutes)</label>
        <div className="flex gap-2">
          {["15","30","60","120"].map(t => (
            <button key={t} onClick={() => setForm(f=>({...f,response_time_minutes:t}))}
              className={`flex-1 py-2 rounded-xl border text-[12px] font-semibold transition-all ${form.response_time_minutes===t?"bg-navy text-gold border-navy":"bg-white text-cream-muted border-navy/15 hover:border-navy/30"}`}>
              {t} min
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Bio / Présentation</label>
        <textarea value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))} rows={4}
          placeholder="Décrivez votre expérience, vos spécialités, votre zone de couverture…"
          className={`${INPUT} resize-none`}/>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-3 rounded-xl bg-navy text-gold font-bold text-[13px] hover:bg-navy/90 transition disabled:opacity-50 flex items-center gap-2">
          {saving ? <><div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"/>Sauvegarde…</> : "Sauvegarder"}
        </button>
        {saved && <span className="text-emerald-600 text-[13px] font-medium flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Profil sauvegardé
        </span>}
      </div>
    </div>
  );
}

// ─── Analytics mini-charts (CSS-only bar charts) ──────────────────────────────
function AnalyticsSection({ listings, leads }: { listings: AgentListing[]; leads: Lead[] }) {
  const STATUSES: LeadStatus[] = ["new","contacted","visit","offer","closed","lost"];
  const leadsByStatus = STATUSES.map(s => ({ s, count: leads.filter(l => l.status === s).length }));
  const maxLeads = Math.max(...leadsByStatus.map(l => l.count), 1);

  const viewsTotal = listings.reduce((s,l) => s+(l.view_count||0), 0);
  const convRate = viewsTotal > 0 ? ((leads.length / viewsTotal) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <h3 className="font-display text-[20px] text-navy font-semibold">Analytics</h3>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-4 text-center">
          <p className="font-display text-[28px] text-navy font-semibold">{viewsTotal.toLocaleString()}</p>
          <p className="text-[11px] text-cream-muted mt-0.5">Vues totales</p>
        </div>
        <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-4 text-center">
          <p className="font-display text-[28px] text-navy font-semibold">{leads.length}</p>
          <p className="text-[11px] text-cream-muted mt-0.5">Leads reçus</p>
        </div>
        <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-4 text-center">
          <p className="font-display text-[28px] text-navy font-semibold">{convRate}%</p>
          <p className="text-[11px] text-cream-muted mt-0.5">Taux conversion</p>
        </div>
        <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-4 text-center">
          <p className="font-display text-[28px] text-gold font-semibold">{leads.filter(l=>l.status==="closed").length}</p>
          <p className="text-[11px] text-cream-muted mt-0.5">Ventes conclues</p>
        </div>
      </div>

      {/* Leads by status bar chart */}
      <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-6">
        <p className="text-[12px] font-bold uppercase tracking-wider text-navy/50 mb-5">Leads par statut</p>
        <div className="space-y-3">
          {leadsByStatus.map(({ s, count }) => {
            const cfg = LEAD_STATUS_CFG[s];
            const pct = (count / maxLeads) * 100;
            return (
              <div key={s} className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-navy/60 w-20 shrink-0">{cfg.label}</span>
                <div className="flex-1 h-6 bg-navy/5 rounded-lg overflow-hidden">
                  <div className={`h-full rounded-lg transition-all duration-700 ${cfg.bg}`} style={{width:`${pct}%`}}/>
                </div>
                <span className="text-[12px] font-bold text-navy w-5 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top listings by views */}
      {listings.length > 0 && (
        <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-6">
          <p className="text-[12px] font-bold uppercase tracking-wider text-navy/50 mb-4">Top annonces par vues</p>
          <div className="space-y-3">
            {[...listings].sort((a,b)=>(b.view_count||0)-(a.view_count||0)).slice(0,5).map((l,i) => (
              <div key={l.id} className="flex items-center gap-3">
                <span className="font-display text-[15px] text-navy/30 w-4 text-center">{i+1}</span>
                <Link href={`/listings/${l.id}`} className="flex-1 text-[13px] font-medium text-navy hover:text-gold transition truncate no-underline">{l.title}</Link>
                <span className="text-[12px] text-cream-muted shrink-0">👁 {(l.view_count||0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardClient() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [listings, setListings] = useState<AgentListing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DashTab>("overview");
  const [leadFilter, setLeadFilter] = useState<LeadStatus | "all">("all");

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    getUser().then(async u => {
      if (!u) { router.push("/auth/login?returnTo=/dashboard"); return; }
      setUserId(u.id);
      const [prof, lstgs, lds] = await Promise.all([
        getAgentProfile(u.id),
        getAgentListings(u.id),
        getAgentLeads(u.id),
      ]);
      setProfile(prof);
      setListings(lstgs);
      setLeads(lds);
      setStats(await getDashboardStats(u.id, lstgs, lds));
      setLoading(false);
    });
  }, [router]);

  // ── Lead actions ─────────────────────────────────────────────────────────
  const handleLeadStatus = useCallback(async (id: string, status: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await updateLeadStatus(id, status);
  }, []);

  const handleLeadNote = useCallback(async (id: string, note: string) => {
    await updateLeadNote(id, note);
  }, []);

  const handleVisit = useCallback(async (id: string, dt: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, visit_scheduled_at: dt, status: "visit" } : l));
    await scheduleVisit(id, dt);
  }, []);

  // ── Listing actions ───────────────────────────────────────────────────────
  const handleToggleListing = useCallback(async (id: string, status: string) => {
    const newStatus = status === "active" ? "inactive" : "active";
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    await toggleListingStatus(id, status);
  }, []);

  const handleDeleteListing = useCallback(async (id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
    await deleteListing(id);
  }, []);

  const filteredLeads = leadFilter === "all" ? leads : leads.filter(l => l.status === leadFilter);
  const newLeadsCount = leads.filter(l => l.status === "new").length;

  // ── Tabs config ───────────────────────────────────────────────────────────
  const TABS: { id: DashTab; icon: string; label: string; badge?: number }[] = [
    { id: "overview",     icon: "📊", label: "Vue d'ensemble" },
    { id: "leads",        icon: "📩", label: "Leads", badge: newLeadsCount || undefined },
    { id: "listings",     icon: "🏠", label: "Annonces", badge: listings.filter(l=>l.status==="active").length || undefined },
    { id: "new-listing",  icon: "➕", label: "Nouvelle annonce" },
    { id: "settings",     icon: "⚙", label: "Mon profil" },
  ];

  if (loading) return (
    <>
      <Navbar/>
      <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="grid grid-cols-4 gap-4">{[0,1,2,3].map(i => <div key={i} className="h-28 bg-navy/8 rounded-2xl"/>)}</div>
        <div className="h-96 bg-navy/5 rounded-2xl"/>
      </div>
    </>
  );

  return (
    <>
      <Navbar/>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-1">· Tableau de bord agent ·</div>
            <h1 className="font-display text-[28px] text-navy font-semibold leading-tight">
              Bonjour{profile?.agency_name ? `, ${profile.agency_name}` : ""} 👋
            </h1>
            <p className="text-cream-muted text-[13px] mt-1">
              {newLeadsCount > 0
                ? <><span className="text-gold font-semibold">{newLeadsCount} nouveau{newLeadsCount>1?"x":""} lead{newLeadsCount>1?"s":""}</span> en attente de réponse</>
                : "Votre tableau de bord est à jour"}
            </p>
          </div>
          <button onClick={() => setTab("new-listing")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-navy font-bold text-[13px] hover:bg-gold/90 transition">
            ➕ Nouvelle annonce
          </button>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard icon="🏠" label="Annonces actives" value={stats.activeListings} sub={`sur ${stats.totalListings} total`}/>
            <StatCard icon="📩" label="Leads reçus" value={stats.totalLeads} sub={`${stats.newLeads} nouveaux`} highlight={stats.newLeads > 0}/>
            <StatCard icon="👁" label="Vues totales" value={stats.totalViews.toLocaleString()} sub="sur toutes les annonces"/>
            <StatCard icon="🤝" label="Ventes conclues" value={stats.closedDeals} sub="deals fermés"/>
          </div>
        )}

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-[#FDFAF6] border border-navy/10 rounded-2xl p-1.5 mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${
                tab === t.id ? "bg-navy text-gold shadow-sm" : "text-cream-muted hover:text-navy hover:bg-navy/5"
              }`}>
              <span className="hidden sm:inline">{t.icon}</span>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab===t.id?"bg-gold/20 text-gold":"bg-navy/10 text-navy/60"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview tab ────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 animate-fade-up">
            <AnalyticsSection listings={listings} leads={leads}/>

            {/* Recent leads sidebar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[18px] text-navy font-semibold">Leads récents</h3>
                <button onClick={() => setTab("leads")} className="text-[12px] text-gold hover:underline">Tout voir</button>
              </div>
              {leads.slice(0,5).map(l => {
                const cfg = LEAD_STATUS_CFG[l.status];
                return (
                  <div key={l.id} className="flex items-center gap-3 p-3 bg-[#FDFAF6] border border-navy/8 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-gold font-display text-[13px] shrink-0">
                      {(l.seeker_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-navy truncate">{l.seeker_name || "Anonyme"}</p>
                      <p className="text-[10px] text-cream-muted truncate">{l.listing?.title || "Annonce inconnue"}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                );
              })}
              {leads.length === 0 && (
                <div className="text-center py-10 text-cream-muted">
                  <p className="text-3xl mb-2">📩</p>
                  <p className="text-[13px]">Aucun lead pour l'instant</p>
                </div>
              )}

              {/* Recent listings */}
              <div className="flex items-center justify-between mt-2">
                <h3 className="font-display text-[18px] text-navy font-semibold">Annonces récentes</h3>
                <button onClick={() => setTab("listings")} className="text-[12px] text-gold hover:underline">Tout voir</button>
              </div>
              {listings.slice(0,3).map(l => (
                <div key={l.id} className="flex items-center gap-3 p-3 bg-[#FDFAF6] border border-navy/8 rounded-xl">
                  <div className="w-12 h-9 rounded-lg overflow-hidden bg-navy/5 shrink-0 relative">
                    {l.primary_image_url
                      ? <Image src={l.primary_image_url} alt={l.title} fill className="object-cover" sizes="48px" placeholder="blur" blurDataURL={BLUR}/>
                      : <div className="w-full h-full flex items-center justify-center text-sm opacity-20">🏛</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-navy truncate">{l.title}</p>
                    <p className="text-[10px] text-cream-muted">{fmtPrice(l.price)} TND · 👁{l.view_count||0}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.status==="active"?"bg-emerald-100 text-emerald-700":"bg-navy/8 text-navy/50"}`}>
                    {l.status==="active"?"Active":"Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Leads tab ───────────────────────────────────────────────────── */}
        {tab === "leads" && (
          <div className="animate-fade-up">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setLeadFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${leadFilter==="all"?"bg-navy text-gold border-navy":"bg-white text-cream-muted border-navy/15 hover:border-navy/30"}`}>
                  Tous ({leads.length})
                </button>
                {(Object.keys(LEAD_STATUS_CFG) as LeadStatus[]).map(s => (
                  <button key={s} onClick={() => setLeadFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${leadFilter===s?`bg-navy text-gold border-navy`:""} ${leadFilter!==s?`${LEAD_STATUS_CFG[s].bg} ${LEAD_STATUS_CFG[s].color} border-transparent`:""}`}>
                    {LEAD_STATUS_CFG[s].icon} {LEAD_STATUS_CFG[s].label} ({leads.filter(l=>l.status===s).length})
                  </button>
                ))}
              </div>
              <span className="ml-auto text-[12px] text-cream-muted">{filteredLeads.length} lead{filteredLeads.length!==1?"s":""}</span>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="text-5xl mb-4">📩</div>
                <h3 className="font-display text-[22px] text-navy font-semibold mb-2">Aucun lead dans cette catégorie</h3>
                <p className="text-cream-muted text-[13px]">Les leads s'afficheront ici dès qu'un visiteur vous contacte.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map(l => (
                  <LeadCard key={l.id} lead={l}
                    onStatusChange={handleLeadStatus}
                    onNoteChange={handleLeadNote}
                    onVisit={handleVisit}/>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Listings tab ────────────────────────────────────────────────── */}
        {tab === "listings" && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-cream-muted text-[13px]">{listings.filter(l=>l.status==="active").length} actives · {listings.filter(l=>l.status!=="active").length} inactives</p>
              </div>
              <button onClick={() => setTab("new-listing")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-gold text-[12px] font-bold hover:bg-navy/90 transition">
                ➕ Nouvelle annonce
              </button>
            </div>

            {listings.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="text-5xl mb-4">🏠</div>
                <h3 className="font-display text-[22px] text-navy font-semibold mb-2">Aucune annonce publiée</h3>
                <button onClick={() => setTab("new-listing")} className="mt-4 px-6 py-3 rounded-xl bg-navy text-gold font-bold text-[13px] hover:bg-navy/90 transition">
                  Publier ma première annonce →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map(l => (
                  <ListingRow key={l.id} listing={l}
                    onToggle={handleToggleListing}
                    onDelete={handleDeleteListing}/>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── New listing tab ──────────────────────────────────────────────── */}
        {tab === "new-listing" && userId && (
          <div className="animate-fade-up">
            <NewListingForm agentId={userId} onSuccess={() => {
              setTab("listings");
              // Reload listings
              getAgentListings(userId).then(setListings);
            }}/>
          </div>
        )}

        {/* ── Settings tab ────────────────────────────────────────────────── */}
        {tab === "settings" && userId && (
          <div className="animate-fade-up">
            <AgentSettings profile={profile} userId={userId} onSaved={setProfile}/>
          </div>
        )}

      </main>
    </>
  );
}
