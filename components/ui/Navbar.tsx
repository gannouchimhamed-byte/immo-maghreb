"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { fetchSavedSearches } from "@/lib/saved-searches";

interface NavbarProps {
  savedSearchCount?: number; // optional override (passed from server-fetched pages)
}

export default function Navbar({ savedSearchCount }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(savedSearchCount ?? 0);
  const pathname = usePathname();

  // Load alert count from Supabase client-side (only if not passed in)
  useEffect(() => {
    if (savedSearchCount !== undefined) { setAlertCount(savedSearchCount); return; }
    fetchSavedSearches().then(s => setAlertCount(s.filter(x => x.active).length)).catch(() => {});
  }, [savedSearchCount]);

  const links = [
    { href: "/listings", label: "Annonces" },
    { href: "/listings?action=vente", label: "Vente" },
    { href: "/listings?action=location", label: "Location" },
    { href: "/map", label: "🗺 Carte" },
  ];

  const isActive = (href: string) =>
    pathname === href || (href === "/map" && pathname === "/map") ||
    (href === "/listings" && pathname === "/listings" && !pathname.includes("[id]"));

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

        {/* Desktop links */}
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

        {/* Alerts bell */}
        <Link href="/saved-searches"
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition"
          title="Mes alertes">
          <svg className="w-5 h-5 text-cream/70 hover:text-cream" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M8.5 16.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gold text-navy text-[9px] font-bold flex items-center justify-center leading-none">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </Link>

        {/* Publish CTA */}
        <Link href="/listings" className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gold text-navy text-[13px] font-semibold hover:bg-gold/90 transition-colors no-underline">
          Publier une annonce
        </Link>

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
          <Link href="/listings" onClick={() => setMenuOpen(false)}
            className="mt-2 py-3 text-center rounded-lg bg-gold text-navy text-[13px] font-bold no-underline">
            Publier une annonce
          </Link>
        </div>
      )}
    </nav>
  );
}
