import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hestia — Trouvez votre chez-vous au Maghreb",
  description: "Hestia, la plateforme immobilière N°1 en Tunisie. Appartements, villas, terrains avec estimation IA et contact WhatsApp.",
  keywords: "hestia, immobilier tunisie, appartement tunis, villa, terrain, location, vente",
  openGraph: {
    title: "Hestia — Find Your Home",
    description: "N°1 de l'immobilier au Maghreb",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin:0, padding:0, background:"#F7F3EE", fontFamily:"Georgia, serif" }}>
        {children}
      </body>
    </html>
  );
}
