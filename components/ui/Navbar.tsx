"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession, getProfile, signOut } from "@/lib/auth";
import { fetchSavedSearches } from "@/lib/saved-searches";
import type { UserProfile } from "@/lib/auth";

interface NavbarProps {
  savedSearchCount?: number;
}

export default function Navbar({ savedSearchCount }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(savedSearchCount ?? 0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          const p = await getProfile(session.user.id);
          setProfile(p);
        }
        if (savedSearchCount === undefined) {
          const searches = await fetchSavedSearches();
          setAlertCount(searches.filter(s => s.active).length);
        }
      } catch {}
      setAuthLoading(false);
    };
    init();
  }, [savedSearchCount]);

  // Close user menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const links = [
    { href: "/listings", label: "Annonces" },
    { href: "/listings?action=vente", label: "Vente" },
    { href: "/listings?action=location", label: "Location" },
    { href: "/map", label: "🗺 Carte" },
  ];

  const isActive = (href: string) =>
    pathname === href || (href === "/map" && pathname === "/map") ||
    (href === "/listings" && pathname === "/listings");

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.email?.charAt(0).toUpperCase() || "?";

  return (
    <nav className="sticky top-0 z-50 bg-navy border-b border-gold/20">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-16 gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline shrink-0">
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill="#1B2B3A"/>
            <path d="M10 24 L10 17 L18 11 L26 17 L26 24" fill="none" stroke="#D4AF64" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="15" y="19" width="6" height="5" rx="1" fill="#D4AF64" opacity="0.85"/>
            <path d="M8 26 C12 22 14 20 18 24 C22 20 24 22 28 26" fill="none" stroke="#D4AF64" strokeWidth="1" opacity="0.4"/>
          </svg>
          <div>
            <div className="font-display text-xl text-cream tracking-widest leading-none">HESTIA</div>
            <div className="text-[8px] text-gold tracking-[0.2em] mt-0.5 leading-none">FIND YOUR HOME</div>
          </div>
        </Link>

        <div className="flex-1"/>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link key={link.href} href={link.href}
              className={`px-4 py-2 text-[13px] transition-colors rounded-lg ${
                isActive(link.href) ? "text-gold bg-white/8" : "text-cream/70 hover:text-cream hover:bg-white/5"
              }`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Bell icon */}
        <Link href="/saved-searches"
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition"
          title="Mes alertes">
          <svg className="w-5 h-5 text-cream/70" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M8.5 16.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gold text-navy text-[9px] font-bold flex items-center justify-center">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </Link>

        {/* Auth section */}
        {!authLoading && (
          profile ? (
            /* Logged-in user avatar + dropdown */
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-white/10 transition">
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-navy text-[12px] font-bold shrink-0">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover"/>
                    : initials}
                </div>
                <span className="text-[13px] text-cream/80 max-w-[100px] truncate">
                  {profile.full_name?.split(" ")[0] || "Mon compte"}
                </span>
                <svg className={`w-3.5 h-3.5 text-cream/40 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} viewBox="0 0 14 14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#FDFAF6] border border-navy/10 rounded-xl shadow-xl py-2 animate-fade-up">
                  <div className="px-4 py-2.5 border-b border-navy/8">
                    <p className="text-[13px] font-semibold text-navy truncate">{profile.full_name || "Mon compte"}</p>
                    <p className="text-[11px] text-cream-muted truncate">{profile.email}</p>
                  </div>
                  {[
                    { href: "/saved-searches", icon: "🔔", label: "Mes alertes" },
                    { href: "/profile", icon: "👤", label: "Mon profil" },
                    { href: "/listings", icon: "🏠", label: "Mes favoris" },
                  ].map(item => (
                    <Link key={item.href} href={item.href}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy hover:bg-cream transition-colors no-underline">
                      <span>{item.icon}</span>{item.label}
                    </Link>
                  ))}
                  <div className="border-t border-navy/8 mt-1 pt-1">
                    <button onClick={() => { setUserMenuOpen(false); signOut(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-rose-500 hover:bg-rose-50 transition-colors">
                      <span>🚪</span>Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in */
            <Link href="/auth/login"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gold text-navy text-[13px] font-semibold hover:bg-gold/90 transition-colors no-underline">
              Se connecter
            </Link>
          )
        )}

        {/* Mobile hamburger */}
        <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-5 h-5 text-cream" viewBox="0 0 20 20" fill="none">
            {menuOpen
              ? <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              : <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-navy border-t border-gold/10 px-6 py-4 flex flex-col gap-2">
          {links.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="py-2.5 text-[14px] text-cream/80 hover:text-gold transition-colors border-b border-white/5 last:border-0 no-underline">
              {link.label}
            </Link>
          ))}
          <Link href="/saved-searches" onClick={() => setMenuOpen(false)}
            className="py-2.5 text-[14px] text-cream/80 hover:text-gold transition-colors border-b border-white/5 no-underline flex items-center gap-2">
            🔔 Mes alertes
            {alertCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-gold text-navy text-[10px] font-bold">{alertCount}</span>}
          </Link>
          {profile ? (
            <button onClick={() => { setMenuOpen(false); signOut(); }}
              className="mt-2 py-3 text-center rounded-lg border border-white/15 text-cream/70 text-[13px]">
              Se déconnecter
            </button>
          ) : (
            <Link href="/auth/login" onClick={() => setMenuOpen(false)}
              className="mt-2 py-3 text-center rounded-lg bg-gold text-navy text-[13px] font-bold no-underline">
              Se connecter
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
