"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import { getCurrentUser, updateProfile, signOut, type AuthUser } from "@/lib/auth";
import { fetchSavedSearches } from "@/lib/saved-searches";

const WILAYAS = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Sousse","Monastir","Sfax","Gabès","Bizerte","Zaghouan","Béja","Jendouba","Le Kef","Siliana","Kairouan","Kasserine","Sidi Bouzid","Mahdia","Gafsa","Tozeur","Kébili","Médenine","Tataouine"];

export default function ProfilClient() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCurrentUser().then(u => {
      if (!u) { router.push("/auth?returnTo=/profil"); return; }
      setUser(u);
      setName(u.full_name || "");
      setLoading(false);
    });
    fetchSavedSearches().then(s => setAlertCount(s.filter(x => x.active).length));
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await updateProfile(user.id, { full_name: name, wilaya });
    setUser(u => u ? { ...u, full_name: name } : u);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <>
        <Navbar/>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
        </div>
      </>
    );
  }

  if (!user) return null;

  const initials = (user.full_name || user.email).slice(0, 2).toUpperCase();

  return (
    <>
      <Navbar savedSearchCount={alertCount}/>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-2">· Mon compte ·</div>
          <h1 className="font-display text-[32px] text-navy font-semibold">Mon profil</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* Left — avatar + stats */}
          <div className="flex flex-col gap-4">
            {/* Avatar */}
            <div className="bg-[#FDFAF6] rounded-2xl border border-navy/10 p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-navy flex items-center justify-center mb-3">
                <span className="font-display text-[28px] text-gold font-semibold">{initials}</span>
              </div>
              <p className="font-semibold text-navy text-[15px]">{user.full_name || "Sans nom"}</p>
              <p className="text-[12px] text-cream-muted mt-0.5">{user.email}</p>
              {user.is_verified && (
                <span className="mt-2 text-[10px] px-2.5 py-1 rounded-full bg-gold/15 text-navy font-semibold">★ Compte vérifié</span>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-[#FDFAF6] rounded-2xl border border-navy/10 overflow-hidden">
              {[
                { href: "/saved-searches", icon: "🔔", label: "Mes alertes", badge: alertCount > 0 ? alertCount : null },
                { href: "/listings", icon: "🔍", label: "Parcourir les annonces", badge: null },
                { href: "/map", icon: "🗺", label: "Carte interactive", badge: null },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-cream transition-colors border-b border-navy/8 last:border-0 no-underline">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[13px] font-medium text-navy flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="w-5 h-5 rounded-full bg-gold text-navy text-[10px] font-bold flex items-center justify-center">{item.badge}</span>
                  )}
                  <svg className="w-3.5 h-3.5 text-cream-muted" viewBox="0 0 14 14" fill="none">
                    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Right — editable info */}
          <div className="sm:col-span-2 space-y-4">

            {/* Profile card */}
            <div className="bg-[#FDFAF6] rounded-2xl border border-navy/10 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-[18px] text-navy font-semibold">Informations personnelles</h2>
                {!editing ? (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-navy/15 text-[12px] font-medium text-navy hover:bg-cream transition">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                      <path d="M10 2l2 2L4 12H2v-2L10 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    Modifier
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)}
                      className="px-3 py-1.5 rounded-lg border border-navy/15 text-[12px] text-cream-muted hover:bg-cream transition">
                      Annuler
                    </button>
                    <button onClick={handleSave} disabled={saving}
                      className="px-3 py-1.5 rounded-lg bg-navy text-gold text-[12px] font-semibold disabled:opacity-50 hover:bg-navy/90 transition flex items-center gap-1.5">
                      {saving ? <div className="w-3 h-3 border border-gold border-t-transparent rounded-full animate-spin"/> : "Sauvegarder"}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Email (read-only) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Email</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-navy/10 bg-cream/50">
                    <span className="text-[14px] text-navy/60 flex-1">{user.email}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Vérifié</span>
                  </div>
                </div>

                {/* Full name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Nom complet</label>
                  {editing ? (
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Votre nom"
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-navy/15 bg-white text-[14px] text-navy focus:outline-none focus:border-gold transition"/>
                  ) : (
                    <p className="px-3 py-2.5 text-[14px] text-navy">{user.full_name || <span className="text-cream-muted italic">Non renseigné</span>}</p>
                  )}
                </div>

                {/* Wilaya */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Wilaya de résidence</label>
                  {editing ? (
                    <select value={wilaya} onChange={e => setWilaya(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-navy/15 bg-white text-[14px] text-navy focus:outline-none focus:border-gold transition appearance-none">
                      <option value="">Choisir une wilaya</option>
                      {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  ) : (
                    <p className="px-3 py-2.5 text-[14px] text-navy">{wilaya || <span className="text-cream-muted italic">Non renseignée</span>}</p>
                  )}
                </div>
              </div>

              {saved && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-700">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Profil mis à jour avec succès
                </div>
              )}
            </div>

            {/* Security card */}
            <div className="bg-[#FDFAF6] rounded-2xl border border-navy/10 p-6">
              <h2 className="font-display text-[18px] text-navy font-semibold mb-4">Sécurité</h2>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-cream border border-navy/8 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l5 2v5c0 3-5 5-5 5S3 11 3 8V3l5-2z" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-navy">Authentification sans mot de passe</p>
                  <p className="text-[11px] text-cream-muted">Connexion sécurisée par code email à usage unique</p>
                </div>
              </div>
              <p className="text-[12px] text-cream-muted leading-relaxed">
                Hestia utilise une authentification sans mot de passe. Un code à 6 chiffres est envoyé à votre adresse email à chaque connexion.
              </p>
            </div>

            {/* Sign out */}
            <div className="bg-[#FDFAF6] rounded-2xl border border-rose-100 p-5 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-navy">Se déconnecter</p>
                <p className="text-[11px] text-cream-muted">Fermer la session sur cet appareil</p>
              </div>
              <button onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 text-rose-500 text-[13px] font-semibold hover:bg-rose-50 transition">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M10 11l4-4-4-4M14 7H6M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-navy-dark py-6 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[11px] text-cream/20 tracking-widest">© 2026 HESTIA · TOUS DROITS RÉSERVÉS</p>
        </div>
      </footer>
    </>
  );
}
