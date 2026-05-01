// ─── i18n configuration for ImmoMaghreb ───────────────────────
// Supports: fr-TN (primary), ar-TN (RTL), en (fallback)
//
// Usage:
//   import { useTranslation } from '@/lib/i18n/useTranslation';
//   const { t, locale, setLocale, isRTL } = useTranslation();
//   <div dir={isRTL ? 'rtl' : 'ltr'}>{t('listing.price')}</div>

export type Locale = "fr" | "ar" | "en";

export const LOCALES: { code: Locale; label: string; dir: "ltr" | "rtl"; flag: string }[] = [
  { code: "fr", label: "Français", dir: "ltr", flag: "🇫🇷" },
  { code: "ar", label: "العربية",  dir: "rtl", flag: "🇹🇳" },
  { code: "en", label: "English",  dir: "ltr", flag: "🇬🇧" },
];

// ─── Translation dictionary ────────────────────────────────────
export const translations: Record<Locale, Record<string, string>> = {
  fr: {
    // Nav
    "nav.home": "Accueil",
    "nav.listings": "Annonces",
    "nav.map": "Carte",
    "nav.alerts": "Alertes",
    "nav.dashboard": "Mon Espace",
    "nav.publish": "Publier une annonce",
    "nav.login": "Connexion",

    // Hero
    "hero.badge": "N°1 Tunisie & Maghreb · 2026",
    "hero.title": "Trouvez votre bien idéal au Maghreb",
    "hero.subtitle": "Appartements, villas, terrains — estimation IA, filtres localisés, contact WhatsApp.",
    "hero.search.placeholder": "Ville, quartier, wilaya...",
    "hero.search.cta": "Rechercher",
    "hero.tab.vente": "Acheter",
    "hero.tab.location": "Louer",
    "hero.stats.listings": "Annonces",
    "hero.stats.agents": "Agents SAMSAR",
    "hero.stats.wilayas": "Wilayas",

    // Listing
    "listing.price": "Prix",
    "listing.per_month": "/mois",
    "listing.area": "Surface",
    "listing.rooms": "Pièces",
    "listing.floor": "Étage",
    "listing.deed": "Titre foncier",
    "listing.deed.bleu": "Titre Bleu",
    "listing.deed.arabe": "Titre Arabe",
    "listing.deed.henchir": "Henchir",
    "listing.type.appartement": "Appartement",
    "listing.type.villa": "Villa",
    "listing.type.terrain": "Terrain",
    "listing.type.bureau": "Bureau",
    "listing.type.duplex": "Duplex",
    "listing.verified": "Vérifié",
    "listing.views": "vues",
    "listing.saved": "sauvegardes",

    // Actions
    "action.contact_wa": "Contacter via WhatsApp",
    "action.call": "Appeler l'agent",
    "action.save": "Sauvegarder",
    "action.share": "Partager",
    "action.create_alert": "Créer une alerte",
    "action.see_all": "Voir tout",
    "action.publish": "Publier",

    // Filters
    "filter.title": "Filtres",
    "filter.reset": "Réinitialiser",
    "filter.action": "Transaction",
    "filter.type": "Type de bien",
    "filter.wilaya": "Wilaya",
    "filter.deed": "Type de titre",
    "filter.price_max": "Budget max",
    "filter.proximity": "Proximité",
    "filter.mosque": "Mosquée",
    "filter.school": "École",

    // AI
    "ai.estimate": "Estimation IA",
    "ai.signal.underpriced": "Sous-évalué",
    "ai.signal.fair": "Prix juste",
    "ai.signal.overpriced": "Sur-évalué",
    "ai.updated": "Mis à jour cette semaine",

    // Auth
    "auth.phone.title": "Bienvenue",
    "auth.phone.subtitle": "Entrez votre numéro pour recevoir un code de connexion.",
    "auth.otp.title": "Vérification",
    "auth.channel.wa": "WhatsApp",
    "auth.channel.sms": "SMS",
    "auth.cta": "Recevoir le code",
    "auth.verify": "Valider",
    "auth.resend": "Renvoyer le code",
    "auth.resend.wait": "Renvoyer dans {sec}s",

    // Alerts
    "alert.title": "Mes alertes",
    "alert.create": "Nouvelle alerte",
    "alert.empty": "Aucune alerte active",
    "alert.frequency.instant": "Instantané",
    "alert.frequency.daily": "Quotidien",
    "alert.frequency.weekly": "Hebdomadaire",

    // Dashboard
    "dash.listings": "Mes annonces",
    "dash.leads": "Leads & Messages",
    "dash.analytics": "Statistiques",
    "dash.new_lead": "Nouveau lead",
    "dash.contacted": "Contacté",
    "dash.negotiation": "Négociation",
    "dash.closed": "Conclu",

    // Misc
    "misc.loading": "Chargement...",
    "misc.no_results": "Aucun bien trouvé",
    "misc.no_results_sub": "Essayez d'autres filtres",
    "misc.or": "ou",
    "misc.by": "par",
    "misc.ago": "il y a",
  },

  ar: {
    // Nav
    "nav.home": "الرئيسية",
    "nav.listings": "الإعلانات",
    "nav.map": "الخريطة",
    "nav.alerts": "التنبيهات",
    "nav.dashboard": "فضائي",
    "nav.publish": "نشر إعلان",
    "nav.login": "تسجيل الدخول",

    // Hero
    "hero.badge": "الأول في تونس والمغرب العربي · 2026",
    "hero.title": "اعثر على عقارك المثالي في المغرب العربي",
    "hero.subtitle": "شقق، فيلات، أراضٍ — تقييم بالذكاء الاصطناعي، تواصل واتساب فوري.",
    "hero.search.placeholder": "مدينة، حي، ولاية...",
    "hero.search.cta": "بحث",
    "hero.tab.vente": "شراء",
    "hero.tab.location": "إيجار",
    "hero.stats.listings": "إعلان",
    "hero.stats.agents": "سمسار",
    "hero.stats.wilayas": "ولاية",

    // Listing
    "listing.price": "السعر",
    "listing.per_month": "/شهر",
    "listing.area": "المساحة",
    "listing.rooms": "الغرف",
    "listing.floor": "الطابق",
    "listing.deed": "وثيقة الملكية",
    "listing.deed.bleu": "الرسم الأزرق",
    "listing.deed.arabe": "الرسم العربي",
    "listing.deed.henchir": "هنشير",
    "listing.type.appartement": "شقة",
    "listing.type.villa": "فيلا",
    "listing.type.terrain": "أرض",
    "listing.type.bureau": "مكتب",
    "listing.type.duplex": "دوبليكس",
    "listing.verified": "موثّق",
    "listing.views": "مشاهدة",
    "listing.saved": "محفوظة",

    // Actions
    "action.contact_wa": "التواصل عبر واتساب",
    "action.call": "الاتصال بالوكيل",
    "action.save": "حفظ",
    "action.share": "مشاركة",
    "action.create_alert": "إنشاء تنبيه",
    "action.see_all": "عرض الكل",
    "action.publish": "نشر",

    // Filters
    "filter.title": "الفلاتر",
    "filter.reset": "إعادة ضبط",
    "filter.action": "نوع المعاملة",
    "filter.type": "نوع العقار",
    "filter.wilaya": "الولاية",
    "filter.deed": "نوع الرسم",
    "filter.price_max": "الحد الأقصى للسعر",
    "filter.proximity": "القُرب",
    "filter.mosque": "مسجد",
    "filter.school": "مدرسة",

    // AI
    "ai.estimate": "تقدير الذكاء الاصطناعي",
    "ai.signal.underpriced": "أقل من السعر",
    "ai.signal.fair": "سعر عادل",
    "ai.signal.overpriced": "أغلى من السعر",
    "ai.updated": "تم التحديث هذا الأسبوع",

    // Auth
    "auth.phone.title": "أهلاً وسهلاً",
    "auth.phone.subtitle": "أدخل رقم هاتفك لاستلام رمز التحقق.",
    "auth.otp.title": "التحقق",
    "auth.channel.wa": "واتساب",
    "auth.channel.sms": "رسالة نصية",
    "auth.cta": "استلام الرمز",
    "auth.verify": "تأكيد",
    "auth.resend": "إعادة الإرسال",
    "auth.resend.wait": "إعادة الإرسال خلال {sec} ث",

    // Alerts
    "alert.title": "تنبيهاتي",
    "alert.create": "تنبيه جديد",
    "alert.empty": "لا توجد تنبيهات نشطة",
    "alert.frequency.instant": "فوري",
    "alert.frequency.daily": "يومي",
    "alert.frequency.weekly": "أسبوعي",

    // Dashboard
    "dash.listings": "إعلاناتي",
    "dash.leads": "العملاء والرسائل",
    "dash.analytics": "الإحصائيات",
    "dash.new_lead": "عميل جديد",
    "dash.contacted": "تم التواصل",
    "dash.negotiation": "تفاوض",
    "dash.closed": "مغلق",

    // Misc
    "misc.loading": "جارٍ التحميل...",
    "misc.no_results": "لا توجد عقارات",
    "misc.no_results_sub": "جرّب تغيير الفلاتر",
    "misc.or": "أو",
    "misc.by": "بواسطة",
    "misc.ago": "منذ",
  },

  en: {
    "nav.home": "Home",
    "nav.listings": "Listings",
    "nav.map": "Map",
    "nav.alerts": "Alerts",
    "nav.dashboard": "My Space",
    "nav.publish": "List a property",
    "nav.login": "Sign in",
    "hero.title": "Find your ideal property in the Maghreb",
    "hero.subtitle": "Apartments, villas, land — AI valuation, local filters, WhatsApp contact.",
    "hero.search.placeholder": "City, district, wilaya...",
    "hero.search.cta": "Search",
    "hero.tab.vente": "Buy",
    "hero.tab.location": "Rent",
    "listing.deed.bleu": "Blue Title",
    "listing.deed.arabe": "Arabic Title",
    "action.contact_wa": "Contact via WhatsApp",
    "action.save": "Save",
    "action.share": "Share",
    "ai.signal.underpriced": "Underpriced",
    "ai.signal.fair": "Fair price",
    "ai.signal.overpriced": "Overpriced",
    "misc.loading": "Loading...",
    "misc.no_results": "No properties found",
    "misc.no_results_sub": "Try adjusting your filters",
  },
};

// ─── Translation hook ──────────────────────────────────────────
export function createTranslator(locale: Locale) {
  return function t(key: string, vars?: Record<string, string | number>): string {
    const dict = translations[locale] ?? translations.fr;
    let str = dict[key] ?? translations.fr[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };
}

export function getDir(locale: Locale): "ltr" | "rtl" {
  return LOCALES.find((l) => l.code === locale)?.dir ?? "ltr";
}
