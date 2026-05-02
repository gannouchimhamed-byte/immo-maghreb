"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  geocodeAddress, commuteRadiusKm, estimateCommuteMinutes,
  NominatimResult, CommuteState, TransportMode,
  MODE_LABELS, SPEED_KMH,
} from "@/lib/commute";

interface Props {
  value: CommuteState | null;
  onChange: (v: CommuteState | null) => void;
  compact?: boolean; // true = sidebar version, false = map overlay version
}

const TIME_OPTIONS = [10, 15, 20, 30, 45, 60];
const MODES: TransportMode[] = ["car", "transit", "walk", "bike"];

export default function CommuteFilter({ value, onChange, compact = false }: Props) {
  const [query, setQuery] = useState(value?.address || "");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<TransportMode>(value?.mode || "car");
  const [minutes, setMinutes] = useState(value?.maxMinutes || 30);
  const [active, setActive] = useState(!!value);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced geocode search
  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await geocodeAddress(q);
        setResults(data);
        setOpen(data.length > 0);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  // When user picks a result from dropdown
  const handleSelect = useCallback((result: NominatimResult) => {
    const shortName = result.display_name.split(",").slice(0, 2).join(",").trim();
    setQuery(shortName);
    setResults([]);
    setOpen(false);
    const state: CommuteState = {
      address: shortName,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      mode,
      maxMinutes: minutes,
    };
    setActive(true);
    onChange(state);
  }, [mode, minutes, onChange]);

  // Update commute when mode or minutes change (if already have a destination)
  const handleModeChange = useCallback((m: TransportMode) => {
    setMode(m);
    if (value) onChange({ ...value, mode: m });
  }, [value, onChange]);

  const handleMinutesChange = useCallback((min: number) => {
    setMinutes(min);
    if (value) onChange({ ...value, maxMinutes: min });
  }, [value, onChange]);

  const handleClear = useCallback(() => {
    setQuery("");
    setActive(false);
    onChange(null);
    inputRef.current?.focus();
  }, [onChange]);

  const radiusKm = commuteRadiusKm(mode, minutes);

  if (compact) {
    // ── Sidebar version ──────────────────────────────────────────────────────
    return (
      <div className="space-y-3">
        {/* Address search */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cream-muted pointer-events-none" viewBox="0 0 14 14" fill="none">
              <path d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 115.5 5 1.5 1.5 0 017 6.5z" fill="currentColor"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Ex: Avenue Bourguiba, Tunis"
              className="w-full pl-8 pr-8 py-2.5 rounded-lg border border-navy/15 bg-white text-[12px] text-navy placeholder:text-cream-muted/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
            {loading && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border border-gold border-t-transparent rounded-full animate-spin"/>
            )}
            {query && !loading && (
              <button onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cream-muted hover:text-navy transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {open && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-navy/15 rounded-lg shadow-lg overflow-hidden">
              {results.slice(0, 5).map(r => (
                <button key={r.place_id} onClick={() => handleSelect(r)}
                  className="w-full text-left px-3 py-2.5 hover:bg-cream transition-colors border-b border-navy/5 last:border-0">
                  <p className="text-[12px] font-medium text-navy leading-snug line-clamp-1">
                    {r.display_name.split(",")[0]}
                  </p>
                  <p className="text-[10px] text-cream-muted mt-0.5 line-clamp-1">
                    {r.display_name.split(",").slice(1, 3).join(",")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transport mode */}
        <div className="grid grid-cols-4 gap-1">
          {MODES.map(m => {
            const cfg = MODE_LABELS[m];
            return (
              <button key={m} onClick={() => handleModeChange(m)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-semibold transition-all ${
                  mode === m ? "bg-navy text-gold border-navy" : "bg-white text-cream-muted border-navy/15 hover:border-navy/30"
                }`}>
                <span className="text-base leading-none">{cfg.icon}</span>
                <span>{cfg.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Max time */}
        <div>
          <p className="text-[10px] text-cream-muted mb-2">Temps max de trajet</p>
          <div className="flex gap-1 flex-wrap">
            {TIME_OPTIONS.map(t => (
              <button key={t} onClick={() => handleMinutesChange(t)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  minutes === t ? "bg-navy text-gold border-navy" : "bg-white text-cream-muted border-navy/15 hover:border-navy/30"
                }`}>
                {t} min
              </button>
            ))}
          </div>
        </div>

        {/* Active state info */}
        {active && value && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-navy/5 border border-navy/10">
            <svg className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" viewBox="0 0 14 14" fill="currentColor">
              <path d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 115.5 5 1.5 1.5 0 017 6.5z"/>
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-navy truncate">{value.address}</p>
              <p className="text-[10px] text-cream-muted mt-0.5">
                {MODE_LABELS[value.mode].icon} {value.maxMinutes} min · rayon ~{radiusKm.toFixed(1)} km
              </p>
            </div>
            <button onClick={handleClear} className="text-cream-muted hover:text-rose-500 transition-colors shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Map overlay version (floating panel) ────────────────────────────────────
  return (
    <div className="bg-[#FDFAF6] rounded-2xl border border-navy/15 shadow-xl p-4 w-80">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-gold" viewBox="0 0 16 16" fill="none">
            <path d="M8 1C5.24 1 3 3.24 3 6c0 4.5 5 9 5 9s5-4.5 5-9c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 116.5 6 1.5 1.5 0 018 7.5z" fill="#D4AF64"/>
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-bold text-navy">Temps de trajet</p>
          <p className="text-[10px] text-cream-muted">Rechercher autour d'une adresse</p>
        </div>
      </div>

      {/* Address */}
      <div className="relative mb-3" ref={dropdownRef}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cream-muted pointer-events-none" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 115.5 5 1.5 1.5 0 017 6.5z"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Mon lieu de travail…"
            className="w-full pl-8 pr-8 py-2.5 rounded-xl border border-navy/15 bg-white text-[13px] text-navy placeholder:text-cream-muted/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
          )}
          {query && !loading && (
            <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted hover:text-navy">
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-navy/15 rounded-xl shadow-lg overflow-hidden">
            {results.slice(0, 5).map(r => (
              <button key={r.place_id} onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-2.5 hover:bg-cream transition-colors border-b border-navy/5 last:border-0 flex items-start gap-2">
                <svg className="w-3 h-3 text-gold shrink-0 mt-1" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0C3.79 0 2 1.79 2 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z"/>
                </svg>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-navy truncate">{r.display_name.split(",")[0]}</p>
                  <p className="text-[11px] text-cream-muted truncate">{r.display_name.split(",").slice(1, 3).join(",")}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode buttons */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {MODES.map(m => {
          const cfg = MODE_LABELS[m];
          return (
            <button key={m} onClick={() => handleModeChange(m)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-semibold transition-all ${
                mode === m ? "bg-navy text-gold border-navy shadow-sm" : "bg-white text-cream-muted border-navy/15 hover:border-navy/30"
              }`}>
              <span className="text-lg leading-none">{cfg.icon}</span>
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Time slider */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-navy">Trajet maximum</span>
          <span className="text-[13px] font-bold text-gold">{minutes} min</span>
        </div>
        <input type="range" min={10} max={60} step={5} value={minutes}
          onChange={e => handleMinutesChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #D4AF64 0%, #D4AF64 ${((minutes - 10) / 50) * 100}%, #1B2B3A20 ${((minutes - 10) / 50) * 100}%, #1B2B3A20 100%)`
          }}
        />
        <div className="flex justify-between mt-1 text-[9px] text-cream-muted">
          <span>10 min</span><span>30 min</span><span>60 min</span>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between text-[11px] text-cream-muted bg-cream rounded-lg px-3 py-2">
        <span className="flex items-center gap-1">
          <span>{MODE_LABELS[mode].icon}</span>
          <span>{SPEED_KMH[mode]} km/h moy.</span>
        </span>
        <span>≈ rayon {radiusKm.toFixed(1)} km</span>
      </div>
    </div>
  );
}
