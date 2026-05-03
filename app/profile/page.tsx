"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import {
  getUser, getProfile, updateProfile, signOut,
  getFavorites, toggleFavorite,
  type UserProfile,
} from "@/lib/auth";
import { fetchSavedSearches, updateSavedSearch, deleteSavedSearch, CHANNEL_CFG, FREQUENCY_CFG } from "@/lib/saved-searches";
import type { SavedSearch } from "@/lib/saved-searches";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "favorites" | "alerts" | "settings";

const WILAYAS = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan","Bizerte","Béja","Jendouba","Le Kef","Siliana","Kairouan","Kasserine","Sidi Bouzid","Sousse","Monastir","Mahdia","Sfax","Gafsa","Tozeur","Kébili","Gabès","Médenine","Tataouine"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (p: number, a: string) => {
  if (a === "location") return `${Math.round(p).toLocaleString("fr-TN")} TND/mois`;
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(2)}M TND`;
  if (p >= 1_000) return `${(p / 1_000).toFixed(0)}K TND`;
  return `${p.toLocaleString("fr-TN")} TND`;
};
const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `Il y a ${days}j`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs > 0) return `Il y a ${hrs}h`;
  return "Récemment";
};
const BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

// ─── Avatar circle ─────────────────────────────────────────────────────────────
function Avatar({ profile, size = "lg" }: { profile: UserProfile; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = { sm: "w-8 h-8 text-sm", md: "w-12 h-12 text-lg", lg: "w-20 h-20 text-2xl", xl: "w-28 h-28 text-4xl" };
  const initials = profile.full_name
    ? profile.full_name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : profile.email?.charAt(0).toUpperCase() || "?";
  return (
    <div className={`${sizes[size]} rounded-full bg-navy flex items-center justify-center shrink-0 overflow-hidden ring-4 ring-gold/20`}>
      {profile.avatar_url
        ? <img src={profile.avatar_url} alt={profile.full_name || "avatar"} className="w-full h-full object-cover"/>
        : <span className="font-display font-semibold text-gold">{initials}</span>}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-5 flex flex-col">
      <span className="text-2xl mb-2">{icon}</span>
      <span className="font-display text-[28px] text-navy font-semibold leading-none">{value}</span>
      <span className="text-[12px] font-semibold text-navy mt-1">{label}</span>
      {sub && <span className="text-[11px] text-cream-muted mt-0.5">{sub}</span>}
    </div>
  );
}

// ─── Favorite listing mini-card ────────────────────────────────────────────────
function FavoriteCard({ fav, onRemove }: { fav: any; onRemove: (id: string) => void }) {
  const l = fav.listing;
  if (!l) return null;
  return (
    <div className="group bg-[#FDFAF6] border border-navy/10 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-navy/5 overflow-hidden">
        {l.primary_image_url
          ? <Image src={l.primary_image_url} alt={l.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500"
              placeholder="blur" blurDataURL={BLUR} sizes="(max-width:640px) 100vw, 33vw"/>
          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏛</div>
        }
        {/* Action badge */}
        <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-lg ${l.action==="vente"?"bg-navy text-gold":"bg-gold text-navy"}`}>
          {l.action === "vente" ? "VENTE" : "LOC"}
        </span>
        {/* Remove button */}
        <button onClick={() => onRemove(l.id)}
          className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100 hover:text-rose-500">
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        {/* Saved date */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy/60 to-transparent px-3 py-2">
          <p className="text-[10px] text-cream/70">❤ Sauvegardé {timeAgo(fav.created_at)}</p>
        </div>
      </div>
      {/* Body */}
      <div className="p-3.5">
        <p className="font-display text-[16px] font-semibold text-navy leading-tight">{fmtPrice(l.price, l.action)}</p>
        <p className="text-[12px] text-navy/70 line-clamp-1 mt-0.5">{l.title}</p>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-cream-muted">
          <span>{l.area_m2}m²</span>
          {l.rooms && <><span>·</span><span>{l.rooms}p</span></>}
          {(l.district || l.wilaya) && <><span>·</span><span className="truncate">{l.district || l.wilaya}</span></>}
        </div>
        <Link href={`/listings/${l.id}`}
          className="block mt-3 py-2 rounded-xl bg-navy/5 hover:bg-navy hover:text-gold text-navy text-[12px] font-semibold text-center transition-all no-underline">
          Voir le bien →
        </Link>
      </div>
    </div>
  );
}

