"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  onClose: () => void;
}

export default function AuthPromptModal({ onClose }: Props) {
  const pathname = usePathname();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-[#FDFAF6] rounded-3xl shadow-2xl overflow-hidden animate-fade-up">
        {/* Decorative header */}
        <div className="bg-navy px-6 pt-7 pb-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{backgroundImage:"repeating-linear-gradient(45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 20px)",backgroundSize:"20px 20px"}}/>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-400/40 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 17.5S2.5 12.5 2.5 6.5a4.5 4.5 0 019 0 4.5 4.5 0 019 0c0 6-7.5 11-7.5 11z"/>
              </svg>
            </div>
            <h3 className="font-display text-[20px] text-cream font-semibold leading-tight">
              Sauvegardez ce bien
            </h3>
            <p className="text-cream/50 text-[13px] mt-1">
              Connectez-vous pour ajouter aux favoris
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-[13px] text-cream-muted leading-relaxed text-center mb-6">
            Créez un compte gratuit pour sauvegarder vos biens préférés et recevoir des alertes personnalisées.
          </p>

          {/* Benefits list */}
          <div className="space-y-2 mb-6">
            {[
              { icon: "❤", text: "Sauvegardez vos biens favoris" },
              { icon: "🔔", text: "Créez des alertes email / WhatsApp" },
              { icon: "⚖", text: "Comparez jusqu'à 3 biens côte à côte" },
            ].map(b => (
              <div key={b.icon} className="flex items-center gap-3 text-[13px] text-navy">
                <span className="text-base">{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href={`/auth/login?returnTo=${encodeURIComponent(pathname)}`}
              className="block w-full py-3.5 rounded-xl bg-navy text-gold text-[14px] font-bold text-center hover:bg-navy/90 transition no-underline"
              onClick={onClose}
            >
              Se connecter
            </Link>
            <Link
              href={`/auth/login?returnTo=${encodeURIComponent(pathname)}`}
              className="block w-full py-3 rounded-xl border-2 border-navy/15 text-navy text-[13px] font-semibold text-center hover:bg-cream transition no-underline"
              onClick={onClose}
            >
              Créer un compte gratuit
            </Link>
          </div>

          <button onClick={onClose}
            className="w-full mt-3 text-[12px] text-cream-muted hover:text-navy transition-colors py-1">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
