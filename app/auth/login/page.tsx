import type { Metadata } from "next";
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Connexion — Hestia",
  description: "Connectez-vous ou créez votre compte Hestia pour gérer vos alertes immobilières en Tunisie.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin"/>
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}
