"use client";
import { useState } from "react";

interface Filters {
  action: string;
  type: string;
  wilaya: string;
  deed: string;
  maxPrice: number;
  search: string;
}

interface SearchFiltersProps {
  onFilter?: (filters: Filters) => void;
}

export default function SearchFilters({ onFilter }: SearchFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    action: "tous", type: "tous", wilaya: "tous",
    deed: "tous", maxPrice: 2000000, search: "",
  });

  const update = (key: keyof Filters, value: any) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilter?.(next);
  };

  return (
    <div style={{ background: "#FDFBF7", borderRadius: 12, padding: 20, border: "1px solid #EDE5D4" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1C1208", marginBottom: 16 }}>Filtres</div>
      <input placeholder="Rechercher..." value={filters.search}
        onChange={e => update("search", e.target.value)}
        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #EDE5D4", background: "#F7F2E9", fontSize: 13, marginBottom: 12, outline: "none", boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {["tous","vente","location"].map(v => (
          <button key={v} onClick={() => update("action", v)} style={{
            flex: 1, padding: "6px 4px", borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: "pointer",
            background: filters.action === v ? "#C4611F" : "#EDE5D4",
            color: filters.action === v ? "#fff" : "#5C3D1E", border: "none",
          }}>{v === "tous" ? "Tous" : v === "vente" ? "Vente" : "Location"}</button>
        ))}
      </div>
      <select value={filters.wilaya} onChange={e => update("wilaya", e.target.value)}
        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #EDE5D4", background: "#F7F2E9", fontSize: 13, marginBottom: 12, cursor: "pointer" }}>
        {["tous","Tunis","Sfax","Sousse","Nabeul","Monastir"].map(w => <option key={w} value={w}>{w === "tous" ? "Toutes les wilayas" : w}</option>)}
      </select>
      <select value={filters.type} onChange={e => update("type", e.target.value)}
        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #EDE5D4", background: "#F7F2E9", fontSize: 13, cursor: "pointer" }}>
        {["tous","appartement","villa","terrain","bureau","duplex"].map(t => <option key={t} value={t}>{t === "tous" ? "Tous les types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
      </select>
    </div>
  );
}
