import { Suspense } from "react";
import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Tableau de bord — Hestia Agent",
  description: "Gérez vos annonces, leads et analytics sur Hestia.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin"/>
      </div>
    }>
      <DashboardClient/>
    </Suspense>
  );
}
