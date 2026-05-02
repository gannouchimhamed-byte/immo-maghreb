"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-navy border-b border-gold/20 backdrop-blur-sm">
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
          <Link href="/listings" className="px-4 py-2 text-[13px] text-cream/70 hover:text-cream transition-colors rounded-lg hover:bg-white/5">
            Annonces
          </Link>
          <Link href="/listings?action=vente" className="px-4 py-2 text-[13px] text-cream/70 hover:text-cream transition-colors rounded-lg hover:bg-white/5">
            Vente
          </Link>
          <Link href="/listings?action=location" className="px-4 py-2 text-[13px] text-cream/70 hover:text-cream transition-colors rounded-lg hover:bg-white/5">
            Location
          </Link>
        </div>

        <Link href="/listings?action=vente" className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gold text-navy text-[13px] font-semibold hover:bg-gold-light transition-colors">
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
        <div className="md:hidden bg-navy-dark border-t border-gold/10 px-6 py-4 flex flex-col gap-2">
          {["Annonces:/listings","Vente:/listings?action=vente","Location:/listings?action=location"].map(item => {
            const [label, href] = item.split(":");
            return (
              <Link key={label} href={href} onClick={() => setMenuOpen(false)}
                className="py-2.5 text-[14px] text-cream/80 hover:text-gold transition-colors border-b border-white/5 last:border-0">
                {label}
              </Link>
            );
          })}
          <Link href="/listings" onClick={() => setMenuOpen(false)}
            className="mt-2 py-3 text-center rounded-lg bg-gold text-navy text-[13px] font-bold">
            Publier une annonce
          </Link>
        </div>
      )}
    </nav>
  );
}
