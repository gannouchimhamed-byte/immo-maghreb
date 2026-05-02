import type { Metadata } from "next";
import SavedSearchesClient from "./SavedSearchesClient";

export const metadata: Metadata = {
  title: "Mes alertes immobilières — Hestia",
  description: "Gérez vos recherches sauvegardées et alertes immobilières sur Hestia.",
};

export default function SavedSearchesPage() {
  return <SavedSearchesClient />;
}
