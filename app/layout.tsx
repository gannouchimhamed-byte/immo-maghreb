import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "ImmoMaghreb — Immobilier Tunisie & Maghreb",
  description: "Trouvez votre bien immobilier en Tunisie. Appartements, villas, terrains avec estimation IA et contact WhatsApp.",
  keywords: "immobilier tunisie, appartement tunis, villa, terrain, location, vente",
  openGraph: {
    title: "ImmoMaghreb",
    description: "N°1 de l'immobilier au Maghreb",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={outfit.variable} style={{ fontFamily: "var(--font-outfit), sans-serif", background: "#F7F2E9", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
