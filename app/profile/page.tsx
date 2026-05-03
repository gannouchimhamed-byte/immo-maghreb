"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { getUser, getProfile, updateProfile, signOut } from "@/lib/auth";
import type { UserProfile } from "@/lib/auth";
import Link from "next/link";

const WILAYAS = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan","Bizerte","Béja","Jendouba","Le Kef","Siliana","Kairouan","Kasserine","Sidi Bouzid","Sousse","Monastir","Mahdia","Sfax","Gafsa","Tozeur","Kébili","Gabès","Médenine","Tataouine"];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getUser().then(async u => {
      if (!u) { router.push("/auth/login?returnTo=/profile"); return; }
      const p = await getProfile(u.id);
      if (p) {
        setProfile(p);
        setFullName(p.full_name || "");
        setWilaya(p.wilaya || "");
      }
      setLoading(false);
    });
  }, [router]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await updateProfile(profile.id, { full_name: fullName, wilaya });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return (
    <><Navbar/><div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
    </div></>
  );

  return (
    <>
      <Navbar/>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-2">· Mon compte ·</div>
          <h1 className="font-display text-[32px] text-navy font-semibold">Mon profil</h1>
        </div>

        <div className="bg-[#FDFAF6] rounded-2xl border border-navy/10 p-8 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-gold font-display text-2xl shrink-0">
              {profile?.full_name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-semibold text-navy text-[16px]">{profile?.full_name || "Utilisateur Hestia"}</p>
              <p className="text-cream-muted text-[13px]">{profile?.email}</p>
              {profile?.is_verified && <span className="text-[11px] text-gold font-semibold">★ Compte vérifié</span>}
            </div>
          </div>

          <div className="h-px bg-navy/8"/>

          {/* Fields */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1.5">Prénom et nom</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-navy/15 bg-white text-[14px] focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all"/>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1.5">Wilaya de recherche</label>
            <select value={wilaya} onChange={e => setWilaya(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-navy/15 bg-white text-[14px] focus:outline-none focus:border-navy/40 appearance-none"
              style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",backgroundSize:"16px"}}>
              <option value="">Non spécifié</option>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-navy text-gold font-bold text-[14px] hover:bg-navy/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin"/> 
               : saved ? "✓ Sauvegardé !" : "Sauvegarder"}
            </button>
            <Link href="/saved-searches" className="px-5 py-3 rounded-xl border-2 border-navy/15 text-navy font-semibold text-[14px] hover:bg-cream transition no-underline">
              Mes alertes
            </Link>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-6 bg-[#FDFAF6] rounded-2xl border border-navy/10 p-6">
          <h3 className="font-semibold text-navy mb-4">Compte</h3>
          <button onClick={() => signOut()} className="flex items-center gap-2 text-[13px] text-rose-500 hover:text-rose-600 transition-colors">
            🚪 Se déconnecter
          </button>
        </div>
      </main>
    </>
  );
}