// ─── Alert row ─────────────────────────────────────────────────────────────────
function AlertRow({ s, onToggle, onDelete }: {
  s: SavedSearch;
  onToggle: (id: string, v: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const ch = CHANNEL_CFG[s.channel];
  const fr = FREQUENCY_CFG[s.frequency];
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${s.active ? "border-navy/10 bg-[#FDFAF6]" : "border-navy/5 bg-[#FDFAF6]/50 opacity-60"}`}>
      {/* Toggle */}
      <button onClick={() => onToggle(s.id, !s.active)}
        className={`relative w-10 h-6 rounded-full shrink-0 transition-colors ${s.active ? "bg-gold" : "bg-navy/15"}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.active ? "left-5" : "left-1"}`}/>
      </button>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-navy text-[13px] truncate">{s.name}</p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-cream-muted">
          <span style={{color: ch.color}}>{ch.icon} {ch.label}</span>
          <span>·</span>
          <span>{fr.icon} {fr.label}</span>
          {s.match_count > 0 && <><span>·</span><span className="text-gold font-medium">{s.match_count} correspondances</span></>}
        </div>
      </div>
      {/* Actions */}
      <div className="flex gap-1.5 shrink-0">
        <Link href={`/listings?${new URLSearchParams(Object.fromEntries(Object.entries(s.filters).filter(([,v]) => v && v !== ""))).toString()}`}
          className="w-8 h-8 rounded-lg bg-navy/5 hover:bg-navy/10 flex items-center justify-center transition-colors" title="Voir les annonces">
          <svg className="w-3.5 h-3.5 text-navy/50" viewBox="0 0 14 14" fill="none">
            <path d="M5.5 2.5H3A1.5 1.5 0 001.5 4v7A1.5 1.5 0 003 12.5h7A1.5 1.5 0 0011.5 11V8.5M8.5 1.5h4m0 0v4m0-4L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <button onClick={() => onDelete(s.id)}
          className="w-8 h-8 rounded-lg bg-navy/5 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors">
          <svg className="w-3.5 h-3.5 text-navy/30" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 4.5h9M5.5 4.5V3a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1.5M6.5 7v3.5M7.5 7v3.5M3.5 4.5l.5 7a.5.5 0 00.5.5h5a.5.5 0 00.5-.5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [fullName, setFullName] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Favorites
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favsLoading, setFavsLoading] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState<SavedSearch[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    getUser().then(async u => {
      if (!u) { router.push("/auth/login?returnTo=/profile"); return; }
      setUserId(u.id);
      const p = await getProfile(u.id);
      if (p) {
        setProfile(p);
        setFullName(p.full_name || "");
        setWilaya(p.wilaya || "");
        setPhone((p as any).phone || "");
        setWhatsapp((p as any).whatsapp_phone || "");
      }
      setLoading(false);
    });
  }, [router]);

  // ── Load tab data lazily ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    if (tab === "favorites" && favorites.length === 0) {
      setFavsLoading(true);
      getFavorites(userId).then(data => { setFavorites(data); setFavsLoading(false); });
    }
    if (tab === "alerts" && alerts.length === 0) {
      setAlertsLoading(true);
      fetchSavedSearches().then(data => { setAlerts(data); setAlertsLoading(false); });
    }
  }, [tab, userId]);

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const sb = (await import("@/lib/supabase/client")).createClient();
    await sb.from("users").update({
      full_name: fullName.trim() || null,
      wilaya: wilaya || null,
      phone: phone.trim() || null,
      whatsapp_phone: whatsapp.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
    setProfile(p => p ? { ...p, full_name: fullName || null, wilaya: wilaya || null } : p);
    setSaving(false);
    setSaveMsg("✓ Profil sauvegardé");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  // ── Remove favorite ────────────────────────────────────────────────────────
  const handleRemoveFav = useCallback(async (listingId: string) => {
    if (!userId) return;
    setFavorites(prev => prev.filter(f => f.listing?.id !== listingId));
    await toggleFavorite(userId, listingId);
  }, [userId]);

  // ── Toggle alert ───────────────────────────────────────────────────────────
  const handleAlertToggle = useCallback(async (id: string, active: boolean) => {
    setAlerts(prev => prev.map(s => s.id === id ? { ...s, active } : s));
    await updateSavedSearch(id, { active });
  }, []);

  const handleAlertDelete = useCallback(async (id: string) => {
    setAlerts(prev => prev.filter(s => s.id !== id));
    await deleteSavedSearch(id);
  }, []);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) return (
    <>
      <Navbar/>
      <div className="max-w-5xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="flex gap-5 items-center">
          <div className="w-20 h-20 rounded-full bg-navy/10"/>
          <div className="space-y-2">
            <div className="h-6 w-48 bg-navy/10 rounded"/>
            <div className="h-4 w-32 bg-navy/5 rounded"/>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="h-24 bg-navy/5 rounded-2xl"/>)}
        </div>
      </div>
    </>
  );

  const activeAlerts = alerts.filter(s => s.active).length;
  const TABS: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: "overview",   icon: "👤", label: "Profil"    },
    { id: "favorites",  icon: "❤",  label: "Favoris", count: favorites.length || undefined },
    { id: "alerts",     icon: "🔔", label: "Alertes",  count: activeAlerts || undefined },
    { id: "settings",   icon: "⚙",  label: "Paramètres" },
  ];

  return (
    <>
      <Navbar/>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">

        {/* ── Profile Header ────────────────────────────────────────────────── */}
        <div className="bg-navy rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{backgroundImage:"repeating-linear-gradient(45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 30px)",backgroundSize:"30px 30px"}}/>
          {/* Big H watermark */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 font-display text-[160px] text-gold/[0.04] leading-none select-none pointer-events-none">H</div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            {profile && <Avatar profile={profile} size="xl"/>}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-display text-[28px] text-cream font-semibold leading-tight">
                  {profile?.full_name || "Utilisateur Hestia"}
                </h1>
                {profile?.is_verified && (
                  <span className="flex items-center gap-1 bg-gold/20 text-gold text-[11px] font-bold px-2.5 py-1 rounded-full">
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0L7.5 4.5H12L8.5 7l1.5 4.5L6 9 2 11.5 3.5 7 0 4.5h4.5L6 0z"/></svg>
                    Vérifié
                  </span>
                )}
              </div>
              <p className="text-cream/50 text-[14px]">{profile?.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {profile?.wilaya && (
                  <span className="flex items-center gap-1.5 text-[12px] text-cream/60 bg-white/8 rounded-full px-3 py-1">
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0C3.79 0 2 1.79 2 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z"/></svg>
                    {profile.wilaya}
                  </span>
                )}
                <span className="text-[12px] text-cream/40 bg-white/5 rounded-full px-3 py-1">
                  {profile?.role === "agent" ? "🏢 Agent" : profile?.role === "developer" ? "🏗 Promoteur" : "🔍 Chercheur"}
                </span>
              </div>
            </div>

            {/* Edit button */}
            <button onClick={() => setTab("overview")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-cream/70 text-[13px] font-medium hover:bg-white/10 transition shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Modifier
            </button>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon="❤" label="Biens favoris" value={favorites.length || "—"} sub="Sauvegardés"/>
          <StatCard icon="🔔" label="Alertes actives" value={activeAlerts || alerts.length || "—"} sub="En surveillance"/>
          <StatCard icon="📍" label="Wilaya" value={profile?.wilaya || "—"} sub="Zone de recherche"/>
          <StatCard icon="⭐" label="Compte" value={profile?.is_verified ? "Vérifié" : "Standard"} sub={profile?.role || "seeker"}/>
        </div>

        {/* ── Tab bar ───────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-[#FDFAF6] border border-navy/10 rounded-2xl p-1.5 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                tab === t.id ? "bg-navy text-gold shadow-sm" : "text-cream-muted hover:text-navy hover:bg-navy/5"
              }`}>
              <span className="hidden sm:inline">{t.icon}</span>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? "bg-gold/20 text-gold" : "bg-navy/10 text-navy/60"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview (edit profile) ──────────────────────────────────── */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 animate-fade-up">

            {/* Edit form */}
            <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-6 sm:p-8">
              <h2 className="font-display text-[20px] text-navy font-semibold mb-6">Informations personnelles</h2>
              <div className="space-y-5">

                {/* Full name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Prénom et nom</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Mohamed Ben Salem"
                    className="w-full px-4 py-3 rounded-xl border-2 border-navy/15 bg-white text-[14px] text-navy focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all placeholder:text-cream-muted/50"/>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">
                    Email
                    <span className="ml-2 text-[10px] normal-case text-cream-muted font-normal">(non modifiable)</span>
                  </label>
                  <div className="w-full px-4 py-3 rounded-xl border-2 border-navy/8 bg-navy/3 text-[14px] text-navy/50 select-none cursor-not-allowed">
                    {profile?.email || "—"}
                  </div>
                </div>

                {/* Wilaya */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Wilaya de recherche</label>
                  <select value={wilaya} onChange={e => setWilaya(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-navy/15 bg-white text-[14px] text-navy focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all appearance-none"
                    style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",backgroundSize:"16px"}}>
                    <option value="">Sélectionnez une wilaya</option>
                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>

                {/* Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Téléphone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+216 XX XXX XXX"
                      className="w-full px-4 py-3 rounded-xl border-2 border-navy/15 bg-white text-[14px] focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all placeholder:text-cream-muted/50"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">
                      WhatsApp
                      <span className="ml-1.5 text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Recommandé</span>
                    </label>
                    <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                      placeholder="+216 XX XXX XXX"
                      className="w-full px-4 py-3 rounded-xl border-2 border-navy/15 bg-white text-[14px] focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all placeholder:text-cream-muted/50"/>
                  </div>
                </div>

              </div>

              {/* Save button */}
              <div className="flex items-center gap-3 mt-7">
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-3 rounded-xl bg-navy text-gold text-[14px] font-bold hover:bg-navy/90 transition disabled:opacity-50 flex items-center gap-2 min-w-[160px] justify-center">
                  {saving
                    ? <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
                    : "Sauvegarder"}
                </button>
                {saveMsg && (
                  <span className="text-[13px] text-emerald-600 font-medium flex items-center gap-1.5 animate-fade-up">
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {saveMsg}
                  </span>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* Quick links */}
              <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-4">Accès rapide</p>
                <div className="space-y-1">
                  {[
                    { href: "/listings",       icon: "🔍", label: "Chercher un bien"   },
                    { href: "/map",            icon: "🗺",  label: "Voir la carte"      },
                    { href: "/saved-searches", icon: "🔔", label: "Gérer mes alertes"  },
                  ].map(item => (
                    <Link key={item.href} href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-navy hover:text-gold text-navy transition-all group no-underline">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-[13px] font-medium flex-1">{item.label}</span>
                      <svg className="w-4 h-4 text-navy/30 group-hover:text-gold/60 transition-colors" viewBox="0 0 16 16" fill="none">
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Hestia ID card */}
              <div className="bg-navy rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"repeating-linear-gradient(45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 20px)",backgroundSize:"20px 20px"}}/>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-gold" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1L1 4v5c0 4 3 6 7 6s7-2 7-6V4L8 1z" fill="currentColor" opacity="0.3"/>
                      <path d="M5 8l2.5 2.5L11 5.5" stroke="#D4AF64" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[11px] text-gold font-bold tracking-widest uppercase">Carte Hestia</span>
                  </div>
                  {profile && <Avatar profile={profile} size="md"/>}
                  <p className="font-display text-[17px] text-cream mt-3 font-semibold">{profile?.full_name || "—"}</p>
                  <p className="text-[11px] text-cream/40 truncate mt-0.5">{profile?.email}</p>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-cream/30 tracking-widest">HESTIA.TN</span>
                    {profile?.is_verified
                      ? <span className="text-[10px] text-gold font-semibold">★ VÉRIFIÉ</span>
                      : <span className="text-[10px] text-cream/30">STANDARD</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Favorites ────────────────────────────────────────────────── */}
        {tab === "favorites" && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-[22px] text-navy font-semibold">Mes favoris</h2>
                <p className="text-cream-muted text-[13px] mt-0.5">{favorites.length} bien{favorites.length !== 1 ? "s" : ""} sauvegardé{favorites.length !== 1 ? "s" : ""}</p>
              </div>
              <Link href="/listings" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-gold text-[12px] font-bold hover:bg-navy/90 transition no-underline">
                + Chercher
              </Link>
            </div>

            {favsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0,1,2].map(i => (
                  <div key={i} className="bg-[#FDFAF6] rounded-2xl border border-navy/8 animate-pulse">
                    <div className="aspect-[4/3] bg-navy/8 rounded-t-2xl"/>
                    <div className="p-4 space-y-2">
                      <div className="h-5 w-2/3 bg-navy/8 rounded"/>
                      <div className="h-3 w-full bg-navy/5 rounded"/>
                      <div className="h-8 bg-navy/5 rounded-lg mt-3"/>
                    </div>
                  </div>
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-navy/5 flex items-center justify-center mb-5 text-4xl">❤</div>
                <h3 className="font-display text-[22px] text-navy font-semibold mb-2">Aucun favori pour l'instant</h3>
                <p className="text-cream-muted text-[13px] max-w-xs mb-6 leading-relaxed">
                  Cliquez sur ❤ sur n'importe quel bien pour le sauvegarder ici.
                </p>
                <Link href="/listings" className="px-6 py-3 rounded-xl bg-navy text-gold font-bold text-[13px] hover:bg-navy/90 transition no-underline">
                  Explorer les annonces →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map(fav => (
                  <FavoriteCard key={fav.id} fav={fav} onRemove={handleRemoveFav}/>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Alerts ───────────────────────────────────────────────────── */}
        {tab === "alerts" && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-[22px] text-navy font-semibold">Mes alertes</h2>
                <p className="text-cream-muted text-[13px] mt-0.5">{activeAlerts} active{activeAlerts !== 1 ? "s" : ""} sur {alerts.length}</p>
              </div>
              <Link href="/listings" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-gold text-[12px] font-bold hover:bg-navy/90 transition no-underline">
                + Nouvelle alerte
              </Link>
            </div>

            {alertsLoading ? (
              <div className="space-y-3">
                {[0,1,2].map(i => <div key={i} className="h-20 bg-navy/5 rounded-2xl animate-pulse"/>)}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-navy/5 flex items-center justify-center mb-5 text-4xl">🔔</div>
                <h3 className="font-display text-[22px] text-navy font-semibold mb-2">Aucune alerte configurée</h3>
                <p className="text-cream-muted text-[13px] max-w-xs mb-6 leading-relaxed">
                  Sauvegardez une recherche depuis la page annonces pour être alerté en temps réel.
                </p>
                <Link href="/listings" className="px-6 py-3 rounded-xl bg-navy text-gold font-bold text-[13px] hover:bg-navy/90 transition no-underline">
                  Créer une alerte →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(s => (
                  <AlertRow key={s.id} s={s} onToggle={handleAlertToggle} onDelete={handleAlertDelete}/>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Settings ─────────────────────────────────────────────────── */}
        {tab === "settings" && (
          <div className="space-y-4 animate-fade-up max-w-2xl">
            <h2 className="font-display text-[22px] text-navy font-semibold mb-5">Paramètres</h2>

            {/* Notifications */}
            <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-6">
              <h3 className="font-semibold text-navy mb-4 text-[15px]">🔔 Notifications</h3>
              {[
                { label: "Alertes de prix", sub: "Recevoir une alerte si un bien baisse de prix" },
                { label: "Nouvelles annonces", sub: "Correspondant à vos critères sauvegardés" },
                { label: "Conseils marché", sub: "Tendances immobilières par wilaya" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-navy/8 last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-navy">{item.label}</p>
                    <p className="text-[11px] text-cream-muted">{item.sub}</p>
                  </div>
                  {/* Toggle placeholder — will wire to DB preferences */}
                  <div className="w-10 h-6 rounded-full bg-navy/15 relative">
                    <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow"/>
                  </div>
                </div>
              ))}
            </div>

            {/* Language */}
            <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-6">
              <h3 className="font-semibold text-navy mb-4 text-[15px]">🌐 Langue</h3>
              <div className="flex gap-2">
                {[{v:"fr",l:"Français"},{v:"ar",l:"العربية"},{v:"en",l:"English"}].map(lang => (
                  <button key={lang.v}
                    className={`flex-1 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                      lang.v === "fr" ? "bg-navy text-gold border-navy" : "bg-white text-cream-muted border-navy/15 hover:border-navy/30"
                    }`}>
                    {lang.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Account */}
            <div className="bg-[#FDFAF6] border border-navy/10 rounded-2xl p-6">
              <h3 className="font-semibold text-navy mb-4 text-[15px]">🔐 Compte</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2.5 border-b border-navy/8">
                  <div>
                    <p className="text-[13px] font-medium text-navy">Email de connexion</p>
                    <p className="text-[11px] text-cream-muted">{profile?.email}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Vérifié</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-[13px] font-medium text-navy">Authentification sans mot de passe</p>
                    <p className="text-[11px] text-cream-muted">Code OTP envoyé par email à chaque connexion</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy/8 text-navy/60 font-medium">Activé</span>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
              <h3 className="font-semibold text-rose-700 mb-3 text-[15px]">⚠ Zone de danger</h3>
              <button onClick={() => signOut()}
                className="flex items-center gap-2.5 text-[13px] text-rose-600 hover:text-rose-700 font-medium transition-colors py-2">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Se déconnecter
              </button>
              <button className="flex items-center gap-2.5 text-[13px] text-rose-400 hover:text-rose-600 font-medium transition-colors py-2 mt-1">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5.5h10M6 5.5V3.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v2M7 8.5v3M9 8.5v3M4 5.5l.667 8a.5.5 0 00.5.5h5.666a.5.5 0 00.5-.5L12 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Supprimer mon compte
              </button>
            </div>
          </div>
        )}

      </main>
    </>
  );
}
