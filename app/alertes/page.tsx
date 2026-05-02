import { Metadata } from "next";
import AlertesClient from "./AlertesClient";

export const metadata: Metadata = {
  title: "Mes alertes — Hestia",
  description: "Gérez vos recherches sauvegardées et alertes immobilières sur Hestia.",
};

export default function AlertesPage() {
  return <AlertesClient />;
}
