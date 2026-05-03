import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("@/components/ui/ChatWidget"), { ssr: false });

export const metadata: Metadata = {
  title: { default: "Hestia — Trouvez votre chez-vous en Tunisie", template: "%s | Hestia" },
  description: "Hestia, la plateforme immobilière N°1 en Tunisie. Appartements, villas, terrains avec estimation IA et contact WhatsApp.",
  keywords: "hestia, immobilier tunisie, appartement tunis, villa, terrain, location, vente",
  metadataBase: new URL("https://hestia.tn"),
  openGraph: {
    title: "Hestia — Find Your Home",
    description: "N°1 de l'immobilier au Maghreb",
    type: "website",
    locale: "fr_TN",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-cream min-h-screen antialiased">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
