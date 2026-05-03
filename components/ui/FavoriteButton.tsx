"use client";

import { useState, useEffect, useCallback } from "react";

interface Props {
  listingId: string;
  userId: string | null;
  initialFaved?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "card" | "detail"; // card = inline with title, detail = circular overlay
  onAuthRequired?: () => void; // called when user not logged in
  onToggle?: (faved: boolean) => void;
}

export default function FavoriteButton({
  listingId,
  userId,
  initialFaved = false,
  size = "md",
  variant = "card",
  onAuthRequired,
  onToggle,
}: Props) {
  const [faved, setFaved] = useState(initialFaved);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check current favorite status from DB
  useEffect(() => {
    setMounted(true);
    if (!userId) return;
    import("@/lib/auth")
      .then(({ isFavorite }) => isFavorite(userId, listingId))
      .then(setFaved)
      .catch(() => {});
  }, [userId, listingId]);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      onAuthRequired?.();
      return;
    }

    if (loading) return;
    setLoading(true);

    // Optimistic update
    const next = !faved;
    setFaved(next);

    try {
      const { toggleFavorite } = await import("@/lib/auth");
      const result = await toggleFavorite(userId, listingId);
      setFaved(result);
      onToggle?.(result);

      // Toast notification
      showToast(result ? "Bien ajouté aux favoris ❤" : "Bien retiré des favoris");
    } catch {
      setFaved(faved); // revert on error
    } finally {
      setLoading(false);
    }
  }, [userId, listingId, faved, loading, onAuthRequired, onToggle]);

  if (!mounted) return null;

  // ── Card variant: simple heart next to title (ImmoScout24 style) ────────────
  if (variant === "card") {
    const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label={faved ? "Retirer des favoris" : "Ajouter aux favoris"}
        className={`shrink-0 transition-all duration-200 ${loading ? "opacity-50" : "hover:scale-110 active:scale-95"}`}
      >
        {loading ? (
          <div className={`${iconSize} border border-navy/30 border-t-transparent rounded-full animate-spin`}/>
        ) : (
          <svg
            className={`${iconSize} transition-all duration-200`}
            viewBox="0 0 20 20"
            fill={faved ? "#ef4444" : "none"}
            stroke={faved ? "#ef4444" : "#9A8878"}
            strokeWidth="1.5"
          >
            <path d="M10 17.5S2.5 12.5 2.5 6.5a4.5 4.5 0 019 0 4.5 4.5 0 019 0c0 6-7.5 11-7.5 11z"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    );
  }

  // ── Detail variant: circular button (on image gallery) ──────────────────────
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={faved ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200 ${
        loading ? "opacity-60" : "hover:scale-110 active:scale-95 hover:shadow-lg"
      } ${faved ? "ring-2 ring-rose-200" : ""}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-navy/30 border-t-transparent rounded-full animate-spin"/>
      ) : (
        <svg className="w-5 h-5 transition-all duration-200"
          viewBox="0 0 20 20"
          fill={faved ? "#ef4444" : "none"}
          stroke={faved ? "#ef4444" : "#1B2B3A"}
          strokeWidth="1.5">
          <path d="M10 17.5S2.5 12.5 2.5 6.5a4.5 4.5 0 019 0 4.5 4.5 0 019 0c0 6-7.5 11-7.5 11z"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

// ── Toast system ─────────────────────────────────────────────────────────────
function showToast(message: string) {
  // Remove existing toast
  document.querySelectorAll("[data-hestia-toast]").forEach(el => el.remove());

  const toast = document.createElement("div");
  toast.setAttribute("data-hestia-toast", "1");
  toast.style.cssText = `
    position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
    background: #1B2B3A; color: #F7F3EE;
    padding: 10px 20px; border-radius: 50px;
    font-size: 13px; font-weight: 500; font-family: Inter, sans-serif;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    z-index: 9999; white-space: nowrap;
    animation: toastIn 0.25s ease-out;
    border: 1px solid rgba(212,175,100,0.3);
  `;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
    @keyframes toastOut { from { opacity:1; } to { opacity:0; transform: translateX(-50%) translateY(10px); } }
  `;
  document.head.appendChild(style);
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastOut 0.25s ease-in forwards";
    setTimeout(() => toast.remove(), 250);
  }, 2500);
}
