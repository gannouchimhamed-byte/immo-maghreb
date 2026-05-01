"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal, X, Mosque, GraduationCap, Train } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingFilters, PropertyType, DeedType } from "@immo-na/types";

interface SearchFiltersProps {
  filters: ListingFilters;
  onChange: (filters: Partial<ListingFilters>) => void;
  onReset: () => void;
  resultCount?: number;
}

const wilayas = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan",
  "Bizerte", "Béja", "Jendouba", "Kef", "Siliana", "Sousse",
  "Monastir", "Mahdia", "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid",
  "Gabès", "Médenine", "Tataouine", "Gafsa", "Tozeur", "Kébili",
];

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Appartement" },
  { value: "villa", label: "Villa" },
  { value: "house", label: "Maison" },
  { value: "studio", label: "Studio" },
  { value: "duplex", label: "Duplex" },
  { value: "penthouse", label: "Penthouse" },
  { value: "land", label: "Terrain" },
  { value: "commercial", label: "Local commercial" },
  { value: "office", label: "Bureau" },
];

const deedTypes: { value: DeedType; label: string; color: string }[] = [
  { value: "titre_bleu", label: "Titre Bleu", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { value: "titre_arabe", label: "Titre Arabe", color: "bg-amber-50 border-amber-200 text-amber-700" },
  { value: "titre_foncier", label: "Titre Foncier", color: "bg-green-50 border-green-200 text-green-700" },
  { value: "en_cours", label: "En cours", color: "bg-sand-100 border-sand-200 text-sand-600" },
  { value: "copropriete", label: "Copropriété", color: "bg-purple-50 border-purple-200 text-purple-700" },
];

const priceRanges = [
  { min: 0, max: 100_000, label: "< 100K DT" },
  { min: 100_000, max: 250_000, label: "100K – 250K DT" },
  { min: 250_000, max: 500_000, label: "250K – 500K DT" },
  { min: 500_000, max: 1_000_000, label: "500K – 1M DT" },
  { min: 1_000_000, max: undefined, label: "> 1M DT" },
];

export function SearchFilters({ filters, onChange, onReset, resultCount }: SearchFiltersProps) {
  const [expanded, setExpanded] = useState<string[]>(["type", "location"]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = (section: string) => {
    setExpanded((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expanded.includes(section);

  const togglePropertyType = (pt: PropertyType) => {
    const current = filters.propertyType ?? [];
    const next = current.includes(pt)
      ? current.filter((t) => t !== pt)
      : [...current, pt];
    onChange({ propertyType: next.length ? next : undefined });
  };

  const toggleDeedType = (dt: DeedType) => {
    const current = filters.deedType ?? [];
    const next = current.includes(dt)
      ? current.filter((t) => t !== dt)
      : [...current, dt];
    onChange({ deedType: next.length ? next : undefined });
  };

  const activeFilterCount = [
    filters.propertyType?.length,
    filters.deedType?.length,
    filters.minPrice || filters.maxPrice,
    filters.minArea || filters.maxArea,
    filters.minRooms,
    filters.nearMosque,
    filters.nearSchool,
    filters.nearMetro,
    filters.hasParking,
    filters.hasElevator,
  ].filter(Boolean).length;

  const FilterSection = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-sand-100 last:border-0">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between py-3.5 text-left"
      >
        <span className="font-body text-sm font-medium text-charcoal-800">{title}</span>
        <ChevronDown
          size={14}
          className={cn(
            "text-sand-400 transition-transform duration-200",
            isExpanded(id) && "rotate-180"
          )}
        />
      </button>
      {isExpanded(id) && <div className="pb-4">{children}</div>}
    </div>
  );

  const filtersContent = (
    <div className="space-y-0">
      {/* Transaction type */}
      <FilterSection id="type" title="Type de transaction">
        <div className="flex gap-2">
          {(["sale", "rent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onChange({ type: filters.type === t ? undefined : t })}
              className={cn(
                "flex-1 py-2.5 rounded-xl border font-body text-sm font-medium transition-all duration-200",
                filters.type === t
                  ? "bg-charcoal-900 border-charcoal-900 text-sand-50"
                  : "border-sand-200 text-charcoal-700 hover:border-charcoal-300 hover:bg-sand-50"
              )}
            >
              {t === "sale" ? "Acheter" : "Louer"}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Location */}
      <FilterSection id="location" title="Localisation">
        <select
          value={filters.wilaya ?? ""}
          onChange={(e) => onChange({ wilaya: e.target.value || undefined })}
          className="input text-sm"
        >
          <option value="">Toutes les wilayas</option>
          {wilayas.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </FilterSection>

      {/* Property type */}
      <FilterSection id="propertyType" title="Type de bien">
        <div className="flex flex-wrap gap-1.5">
          {propertyTypes.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => togglePropertyType(value)}
              className={cn(
                "px-3 py-1.5 rounded-lg border font-body text-xs font-medium transition-all duration-200",
                (filters.propertyType ?? []).includes(value)
                  ? "bg-charcoal-900 border-charcoal-900 text-sand-50"
                  : "border-sand-200 text-charcoal-700 hover:border-sand-300 hover:bg-sand-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection id="price" title="Budget">
        <div className="flex flex-col gap-2 mb-3">
          {priceRanges.map(({ min, max, label }) => (
            <button
              key={label}
              onClick={() => onChange({ minPrice: min || undefined, maxPrice: max })}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl border font-body text-sm transition-all duration-200",
                filters.minPrice === (min || undefined) && filters.maxPrice === max
                  ? "bg-charcoal-900 border-charcoal-900 text-sand-50"
                  : "border-sand-100 text-charcoal-700 hover:border-sand-300 hover:bg-sand-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min (DT)"
            value={filters.minPrice ?? ""}
            onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
            className="input text-sm"
          />
          <input
            type="number"
            placeholder="Max (DT)"
            value={filters.maxPrice ?? ""}
            onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
            className="input text-sm"
          />
        </div>
      </FilterSection>

      {/* Area */}
      <FilterSection id="area" title="Surface (m²)">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minArea ?? ""}
            onChange={(e) => onChange({ minArea: e.target.value ? Number(e.target.value) : undefined })}
            className="input text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxArea ?? ""}
            onChange={(e) => onChange({ maxArea: e.target.value ? Number(e.target.value) : undefined })}
            className="input text-sm"
          />
        </div>
      </FilterSection>

      {/* Rooms */}
      <FilterSection id="rooms" title="Nombre de pièces">
        <div className="flex gap-1.5 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => onChange({ minRooms: filters.minRooms === n ? undefined : n })}
              className={cn(
                "w-10 h-10 rounded-xl border font-body text-sm font-medium transition-all",
                filters.minRooms === n
                  ? "bg-charcoal-900 border-charcoal-900 text-sand-50"
                  : "border-sand-200 text-charcoal-700 hover:border-sand-300"
              )}
            >
              {n}+
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Deed type — North African specific */}
      <FilterSection id="deed" title="Type de titre">
        <div className="flex flex-col gap-2">
          {deedTypes.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => toggleDeedType(value)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl border font-body text-sm font-medium transition-all duration-200",
                (filters.deedType ?? []).includes(value)
                  ? cn("border-2", color)
                  : "border-sand-100 text-charcoal-700 hover:border-sand-300 hover:bg-sand-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* North African POI proximity */}
      <FilterSection id="poi" title="À proximité">
        <div className="flex flex-col gap-2.5">
          {[
            { key: "nearMosque", label: "Mosquée", icon: "🕌" },
            { key: "nearSchool", label: "École / Lycée", icon: "🏫" },
            { key: "nearMetro", label: "Métro / Bus", icon: "🚇" },
            { key: "hasParking", label: "Parking inclus", icon: "🅿️" },
            { key: "hasElevator", label: "Ascenseur", icon: "🛗" },
            { key: "hasTerrace", label: "Terrasse / Jardin", icon: "🌿" },
          ].map(({ key, label, icon }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                  (filters as any)[key]
                    ? "bg-charcoal-900 border-charcoal-900"
                    : "border-sand-300 group-hover:border-sand-400"
                )}
                onClick={() => onChange({ [key]: !(filters as any)[key] })}
              >
                {(filters as any)[key] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="font-body text-sm text-charcoal-700 group-hover:text-charcoal-900 transition-colors">
                {icon} {label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar filters */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-20 bg-white rounded-2xl border border-sand-200 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-gold-500" />
              <span className="font-body text-sm font-medium text-charcoal-900">Filtres</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-charcoal-900 text-white text-2xs flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={onReset}
                className="flex items-center gap-1 text-xs font-body text-sand-400 hover:text-terracotta-500 transition-colors"
              >
                <X size={11} />
                Réinitialiser
              </button>
            )}
          </div>
          {filtersContent}
          {resultCount !== undefined && (
            <div className="mt-4 pt-4 border-t border-sand-100 text-center">
              <span className="font-body text-sm text-sand-500">
                <strong className="text-charcoal-900">{resultCount.toLocaleString()}</strong> annonces trouvées
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile filter button + drawer */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 btn-ghost text-sm relative"
        >
          <SlidersHorizontal size={14} />
          Filtres
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-charcoal-900 text-white text-2xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex flex-col">
            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="bg-white rounded-t-3xl p-5 max-h-[85dvh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <span className="font-display text-xl font-medium">Filtres</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
              {filtersContent}
              <div className="pt-4 flex gap-3">
                {activeFilterCount > 0 && (
                  <button onClick={onReset} className="btn-ghost flex-1">
                    Réinitialiser
                  </button>
                )}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="btn-gold flex-1"
                >
                  Voir {resultCount ?? ""} résultats
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
