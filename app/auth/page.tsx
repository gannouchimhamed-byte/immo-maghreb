import type { Metadata } from "next";
import AuthClient from "./AuthClient";

export const metadata: Metadata = {
  title: "Connexion — Hestia",
  description: "Connectez-vous à Hestia pour gérer vos alertes et biens favoris.",
};

export default function AuthPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const returnTo = searchParams?.returnTo || "/";
  return <AuthClient returnTo={returnTo} />;
}
