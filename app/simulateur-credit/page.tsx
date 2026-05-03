import MortgageCalculator from "@/components/ui/MortgageCalculator";

export const metadata = {
  title: "Simulateur de Crédit Immobilier Tunisie | Hestia",
  description: "Calculez vos mensualités de crédit immobilier et votre capacité d'emprunt selon les taux des banques tunisiennes (BIAT, Amen Bank, Attijari).",
};

export default function SimulateurPage() {
  return (
    <div className="min-h-screen bg-[#FDFAF6] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <MortgageCalculator isStandalone={true} />
        
        <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm animate-fade-up">
           <h3 className="text-xl font-display font-semibold text-[#1B2B3A] mb-4">Comment est calculée votre mensualité ?</h3>
           <p className="text-sm text-[#9A8878] leading-relaxed mb-4">
             Notre simulateur se base sur la formule d'amortissement standard utilisée par la majorité des banques en Tunisie. Le <strong>Taux Global Effectif (TGE)</strong> inclut généralement:
           </p>
           <ul className="text-sm text-[#9A8878] leading-relaxed list-disc list-inside space-y-2 mb-6 ml-2">
             <li>Le Taux Moyen du Marché (TMM) défini par la BCT.</li>
             <li>La marge bénéficiaire de la banque (généralement entre +2.5% et +4.5% selon votre profil et votre apport).</li>
             <li>Les frais d'assurances vie et invalidité (souvent obligatoires).</li>
           </ul>
           <p className="text-sm text-[#9A8878] leading-relaxed mb-4">
             <strong>Conseil d'expert Hestia :</strong> Un autofinancement supérieur à 20% augmente considérablement vos chances d'obtenir une décote sur la marge bancaire. N'hésitez pas à faire jouer la concurrence.
           </p>
        </div>
      </div>
    </div>
  );
}
