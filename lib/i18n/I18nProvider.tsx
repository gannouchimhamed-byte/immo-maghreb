"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type Locale, LOCALES, createTranslator, getDir } from "./translations";

// ─── Context ──────────────────────────────────────────────────
interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    // Update document dir for full RTL layout
    if (typeof document !== "undefined") {
      document.documentElement.dir = getDir(l);
      document.documentElement.lang = l;
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      createTranslator(locale)(key, vars),
    [locale]
  );

  return (
    <I18nContext.Provider value={{
      locale, setLocale, t,
      dir: getDir(locale),
      isRTL: locale === "ar",
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be inside <I18nProvider>");
  return ctx;
}

// ─── RTL-aware spacing helpers ────────────────────────────────
// Usage: <div style={ms(16)}>  →  margin-left in LTR, margin-right in RTL
export function useRTLStyles() {
  const { isRTL } = useTranslation();

  return {
    // margin-start / margin-end
    ms: (v: number) => ({ [isRTL ? "marginRight" : "marginLeft"]: v } as React.CSSProperties),
    me: (v: number) => ({ [isRTL ? "marginLeft" : "marginRight"]: v } as React.CSSProperties),
    ps: (v: number) => ({ [isRTL ? "paddingRight" : "paddingLeft"]: v } as React.CSSProperties),
    pe: (v: number) => ({ [isRTL ? "paddingLeft" : "paddingRight"]: v } as React.CSSProperties),
    // flex direction
    rowDir: isRTL ? "row-reverse" : "row",
    textAlign: isRTL ? "right" : "left",
    start: isRTL ? "right" : "left",
    end: isRTL ? "left" : "right",
    float: (v: "start" | "end") =>
      ({ float: v === "start" ? (isRTL ? "right" : "left") : isRTL ? "left" : "right" } as React.CSSProperties),
  } as const;
}

// ─── Locale switcher component ─────────────────────────────────
export function LocaleSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div style={{ display: "flex", gap: 2, background: "#EDE5D4", borderRadius: 6, overflow: "hidden" }}>
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          title={l.label}
          style={{
            padding: "5px 10px",
            fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
            background: locale === l.code ? "#C4611F" : "transparent",
            color: locale === l.code ? "#fff" : "#5C3D1E",
            transition: "all .15s",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <span>{l.flag}</span>
          <span>{l.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

// ─── RTL-aware number formatting ─────────────────────────────
export function formatPriceLocale(price: number, locale: Locale, currency: string): string {
  const rates: Record<string, number> = { TND: 1, EUR: 0.295, USD: 0.323 };
  const symbols: Record<string, string> = { TND: "DT", EUR: "€", USD: "$" };
  const v = Math.round(price * (rates[currency] ?? 1));
  const sym = symbols[currency] ?? "DT";

  if (locale === "ar") {
    // Arabic numeral formatting
    const arNum = v.toLocaleString("ar-TN");
    return currency === "EUR" ? `${v.toLocaleString("fr-TN")} ${sym}` : `${arNum} ${sym}`;
  }
  return `${v.toLocaleString("fr-TN")} ${sym}`;
}
