import type { Metadata } from "next";
import ProfilClient from "./ProfilClient";

export const metadata: Metadata = {
  title: "Mon profil — Hestia",
};

export default function ProfilPage() {
  return <ProfilClient />;
}
