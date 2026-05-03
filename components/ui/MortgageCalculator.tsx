"use client";
import { useState, useEffect } from "react";

interface BankPreset {
  name: string;
  rate: number;
  color: string;
  logo: string;
}

const BANKS: BankPreset[] = [
  { name: "BIAT", rate: 11.5, color: "bg-blue-600", logo: "🏦" },
  { name: "Amen Bank", rate: 11.2, color: "bg-emerald-600", logo: "🏛" },
  { name: "BH Bank", rate: 10.8, color: "bg-red-600", logo: "🏠" },
  { name: "Attijari", rate: 11.4, color: "bg-amber-500", logo: "🏢" }
];

interface Props {
  initialPrice?: number;
  className?: string;
  isStandalone?: boolean;
}

export default function MortgageCalculator({ initialPrice = 350000, className = "", isStandalone = false }: Props) {
  const [price, setPrice] = useState(initialPrice || 0);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [years, setYears] = useState(20);
  const [selectedBank, setSelectedBank] = useState<BankPreset>(BANKS[0]);

  useEffect(() => {
    if (initialPrice && initialPrice !== price && !isStandalone) {
        setPrice(initialPrice);
    }
  }, [initialPrice]);

  // Derived state calculated synchronously
  const downPayment = Math.round((price || 0) * (downPaymentPercent / 100));
  const principal = (price || 0) - downPayment;
  const annualRate = selectedBank.rate / 100;
  const monthlyRate = annualRate / 12;
  const numberOfPayments = years * 12;

  let monthlyPayment = 0;
  let totalCost = 0;
  let totalInterest = 0;

  if (principal > 0 && numberOfPayments > 0 && monthlyRate > 0) {
    const mathPower = Math.pow(1 + monthlyRate, numberOfPayments);
    monthlyPayment = (principal * (monthlyRate * mathPower)) / (mathPower - 1);
    totalCost = monthlyPayment * numberOfPayments;
    totalInterest = totalCost - principal;
  }

  const interestPercentage = totalCost > 0 ? (totalInterest / totalCost) * 100 : 0;
  const principalPercentage = totalCost > 0 ? (principal / totalCost) * 100 : 0;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-[#1B2B3A]/10 p-6 ${className}`}>
      {isStandalone && (
         <div className="text-center mb-8">
           <h2 className="text-3xl font-display font-semibold text-[#1B2B3A] mb-2">Simulateur de Crédit Immobilier</h2>
           <p className="text-sm text-[#9A8878]">Estimez vos mensualités avec les taux moyens tunisiens (TMM + Marge).</p>
         </div>
      )}

      {/* Preset Banks Selector */}
      <div className="mb-8">
        <label className="block text-xs font-bold text-[#1B2B3A] uppercase mb-3">Pré-réglages Banques (TGE Estimatif)</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {BANKS.map(b => (
            <button key={b.name} onClick={() => setSelectedBank(b)}
              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${selectedBank.name === b.name ? 'border-[#1B2B3A] bg-[#FDFAF6]' : 'border-gray-100 hover:border-gray-200'}`}>
              <span className="text-xl mb-1">{b.logo}</span>
              <span className="text-[11px] font-bold text-[#1B2B3A]">{b.name}</span>
              <span className="text-[10px] text-[#9A8878] font-semibold">{b.rate}%</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold text-[#1B2B3A] uppercase">Prix du Bien</label>
              <span className="text-sm font-bold text-[#D4AF64]">{(price || 0).toLocaleString()} TND</span>
            </div>
            <input type="range" min={50000} max={2000000} step={10000} value={price || 0} onChange={e => setPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1B2B3A]"/>
            {isStandalone && (
               <input type="number" value={price || 0} onChange={e => setPrice(Number(e.target.value))} className="mt-2 w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:outline-[#1B2B3A]"/>
            )}
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold text-[#1B2B3A] uppercase cursor-pointer">Autofinancement (Apport)</label>
              <span className="text-sm font-bold text-[#D4AF64]">{downPaymentPercent}% — {downPayment.toLocaleString()} TND</span>
            </div>
            <input type="range" min={0} max={90} step={5} value={downPaymentPercent} onChange={e => setDownPaymentPercent(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1B2B3A]"/>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold text-[#1B2B3A] uppercase">Durée du Prêt</label>
              <span className="text-sm font-bold text-[#D4AF64]">{years} Ans</span>
            </div>
            <input type="range" min={5} max={25} step={1} value={years} onChange={e => setYears(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1B2B3A]"/>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1"><span>5 ans</span><span>25 ans</span></div>
          </div>
        </div>

        {/* Results Visualization */}
        <div className="bg-[#1B2B3A] p-6 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
          {/* Subtle background graphic */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-[#D4AF64]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <p className="text-[11px] font-bold text-[#9A8878] uppercase mb-1">Mensualité Estimée</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl md:text-5xl font-display font-bold text-white">{Math.round(monthlyPayment).toLocaleString()}</span>
              <span className="text-[#D4AF64] font-medium pb-1.5">TND / mois</span>
            </div>
            {(!price || price <= 0) ? <p className="text-xs text-red-400 mt-2">Veuillez entrer un prix valide.</p> : null}
          </div>

          <div className="mt-6 md:mt-8">
            <p className="text-[11px] font-bold text-[#9A8878] uppercase mb-3">Répartition Récapitulative</p>
            
            {/* Custom Horizontal Bar for Donut Replacement */}
            <div className="w-full h-3 rounded-full flex overflow-hidden mb-3 bg-gray-800">
               <div style={{ width: `${principalPercentage}%` }} className="h-full bg-emerald-500 transition-all duration-500"></div>
               <div style={{ width: `${interestPercentage}%` }} className="h-full bg-amber-500 transition-all duration-500"></div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-500"></div><span className="text-white">Capital Emprunté</span></div>
                <span className="font-bold text-white">{Math.round(principal).toLocaleString()} TND</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-amber-500"></div><span className="text-white">Intérêts Bancaires ({selectedBank.rate}%)</span></div>
                <span className="font-bold text-white">{Math.round(totalInterest).toLocaleString()} TND</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-sm">
                <span className="text-[#9A8878] font-bold">Coût Total</span>
                <span className="text-[#D4AF64] font-bold">{Math.round(totalCost).toLocaleString()} TND</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
