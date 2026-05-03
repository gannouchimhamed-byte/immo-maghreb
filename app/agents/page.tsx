import AgentDirectoryClient from "./AgentDirectoryClient";

export const metadata = {
  title: "Trouver un Agent Immobilier — Hestia",
  description: "Découvrez les meilleurs agents immobiliers en Tunisie. Filtrez par spécialité, ville et notes certifiées.",
};

export default function AgentsPage() {
  return <AgentDirectoryClient />;
}
