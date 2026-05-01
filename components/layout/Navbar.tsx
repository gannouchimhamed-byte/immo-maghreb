"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Search, Bell, User, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Acheter", href: "/listings?type=sale" },
  { label: "Louer", href: "/listings?type=rent" },
  {
    label: "Estimer",
    href: "/estimate",
    badge: "IA",
  },
  { label: "Agents", href: "/agents" },
  { label: "Promoteurs", href: "/developers" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("FR");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-sand-200 shadow-sm"
          : "bg-transparent"
      )}
      style={{ height: "var(--nav-height)" }}
    >
      <div className="container-site h-full flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 flex-shrink-0"
          aria-label="Immo NA — Accueil"
        >
          <span className="relative">
            <span
              className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: scrolled ? "#1A1713" : "#FAF8F5" }}
            >
              Immo
            </span>
            <span
              className="font-display text-2xl font-light"
              style={{ color: "#C9A84C" }}
            >
              NA
            </span>
          </span>
          <span
            className={cn(
              "hidden sm:block text-2xs font-mono uppercase tracking-widest border-l pl-2.5 ml-0.5 transition-colors",
              scrolled
                ? "text-sand-400 border-sand-200"
                : "text-sand-300/70 border-sand-200/30"
            )}
          >
            Tunisie · Maghreb
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex items-center gap-1.5 font-body text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-150",
                scrolled
                  ? "text-charcoal-800 hover:bg-sand-100"
                  : "text-sand-100 hover:bg-white/10"
              )}
            >
              {link.label}
              {link.badge && (
                <span className="text-2xs font-mono font-medium px-1.5 py-0.5 rounded-md bg-gold-400/20 text-gold-600">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className={cn(
                "flex items-center gap-1.5 font-body text-xs font-medium px-3 py-2 rounded-lg transition-all",
                scrolled
                  ? "text-charcoal-800 hover:bg-sand-100"
                  : "text-sand-200 hover:bg-white/10"
              )}
            >
              <Globe size={13} />
              {currentLang}
              <ChevronDown size={11} />
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-1 w-28 bg-white rounded-xl border border-sand-200 shadow-card p-1 z-20">
                {["FR", "AR", "EN"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setCurrentLang(lang);
                      setLangOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-body rounded-lg hover:bg-sand-100 transition-colors"
                  >
                    {lang === "FR" ? "🇫🇷 Français" : lang === "AR" ? "🇹🇳 العربية" : "🇬🇧 English"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/listings"
            className={cn(
              "hidden md:flex items-center gap-1.5 font-body text-sm font-medium px-3.5 py-2 rounded-lg transition-all",
              scrolled
                ? "text-charcoal-800 hover:bg-sand-100"
                : "text-sand-200 hover:bg-white/10"
            )}
          >
            <Search size={14} />
            Rechercher
          </Link>

          <Link
            href="/dashboard"
            className={cn(
              "hidden md:flex items-center gap-1.5 font-body text-xs font-medium px-3.5 py-2 rounded-lg border transition-all",
              scrolled
                ? "border-sand-200 text-charcoal-800 hover:bg-sand-100"
                : "border-white/20 text-sand-100 hover:bg-white/10"
            )}
          >
            <User size={13} />
            Espace agent
          </Link>

          <Link
            href="/post"
            className="btn-gold text-xs px-4 py-2.5 hidden sm:flex"
          >
            Publier une annonce
          </Link>

          {/* Mobile menu toggle */}
          <button
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              scrolled ? "text-charcoal-900 hover:bg-sand-100" : "text-white hover:bg-white/10"
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-sand-200 shadow-lg">
          <div className="container-site py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 font-body text-sm font-medium px-4 py-3 rounded-xl text-charcoal-800 hover:bg-sand-100 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
                {link.badge && (
                  <span className="text-2xs font-mono font-medium px-1.5 py-0.5 rounded-md bg-gold-400/20 text-gold-600">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="border-t border-sand-100 mt-2 pt-3 flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="btn-ghost text-sm"
                onClick={() => setMobileOpen(false)}
              >
                <User size={14} />
                Espace agent
              </Link>
              <Link
                href="/post"
                className="btn-gold text-sm text-center"
                onClick={() => setMobileOpen(false)}
              >
                Publier une annonce
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
