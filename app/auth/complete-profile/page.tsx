"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, updateProfile, migrateDeviceSearches, getDeviceId } from "@/lib/auth";

const WILAYAS = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan","Bizerte","Béja","Jendouba","Le Kef","Siliana","Kairouan","Kasserine","Sidi Bouzid","Sousse","Monastir","Mahdia","Sfax","Gafsa","Tozeur","Kébili","Gabès","Médenine","Tataouine"];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getUser().then(u => {
      if (!u) { router.push("/auth/login"); return; }
      setUserId(u.id);
      if (u.user_metadata?.full_name) setFullName(u.user_metadata.full_name);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    // Migrate device saved searches
    const deviceId = getDeviceId();
    if (deviceId) await migrateDeviceSearches(deviceId, userId);
    await updateProfile(userId, { full_name: fullName.trim(), wilaya });
    router.push("/");
  };

  const handleSkip = async () => {
    if (!userId) return;
    const deviceId = getDeviceId();
    if (deviceId) await migrateDeviceSearches(deviceId, userId);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-up">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="#1B2B3A"/>
              <path d="M10 24 L10 17 L18 11 L26 17 L26 24" fill="none" stroke="#D4AF64" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="15" y="19" width="6" height="5" rx="1" fill="#D4AF64" opacity="0.85"/>
            </svg>
            <span className="font-display text-[22px] text-navy tracking-widest">HESTIA</span>
          </Link>
        </div>

        <div className="bg-[#FDFAF6] rounded-2xl border border-navy/10 p-8 shadow-sm">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">Email vérifié</span>
            </div>
            <div className="flex-1 h-px bg-navy/10"/>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-navy text-gold flex items-center justify-center text-[11px] font-bold">2</span>
              <span className="text-[11px] text-navy font-semibold">Votre profil</span>
            </div>
          </div>

          <h1 className="font-display text-[26px] text-navy font-semibold mb-1">Finalisez votre profil</h1>
          <p className="text-cream-muted text-[13px] mb-6">Pour personaliser votre expérience Hestia</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1.5">Prénom et nom</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Mohamed Ben Salem" autoFocus
                className="w-full px-4 py-3 rounded-xl border-2 border-navy/15 bg-white text-[14px] focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all"/>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1.5">Wilaya de recherche</label>
              <select value={wilaya} onChange={e => setWilaya(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-navy/15 bg-white text-[14px] text-navy focus:outline-none focus:border-navy/40 appearance-none"
                style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",backgroundSize:"16px"}}>
                <option value="">Sélectionnez une wilaya (optionnel)</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading || !fullName.trim()}
              className="w-full py-3.5 rounded-xl bg-navy text-gold text-[14px] font-bold hover:bg-navy/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin"/> : "Accéder à Hestia →"}
            </button>
          </form>

          <button onClick={handleSkip} className="w-full mt-3 py-2.5 text-[13px] text-cream-muted hover:text-navy transition-colors">
            Passer cette étape
          </button>
        </div>
      </div>
    </div>
  );
}
