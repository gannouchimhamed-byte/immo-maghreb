"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { searchAgents } from "@/lib/agent";

const WILAYAS = ["Tous", "Tunis", "Sousse", "Sfax", "Nabeul", "Ariana", "Bizerte", "Monastir", "Mahdia"];
const SPECIALTIES = ["Tous", "Résidentiel", "Villas", "Commercial", "Terrain", "Location", "Neuf"];

// Mock agents for the ImmoScout24-level demonstration since no real agents exist yet.
const MOCK_AGENTS = [
  { id: "1", agency_name: "Tunis Premier Immobilier", wilaya: "Tunis", rating: 4.8, review_count: 124, active_listings: 42, specialties: ["Résidentiel", "Villas", "Neuf"], bio: "Leader sur le Grand Tunis depuis 10 ans. Accompagnement sur-mesure pour vos projets d'achat et d'investissement.", avatar_url: "https://i.pravatar.cc/150?u=1", is_verified: true, whatsapp_phone: "21620123456" },
  { id: "2", agency_name: "Côte d'Or Sousse", wilaya: "Sousse", rating: 4.9, review_count: 89, active_listings: 15, specialties: ["Villas", "Location", "Front de mer"], bio: "Spécialiste de la zone touristique de Sousse et Kantaoui. Les plus belles vues mer sont chez nous.", avatar_url: "https://i.pravatar.cc/150?u=2", is_verified: true, whatsapp_phone: "21620123456" },
  { id: "3", agency_name: "Capital Pro", wilaya: "Tunis", rating: 4.5, review_count: 56, active_listings: 78, specialties: ["Commercial", "Bureaux", "Terrain"], bio: "Le partenaire des entreprises. Trouver vos futurs locaux commerciaux ou terrains industriels.", avatar_url: "https://i.pravatar.cc/150?u=3", is_verified: false },
  { id: "4", agency_name: "Cap Bon Immo", wilaya: "Nabeul", rating: 4.7, review_count: 210, active_listings: 34, specialties: ["Résidentiel", "Villas", "Location"], bio: "L'expert du Cap Bon. De Hammamet à Kélibia, nous trouvons la perle rare pour vos vacances ou résidence principale.", avatar_url: "https://i.pravatar.cc/150?u=4", is_verified: true, whatsapp_phone: "21620123456" },
  { id: "5", agency_name: "Sfax Invest", wilaya: "Sfax", rating: 4.2, review_count: 34, active_listings: 12, specialties: ["Terrain", "Résidentiel", "Neuf"], bio: "Investissez au cœur du sud. Opportunités exclusives sur Sfax et alentours.", avatar_url: "https://i.pravatar.cc/150?u=5", is_verified: false },
  { id: "6", agency_name: "Elite Djerba", wilaya: "Médenine", rating: 5.0, review_count: 12, active_listings: 5, specialties: ["Villas", "Houch", "Location"], bio: "Maisons traditionnelles et villas de luxe sur l'île aux rêves.", avatar_url: "https://i.pravatar.cc/150?u=6", is_verified: true, whatsapp_phone: "21620123456" },
];

