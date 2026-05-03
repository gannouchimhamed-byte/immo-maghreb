"use client";
import { useEffect, useState } from "react";
import { getMonthlyBIStats } from "@/lib/agent";

export default function BIReport({ agentId }: { agentId: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMonthlyBIStats(agentId).then(data => {
      setStats(data);
      setLoading(false);
    });
  }, [agentId]);

  if (loading) return <div className="py-20 text-center text-navy/50 animate-pulse">Génération du rapport en cours...</div>;

  return (
    <div className="animate-fade-up" id="bi-report-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold text-navy">Rapport Performance (BI)</h2>
          <p className="text-sm text-cream-muted">Aperçu automatisé de vos performances sur le mois en cours</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-[#D4AF64] text-navy font-bold rounded-xl text-sm shadow hover:bg-[#c29c50] transition">
          Exporter PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-navy/10 shadow-sm">
          <p className="text-xs text-cream-muted uppercase tracking-wider font-semibold">Vues Totales</p>
          <p className="text-3xl font-display text-navy font-bold">{stats.totalViews}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-navy/10 shadow-sm">
          <p className="text-xs text-cream-muted uppercase tracking-wider font-semibold">Nouveaux Leads (Mois)</p>
          <p className="text-3xl font-display text-blue-600 font-bold">+{stats.newLeadsThisMonth}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-navy/10 shadow-sm">
          <p className="text-xs text-cream-muted uppercase tracking-wider font-semibold">Transactions Conclues</p>
          <p className="text-3xl font-display text-emerald-600 font-bold">{stats.totalClosed}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-navy/10 shadow-sm">
          <p className="text-xs text-cream-muted uppercase tracking-wider font-semibold">Volume des ventes</p>
          <p className="text-3xl font-display text-gold font-bold">{stats.totalClosedVal > 1000 ? (stats.totalClosedVal/1000).toFixed(0)+"K" : stats.totalClosedVal} TND</p>
        </div>
      </div>

      {/* Funnel & Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-navy/10 shadow-sm">
          <h3 className="font-semibold text-navy mb-4">Top 5 Annonces (Conversion)</h3>
          <div className="space-y-4">
            {stats.listingStats.map((l: any, i: number) => (
              <div key={i} className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-navy font-medium truncate pr-4">{l.title}</span>
                  <span className="text-xs font-bold text-gold shrink-0">{l.conversion}% cert</span>
                </div>
                <div className="flex gap-2 text-[11px] text-cream-muted">
                  <span>👁 {l.views} vues</span>
                  <span>•</span>
                  <span>💬 {l.leads} leads</span>
                </div>
                <div className="w-full bg-navy/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-gold h-full" style={{ width: `${Math.min(100, Math.max(2, parseFloat(l.conversion)*10))}%` }} />
                </div>
              </div>
            ))}
            {stats.listingStats.length === 0 && <p className="text-sm text-cream-muted">Données insuffisantes.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-navy/10 shadow-sm flex flex-col justify-center items-center text-center">
             <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
               <span className="text-3xl">🚀</span>
             </div>
             <h3 className="text-xl font-display text-navy font-bold mb-2">Impact Hestia</h3>
             <p className="text-sm text-cream-muted leading-relaxed max-w-sm">
               Vos annonces génèrent un flux constant de leads. Avec un taux de conversion au-dessus de la moyenne nationale, votre profil est très attractif. Pensez à ajouter des <b>Vidéo Tours</b> pour augmenter vos vues de 40%.
             </p>
        </div>
      </div>
    </div>
  );
}
