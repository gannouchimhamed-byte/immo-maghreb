"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home, MessageCircle, TrendingUp, Eye, Plus, Bell, Settings,
  ChevronRight, Verified, Star, MoreHorizontal, Edit2, Trash2,
  Phone, CheckCircle2, Clock, XCircle, Users, BarChart3,
  Building2, Zap, LogOut,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { cn, formatPrice, timeAgo } from "@/lib/utils";

// Mock data
const STATS = [
  { label: "Annonces actives", value: "12", icon: Building2, trend: "+2", color: "text-gold-600", bg: "bg-gold-400/10" },
  { label: "Nouveaux leads", value: "8", icon: MessageCircle, trend: "+3 aujourd'hui", color: "text-green-600", bg: "bg-green-50" },
  { label: "Vues ce mois", value: "4 821", icon: Eye, trend: "+18%", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Taux de réponse", value: "94%", icon: Zap, trend: "excellent", color: "text-olive-600", bg: "bg-olive-500/10" },
];

const LISTINGS = [
  {
    id: "l1", title: "Villa La Marsa avec piscine", price: 1200000, status: "active",
    views: 847, leads: 23, publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&q=70",
    isFeatured: true,
  },
  {
    id: "l2", title: "Appartement S+3 Ennasr", price: 195000, status: "active",
    views: 312, leads: 8, publishedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&q=70",
    isFeatured: false,
  },
  {
    id: "l3", title: "Duplex Les Berges du Lac", price: 720000, status: "paused",
    views: 189, leads: 5, publishedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&q=70",
    isFeatured: false,
  },
  {
    id: "l4", title: "Studio Tunis Centre meublé", price: 85000, status: "sold",
    views: 621, leads: 31, publishedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&q=70",
    isFeatured: false,
  },
];

const LEADS = [
  {
    id: "ld1", seekerName: "Ahmed Ben Salah", phone: "+21698111222",
    listingTitle: "Villa La Marsa avec piscine", status: "new", channel: "whatsapp",
    message: "Bonjour, je suis très intéressé par la villa. Serait-il possible de visiter ce weekend ?",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "ld2", seekerName: "Nadia Sfaxi", phone: "+21650333444",
    listingTitle: "Appartement S+3 Ennasr", status: "contacted", channel: "call",
    message: "Disponible pour une visite mardi ou mercredi matin.",
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: "ld3", seekerName: "Karim Jebali", phone: "+21622555666",
    listingTitle: "Villa La Marsa avec piscine", status: "negotiating", channel: "whatsapp",
    message: "Est-ce que le prix est négociable ? Je peux faire une offre à 1.1M DT.",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "ld4", seekerName: "Sonia Trabelsi", phone: "+21629777888",
    listingTitle: "Duplex Les Berges du Lac", status: "closed_won", channel: "inapp",
    message: "Très intéressée, pouvez-vous m'envoyer le plan du bien ?",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const NAV_ITEMS = [
  { icon: Home, label: "Dashboard", id: "dashboard" },
  { icon: Building2, label: "Mes annonces", id: "listings" },
  { icon: MessageCircle, label: "Leads", id: "leads", badge: 8 },
  { icon: BarChart3, label: "Analytique", id: "analytics" },
  { icon: Users, label: "Mon profil", id: "profile" },
  { icon: Settings, label: "Paramètres", id: "settings" },
];

const statusConfig = {
  new: { label: "Nouveau", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Bell },
  contacted: { label: "Contacté", color: "bg-gold-400/10 text-gold-700 border-gold-300", icon: Phone },
  negotiating: { label: "Négociation", color: "bg-purple-50 text-purple-700 border-purple-200", icon: TrendingUp },
  closed_won: { label: "Conclu ✓", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  closed_lost: { label: "Perdu", color: "bg-sand-100 text-sand-500 border-sand-200", icon: XCircle },
};

const listingStatusConfig = {
  active: { label: "Active", dot: "bg-green-500" },
  paused: { label: "En pause", dot: "bg-amber-400" },
  sold: { label: "Vendu", dot: "bg-sand-400" },
  rented: { label: "Loué", dot: "bg-blue-400" },
  pending: { label: "En attente", dot: "bg-purple-400" },
};

export default function AgentDashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [leadFilter, setLeadFilter] = useState<string>("all");

  const filteredLeads = leadFilter === "all"
    ? LEADS
    : LEADS.filter((l) => l.status === leadFilter);

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />

      <div className="flex pt-[68px] min-h-screen">
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 border-r border-sand-200 bg-white sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto">
          {/* Agent profile */}
          <div className="p-5 border-b border-sand-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-display text-lg font-medium">
                MB
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-body text-sm font-medium text-charcoal-900 truncate">
                    Mehdi Bouazizi
                  </span>
                  <Verified size={12} className="text-gold-500 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={10} className="text-gold-500 fill-gold-500" />
                  <span className="font-body text-xs text-sand-500">4.8 · SAMSAR certifié</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3">
            {NAV_ITEMS.map(({ icon: Icon, label, id, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-0.5 font-body text-sm font-medium transition-all duration-150 text-left",
                  activeTab === id
                    ? "bg-charcoal-900 text-sand-50"
                    : "text-charcoal-700 hover:bg-sand-100"
                )}
              >
                <Icon size={15} className={activeTab === id ? "opacity-90" : "opacity-60"} />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span
                    className={cn(
                      "text-2xs font-medium px-1.5 py-0.5 rounded-full",
                      activeTab === id
                        ? "bg-white/20 text-white"
                        : "bg-charcoal-900 text-white"
                    )}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="p-3 border-t border-sand-100">
            <Link
              href="/post"
              className="btn-gold w-full text-sm py-2.5 mb-2"
            >
              <Plus size={14} />
              Nouvelle annonce
            </Link>
            <button className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl font-body text-sm text-sand-500 hover:bg-sand-100 hover:text-charcoal-700 transition-colors">
              <LogOut size={13} />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="max-w-5xl mx-auto p-6 xl:p-8">

            {/* ── Dashboard overview ─────────────────────────────────── */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-display text-3xl font-medium text-charcoal-900">
                      Bonjour, Mehdi 👋
                    </h1>
                    <p className="font-body text-sm text-sand-500 mt-1">
                      {new Date().toLocaleDateString("fr-TN", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <Link href="/post" className="btn-gold text-sm">
                    <Plus size={14} />
                    Publier une annonce
                  </Link>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  {STATS.map(({ label, value, icon: Icon, trend, color, bg }) => (
                    <div key={label} className="stat-card">
                      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                        <Icon size={16} className={color} />
                      </div>
                      <div className="font-display text-2xl font-semibold text-charcoal-900">{value}</div>
                      <div className="font-body text-xs text-sand-500 mt-1">{label}</div>
                      <div className="font-body text-2xs text-green-600 mt-1 font-medium">{trend}</div>
                    </div>
                  ))}
                </div>

                {/* Recent leads */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-medium text-charcoal-900">Derniers leads</h2>
                    <button
                      onClick={() => setActiveTab("leads")}
                      className="font-body text-sm text-charcoal-500 hover:text-charcoal-900 flex items-center gap-1"
                    >
                      Voir tout <ChevronRight size={13} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {LEADS.slice(0, 3).map((lead) => {
                      const { label, color } = statusConfig[lead.status as keyof typeof statusConfig];
                      return (
                        <div key={lead.id} className="bg-white rounded-xl p-4 border border-sand-100 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-sand-100 flex items-center justify-center font-display font-medium text-charcoal-600 flex-shrink-0">
                            {lead.seekerName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-body text-sm font-medium text-charcoal-900">{lead.seekerName}</span>
                              <span className={`badge text-2xs border ${color}`}>{label}</span>
                              <span className="badge badge-dark text-2xs ml-auto">{lead.channel}</span>
                            </div>
                            <p className="font-body text-xs text-sand-500 truncate">{lead.listingTitle}</p>
                            <p className="font-body text-xs text-sand-400 line-clamp-1 mt-1">{lead.message}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                              style={{ background: "#25D366" }}
                            >
                              <MessageCircle size={13} className="text-white" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent listings */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-medium text-charcoal-900">Mes annonces actives</h2>
                    <button
                      onClick={() => setActiveTab("listings")}
                      className="font-body text-sm text-charcoal-500 hover:text-charcoal-900 flex items-center gap-1"
                    >
                      Voir tout <ChevronRight size={13} />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {LISTINGS.filter((l) => l.status === "active").map((listing) => {
                      const statusConf = listingStatusConfig[listing.status as keyof typeof listingStatusConfig];
                      return (
                        <div
                          key={listing.id}
                          className="bg-white rounded-xl p-3 border border-sand-100 flex items-center gap-3"
                        >
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-sand-100">
                            <img src={listing.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConf.dot}`} />
                              <span className="font-body text-sm font-medium text-charcoal-900 truncate">{listing.title}</span>
                              {listing.isFeatured && <Star size={10} className="text-gold-500 fill-gold-500 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="font-display text-sm font-semibold text-charcoal-800">
                                {formatPrice(listing.price)} DT
                              </span>
                              <span className="font-body text-xs text-sand-400 flex items-center gap-1">
                                <Eye size={10} /> {listing.views}
                              </span>
                              <span className="font-body text-xs text-sand-400 flex items-center gap-1">
                                <MessageCircle size={10} /> {listing.leads}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Link href={`/listings/${listing.id}/edit`} className="w-7 h-7 rounded-lg hover:bg-sand-100 flex items-center justify-center text-sand-400 hover:text-charcoal-700 transition-colors">
                              <Edit2 size={12} />
                            </Link>
                            <button className="w-7 h-7 rounded-lg hover:bg-sand-100 flex items-center justify-center text-sand-400 hover:text-charcoal-700 transition-colors">
                              <MoreHorizontal size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Leads tab ──────────────────────────────────────────── */}
            {activeTab === "leads" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h1 className="font-display text-3xl font-medium text-charcoal-900">Leads</h1>
                  <span className="badge badge-gold font-mono">{LEADS.length} total</span>
                </div>

                {/* Status filter tabs */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "all", label: "Tous" },
                    { value: "new", label: "Nouveaux" },
                    { value: "contacted", label: "Contactés" },
                    { value: "negotiating", label: "Négociation" },
                    { value: "closed_won", label: "Conclus" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setLeadFilter(value)}
                      className={cn(
                        "px-4 py-2 rounded-xl font-body text-sm font-medium border transition-all",
                        leadFilter === value
                          ? "bg-charcoal-900 border-charcoal-900 text-sand-50"
                          : "border-sand-200 text-charcoal-600 hover:border-sand-300 hover:bg-sand-50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {filteredLeads.map((lead) => {
                    const statusConf = statusConfig[lead.status as keyof typeof statusConfig];
                    const StatusIcon = statusConf.icon;
                    return (
                      <div key={lead.id} className="bg-white rounded-2xl p-5 border border-sand-100 hover:border-sand-200 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sand-200 to-sand-300 flex items-center justify-center font-display font-medium text-charcoal-600 flex-shrink-0">
                              {lead.seekerName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-body text-sm font-medium text-charcoal-900">{lead.seekerName}</span>
                                <span className={`badge text-2xs border ${statusConf.color} flex items-center gap-1`}>
                                  <StatusIcon size={8} />
                                  {statusConf.label}
                                </span>
                                <span className="font-body text-2xs text-sand-400 ml-auto">{timeAgo(lead.createdAt)}</span>
                              </div>
                              <div className="font-body text-xs text-sand-500 mb-2">
                                📍 {lead.listingTitle}
                              </div>
                              <p className="font-body text-sm text-charcoal-700 bg-sand-50 rounded-xl px-3 py-2 border border-sand-100">
                                {lead.message}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-whatsapp text-xs px-3 py-2"
                            >
                              <MessageCircle size={12} />
                              WhatsApp
                            </a>
                            <a
                              href={`tel:${lead.phone}`}
                              className="btn-ghost text-xs px-3 py-2"
                            >
                              <Phone size={12} />
                              Appeler
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Listings tab ───────────────────────────────────────── */}
            {activeTab === "listings" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h1 className="font-display text-3xl font-medium text-charcoal-900">Mes annonces</h1>
                  <Link href="/post" className="btn-gold text-sm">
                    <Plus size={14} />
                    Nouvelle annonce
                  </Link>
                </div>
                <div className="space-y-3">
                  {LISTINGS.map((listing) => {
                    const statusConf = listingStatusConfig[listing.status as keyof typeof listingStatusConfig];
                    return (
                      <div key={listing.id} className="bg-white rounded-2xl p-4 border border-sand-100">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-sand-100">
                            <img src={listing.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                              <span className="font-body text-xs text-sand-500 font-medium">{statusConf.label}</span>
                              {listing.isFeatured && (
                                <span className="badge badge-gold text-2xs">
                                  <Star size={8} /> En vedette
                                </span>
                              )}
                            </div>
                            <h3 className="font-display text-base font-medium text-charcoal-900 truncate">{listing.title}</h3>
                            <div className="flex items-center gap-4 mt-1.5">
                              <span className="font-display text-base font-semibold text-charcoal-900">
                                {formatPrice(listing.price)} DT
                              </span>
                              <span className="font-body text-xs text-sand-400 flex items-center gap-1">
                                <Eye size={10} /> {listing.views} vues
                              </span>
                              <span className="font-body text-xs text-sand-400 flex items-center gap-1">
                                <MessageCircle size={10} /> {listing.leads} leads
                              </span>
                              <span className="font-body text-xs text-sand-400 hidden sm:block">
                                {timeAgo(listing.publishedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Link
                              href={`/listings/${listing.id}`}
                              className="btn-ghost text-xs px-3 py-2"
                            >
                              Voir
                            </Link>
                            <Link
                              href={`/listings/${listing.id}/edit`}
                              className="btn-ghost text-xs px-3 py-2"
                            >
                              <Edit2 size={11} />
                              Éditer
                            </Link>
                            <button className="w-8 h-8 rounded-xl hover:bg-red-50 flex items-center justify-center text-sand-400 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Analytics placeholder ──────────────────────────────── */}
            {activeTab === "analytics" && (
              <div>
                <h1 className="font-display text-3xl font-medium text-charcoal-900 mb-6">Analytique</h1>
                <div className="bg-white rounded-2xl p-12 border border-sand-100 text-center">
                  <BarChart3 size={40} className="text-sand-300 mx-auto mb-4" />
                  <p className="font-body text-sm text-sand-500">
                    Graphiques Recharts — vues, leads, conversions par annonce
                  </p>
                  <p className="font-body text-xs text-sand-400 mt-1">Données réelles en production</p>
                </div>
              </div>
            )}

            {/* Other tabs */}
            {["profile", "settings"].includes(activeTab) && (
              <div>
                <h1 className="font-display text-3xl font-medium text-charcoal-900 mb-6 capitalize">{activeTab === "profile" ? "Mon profil" : "Paramètres"}</h1>
                <div className="bg-white rounded-2xl p-12 border border-sand-100 text-center">
                  <Settings size={40} className="text-sand-300 mx-auto mb-4" />
                  <p className="font-body text-sm text-sand-500">Section en cours de développement</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