export default function AgentDirectoryClient() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [wilaya, setWilaya] = useState("Tous");
  const [specialty, setSpecialty] = useState("Tous");
  const [rating, setRating] = useState(0);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchAgents({
        wilaya: wilaya === "Tous" ? undefined : wilaya,
        specialty: specialty === "Tous" ? undefined : specialty,
        rating: rating > 0 ? rating : undefined
      });
      
      // Fallback to MOCK data if DB is empty to demonstrate the UI
      if (!data || data.length === 0) {
        let filtered = MOCK_AGENTS;
        if (wilaya !== "Tous") filtered = filtered.filter(a => a.wilaya === wilaya);
        if (specialty !== "Tous") filtered = filtered.filter(a => a.specialties.includes(specialty));
        if (rating > 0) filtered = filtered.filter(a => a.rating >= rating);
        setAgents(filtered);
      } else {
        setAgents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [wilaya, specialty, rating]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return (
    <div className="min-h-screen bg-[#FDFAF6] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="text-4xl md:text-5xl font-display font-semibold text-[#1B2B3A] mb-4">
            Trouvez l'expert immobilier idéal
          </h1>
          <p className="text-lg text-[#9A8878] max-w-2xl mx-auto">
            Hestia sélectionne pour vous les meilleurs agents certifiés en Tunisie. Filtrez par ville, spécialité et consultez les avis clients.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#D4AF64]/20 p-5 mb-10 flex flex-wrap gap-4 items-end animate-fade-up">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-bold text-[#9A8878] uppercase mb-1.5 ml-1">Wilaya</label>
            <select value={wilaya} onChange={e => setWilaya(e.target.value)}
              className="w-full bg-[#FDFAF6] border border-[#1B2B3A]/10 text-[#1B2B3A] text-sm rounded-xl px-4 py-3 outline-none hover:border-[#D4AF64]/40 focus:border-[#D4AF64]">
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
             <label className="block text-[11px] font-bold text-[#9A8878] uppercase mb-1.5 ml-1">Spécialité</label>
             <select value={specialty} onChange={e => setSpecialty(e.target.value)}
              className="w-full bg-[#FDFAF6] border border-[#1B2B3A]/10 text-[#1B2B3A] text-sm rounded-xl px-4 py-3 outline-none hover:border-[#D4AF64]/40 focus:border-[#D4AF64]">
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
             <label className="block text-[11px] font-bold text-[#9A8878] uppercase mb-1.5 ml-1">Note Minimum</label>
             <select value={rating} onChange={e => setRating(Number(e.target.value))}
              className="w-full bg-[#FDFAF6] border border-[#1B2B3A]/10 text-[#1B2B3A] text-sm rounded-xl px-4 py-3 outline-none hover:border-[#D4AF64]/40 focus:border-[#D4AF64]">
               <option value={0}>Toutes les notes</option>
               <option value={4}>4+ Étoiles ⭐️</option>
               <option value={4.5}>4.5+ Étoiles ⭐️</option>
             </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white h-[280px] rounded-2xl border border-gray-100 animate-pulse"></div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#D4AF64]/10 shadow-sm animate-fade-up">
            <span className="text-5xl mb-4 block">🔍</span>
            <h3 className="text-xl font-display font-semibold text-[#1B2B3A] mb-2">Aucun agent trouvé</h3>
            <p className="text-[#9A8878] text-sm">Essayez de modifier vos critères de recherche.</p>
            <button onClick={() => { setWilaya("Tous"); setSpecialty("Tous"); setRating(0); }}
               className="mt-6 px-6 py-2.5 bg-[#1B2B3A] text-white rounded-xl text-sm hover:bg-[#243647] transition">
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent: any) => (
              <div key={agent.id} className="bg-white rounded-2xl overflow-hidden border border-[#D4AF64]/15 shadow-sm hover:shadow-lg hover:border-[#D4AF64]/50 transition-all duration-300 group flex flex-col animate-fade-up">
                <div className="h-24 bg-[#1B2B3A] relative overflow-hidden">
                   <div className="absolute inset-0 bg-[#D4AF64]/10 mix-blend-overlay"></div>
                   {/* Agent Badge/Stars floating top right */}
                   <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-2 py-1 shadow-sm flex items-center gap-1">
                     <span className="text-[#D4AF64] text-sm">★</span>
                     <span className="text-xs font-bold text-[#1B2B3A]">{agent.rating ? agent.rating.toFixed(1) : "Nouveau"}</span>
                     <span className="text-[10px] text-[#9A8878]">({agent.review_count || 0})</span>
                   </div>
                </div>
                
                <div className="px-6 pb-6 pt-0 relative flex-1 flex flex-col">
                  {/* Avatar overlapping header */}
                  <div className="w-[72px] h-[72px] rounded-full bg-white border-4 border-white shadow-md relative -mt-9 overflow-hidden flex-shrink-0 z-10">
                     {agent.avatar_url ? (
                       <img src={agent.avatar_url} alt={agent.agency_name || "Agent"} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full bg-[#FDFAF6] flex items-center justify-center text-xl font-display text-[#1B2B3A]">
                         {(agent.agency_name || "A").charAt(0).toUpperCase()}
                       </div>
                     )}
                     {agent.is_verified && (
                       <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border border-white rounded-full" title="Certifié Hestia"></div>
                     )}
                  </div>
                  
                  <div className="mt-3">
                    <h3 className="font-display text-xl font-bold text-[#1B2B3A] leading-tight group-hover:text-[#D4AF64] transition-colors">
                      {agent.agency_name || "Agent Indépendant"}
                    </h3>
                    <p className="text-xs font-medium text-[#9A8878] flex items-center gap-1 mt-1">
                      <span className="opacity-70">📍</span> {agent.wilaya || "Tunisie"}
                    </p>
                  </div>

                  {/* Bio */}
                  <div className="my-4 text-xs text-[#1B2B3A]/80 line-clamp-3 leading-relaxed flex-1">
                    {agent.bio || "Expert en immobilier certifié par le réseau Hestia, accompagnant acheteurs et vendeurs avec professionnalisme et transparence."}
                  </div>

                  {/* Keywords */}
                  {agent.specialties && agent.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                      {agent.specialties.slice(0,3).map((spec: string) => (
                        <span key={spec} className="px-2 py-1 bg-[#FDFAF6] border border-[#1B2B3A]/10 text-[10px] text-[#1B2B3A] rounded-md font-medium shadow-sm">
                          {spec}
                        </span>
                      ))}
                      {agent.specialties.length > 3 && <span className="px-2 py-1 text-[10px] text-[#9A8878] font-medium">+{agent.specialties.length - 3}</span>}
                    </div>
                  )}

                  {/* Footer buttons */}
                  <div className="flex gap-2 mt-auto">
                    <button className="flex-1 bg-[#FDFAF6] hover:bg-[#D4AF64]/10 border border-[#D4AF64]/30 text-[#1B2B3A] text-xs font-bold py-2.5 rounded-xl transition-colors text-center">
                      Vitrine ({agent.active_listings || 0})
                    </button>
                    {agent.whatsapp_phone ? (
                       <a href={`https://wa.me/${agent.whatsapp_phone}`} target="_blank" rel="noopener noreferrer" 
                          className="flex-1 bg-[#1B2B3A] hover:bg-[#243647] text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#1B2B3A]/20">
                         <span>💬</span> Contacter
                       </a>
                    ) : (
                       <button className="flex-1 bg-[#1B2B3A] hover:bg-[#243647] text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-md">
                         Contacter
                       </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
