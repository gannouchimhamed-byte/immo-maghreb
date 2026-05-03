import { Suspense } from "react";
import type { Metadata } from "next";
import PostFormClient from "./PostFormClient";

export const metadata: Metadata = {
  title: "Publier une annonce — Hestia",
  description: "Publiez votre bien immobilier sur Hestia en quelques minutes.",
};

export default function PostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin"/>
      </div>
    }>
      <PostFormClient/>
    </Suspense>
  );
}
