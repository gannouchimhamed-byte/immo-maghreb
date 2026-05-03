import AtlasClient from "./AtlasClient";

export const metadata = {
  title: "Atlas des Prix — Hestia",
  description: "Carte interactive des prix immobiliers par wilaya en Tunisie. Comparez les marchés de Tunis, Sousse, Sfax et toutes les wilayas.",
};

export default function AtlasPage() {
  return <AtlasClient />;
}
