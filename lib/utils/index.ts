import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  tnd: number,
  currency: "TND" | "EUR" | "USD" = "TND",
  rates = { EUR: 0.295, USD: 0.323 }
): string {
  const amounts = {
    TND: tnd,
    EUR: tnd * rates.EUR,
    USD: tnd * rates.USD,
  };
  const symbols = { TND: "DT", EUR: "€", USD: "$" };
  const amount = amounts[currency];
  const symbol = symbols[currency];

  if (amount >= 1_000_000) {
    return `${symbol} ${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `${symbol} ${(amount / 1_000).toFixed(0)}K`;
  }
  return `${symbol} ${amount.toLocaleString("fr-TN")}`;
}

export function formatArea(m2: number): string {
  return `${m2.toLocaleString("fr-TN")} m²`;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getDeedLabel(deed: string, locale = "fr"): string {
  const labels: Record<string, Record<string, string>> = {
    titre_bleu: { fr: "Titre Bleu", ar: "طابو أزرق", en: "Blue Title" },
    titre_arabe: { fr: "Titre Arabe", ar: "طابو عربي", en: "Arabic Title" },
    titre_foncier: { fr: "Titre Foncier", ar: "سند ملكية", en: "Land Title" },
    en_cours: { fr: "En cours", ar: "قيد الإنجاز", en: "In Progress" },
    copropriete: { fr: "Copropriété", ar: "ملكية مشتركة", en: "Joint Ownership" },
  };
  return labels[deed]?.[locale] ?? deed;
}

export function getPropertyTypeLabel(type: string, locale = "fr"): string {
  const labels: Record<string, Record<string, string>> = {
    apartment: { fr: "Appartement", ar: "شقة", en: "Apartment" },
    villa: { fr: "Villa", ar: "فيلا", en: "Villa" },
    house: { fr: "Maison", ar: "منزل", en: "House" },
    studio: { fr: "Studio", ar: "استوديو", en: "Studio" },
    duplex: { fr: "Duplex", ar: "دوبلكس", en: "Duplex" },
    penthouse: { fr: "Penthouse", ar: "بنتهاوس", en: "Penthouse" },
    land: { fr: "Terrain", ar: "أرض", en: "Land" },
    commercial: { fr: "Local commercial", ar: "محل تجاري", en: "Commercial" },
    office: { fr: "Bureau", ar: "مكتب", en: "Office" },
    warehouse: { fr: "Entrepôt", ar: "مستودع", en: "Warehouse" },
  };
  return labels[type]?.[locale] ?? type;
}

export function timeAgo(dateStr: string, locale = "fr"): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 60) return locale === "ar" ? `منذ ${diffMins} دقيقة` : `Il y a ${diffMins}min`;
  if (diffHours < 24) return locale === "ar" ? `منذ ${diffHours} ساعة` : `Il y a ${diffHours}h`;
  if (diffDays < 7) return locale === "ar" ? `منذ ${diffDays} أيام` : `Il y a ${diffDays}j`;
  return date.toLocaleDateString(locale === "ar" ? "ar-TN" : "fr-TN");
}
