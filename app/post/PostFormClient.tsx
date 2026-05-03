"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import ValuationWidget from "@/components/listings/ValuationWidget";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  // Step 1
  action: "vente" | "location";
  type: string;
  // Step 2
  price: string;
  area_m2: string;
  rooms: string;
  bathrooms: string;
  floor: string;
  total_floors: string;
  deed: string;
  orientation: string;
  // Step 3
  wilaya: string;
  delegation: string;
  district: string;
  address: string;
  // Step 4 — images handled separately
  // Step 5
  title: string;
  description: string;
  has_parking: boolean;
  has_elevator: boolean;
  has_pool: boolean;
  has_terrace: boolean;
  has_garden: boolean;
  has_ac: boolean;
  has_security: boolean;
  // Distances
  metro_distance: string;
  beach_distance: string;
  school_distance: string;
  mosque_distance: string;
}

interface UploadedPhoto {
  file: File;
  preview: string;
  url?: string;
  uploading?: boolean;
  error?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: "Type de bien"  },
  { n: 2, label: "Détails"       },
  { n: 3, label: "Localisation"  },
  { n: 4, label: "Photos"        },
  { n: 5, label: "Finalisation"  },
];

const PROPERTY_TYPES = [
  { v: "appartement", l: "Appartement", icon: "🏢", desc: "Studio, T1 → T6+" },
  { v: "villa",       l: "Villa",        icon: "🏡", desc: "Villa, maison individuelle" },
  { v: "terrain",     l: "Terrain",      icon: "🌿", desc: "Constructible, agricole" },
  { v: "bureau",      l: "Bureau",       icon: "🏛", desc: "Bureau, local commercial" },
  { v: "duplex",      l: "Duplex",       icon: "🏠", desc: "Deux niveaux" },
  { v: "studio",      l: "Studio",       icon: "🛏", desc: "Pièce unique" },
  { v: "ferme",       l: "Ferme",        icon: "🌾", desc: "Terrain agricole avec bâti" },
];

const WILAYAS = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan","Bizerte","Béja","Jendouba","Le Kef","Siliana","Kairouan","Kasserine","Sidi Bouzid","Sousse","Monastir","Mahdia","Sfax","Gafsa","Tozeur","Kébili","Gabès","Médenine","Tataouine"];

const DEEDS = [
  { v: "titre_bleu", l: "Titre Bleu",   desc: "Titre foncier enregistré" },
  { v: "titre_arabe", l: "Titre Arabe", desc: "Acte notarié traditionnel" },
  { v: "henchir",    l: "Henchir",      desc: "Propriété domaniale" },
  { v: "wakf",       l: "Wakf",         desc: "Bien religieux" },
  { v: "manucipe",   l: "Manucipe",     desc: "Droit de jouissance" },
];

const ORIENTATIONS = ["N","NE","E","SE","S","SW","W","NW"];

const AMENITIES = [
  { k: "has_parking",   l: "Parking",     icon: "🅿" },
  { k: "has_elevator",  l: "Ascenseur",   icon: "⬆" },
  { k: "has_pool",      l: "Piscine",     icon: "🏊" },
  { k: "has_terrace",   l: "Terrasse",    icon: "☀" },
  { k: "has_garden",    l: "Jardin",      icon: "🌿" },
  { k: "has_ac",        l: "Clim.",       icon: "❄" },
  { k: "has_security",  l: "Gardiennage", icon: "🔒" },
];

const INITIAL_FORM: FormData = {
  action: "vente", type: "appartement",
  price: "", area_m2: "", rooms: "", bathrooms: "", floor: "", total_floors: "", deed: "", orientation: "",
  wilaya: "", delegation: "", district: "", address: "",
  title: "", description: "",
  has_parking: false, has_elevator: false, has_pool: false, has_terrace: false,
  has_garden: false, has_ac: false, has_security: false,
  metro_distance: "", beach_distance: "", school_distance: "", mosque_distance: "",
};

const DRAFT_KEY = "hestia_post_draft";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtNum = (s: string) => s ? Number(s).toLocaleString("fr-TN") : "";

function EstimatedPrice({ form }: { form: FormData }) {
  // Build request — only show if enough data to call the API
  const canRun = !!(form.wilaya && form.type && form.action && form.area_m2 && Number(form.area_m2) > 5);
  if (!canRun) {
    // Fallback: simple heuristic while wilaya not filled yet
    const price = parseFloat(form.price);
    const area = parseFloat(form.area_m2);
    if (!price || !area || area < 10) return null;
    const ppm2 = Math.round(price / area);
    const signal = ppm2 < 2000 ? { label: "Prix attractif", color: "text-emerald-600", bg: "bg-emerald-50" }
      : ppm2 > 6000 ? { label: "Prix élevé", color: "text-rose-500", bg: "bg-rose-50" }
      : { label: "Prix dans la moyenne", color: "text-amber-600", bg: "bg-amber-50" };
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold ${signal.bg} ${signal.color} mt-2`}>
        <span>🤖</span>
        <span>{ppm2.toLocaleString("fr-TN")} TND/m² · {signal.label}</span>
      </div>
    );
  }
  return (
    <ValuationWidget
      compact
      request={{
        wilaya:       form.wilaya,
        type:         form.type,
        action:       form.action,
        area_m2:      Number(form.area_m2),
        rooms:        form.rooms ? Number(form.rooms) : null,
        floor:        form.floor ? Number(form.floor) : null,
        deed:         form.deed || null,
        has_parking:  form.has_parking,
        has_elevator: form.has_elevator,
        has_pool:     form.has_pool,
        has_terrace:  form.has_terrace,
        listing_price: form.price ? Number(form.price) : null,
      }}
      className="mt-2"
    />
  );
}

// ─── Step Components ───────────────────────────────────────────────────────────

function Step1({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  return (
    <div className="space-y-8">
      {/* Action */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-3">Type de transaction *</label>
        <div className="grid grid-cols-2 gap-4">
          {[{v:"vente",l:"Vente",icon:"🏷",desc:"Cession définitive du bien"},{v:"location",l:"Location",icon:"🔑",desc:"Mise en location mensuelle"}].map(a => (
            <button key={a.v} type="button" onClick={() => setForm({...form, action: a.v as "vente"|"location"})}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${form.action===a.v?"border-navy bg-navy/5":"border-navy/15 bg-white hover:border-navy/30"}`}>
              <div className="text-3xl mb-2">{a.icon}</div>
              <p className={`font-display text-[18px] font-semibold ${form.action===a.v?"text-navy":"text-navy/70"}`}>{a.l}</p>
              <p className="text-[12px] text-cream-muted mt-0.5">{a.desc}</p>
              {form.action===a.v && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-navy font-semibold">
                  <div className="w-4 h-4 rounded-full bg-navy flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-gold" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l3 3 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                  Sélectionné
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-3">Type de bien *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {PROPERTY_TYPES.map(t => (
            <button key={t.v} type="button" onClick={() => setForm({...form, type: t.v})}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${form.type===t.v?"border-navy bg-navy text-cream":"border-navy/15 bg-white hover:border-navy/30"}`}>
              <div className="text-2xl mb-2">{t.icon}</div>
              <p className={`font-semibold text-[13px] ${form.type===t.v?"text-cream":"text-navy"}`}>{t.l}</p>
              <p className={`text-[11px] mt-0.5 ${form.type===t.v?"text-cream/50":"text-cream-muted"}`}>{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  const INPUT = "w-full px-4 py-3.5 rounded-xl border-2 border-navy/15 bg-white text-[14px] text-navy focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all placeholder:text-cream-muted/40";
  const SEL_STYLE = {backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",backgroundSize:"16px"};
  const isLand = form.type === "terrain";

  return (
    <div className="space-y-6">
      {/* Price + Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">
            Prix {form.action === "location" ? "(TND/mois)" : "(TND)"} *
          </label>
          <div className="relative">
            <input type="number" value={form.price} onChange={e => setForm({...form,price:e.target.value})}
              placeholder={form.action === "location" ? "1500" : "350000"} className={INPUT}/>
            {form.price && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-cream-muted">{fmtNum(form.price)} TND</span>}
          </div>
          <EstimatedPrice form={form}/>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Surface (m²) *</label>
          <input type="number" value={form.area_m2} onChange={e => setForm({...form,area_m2:e.target.value})}
            placeholder="120" className={INPUT}/>
        </div>
      </div>

      {!isLand && (
        <>
          {/* Rooms + Bathrooms */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Pièces</label>
              <div className="flex gap-1">
                {["",1,2,3,4,5,6].map(n => (
                  <button key={n} type="button" onClick={() => setForm({...form, rooms: n.toString()})}
                    className={`flex-1 py-2.5 rounded-xl border text-[12px] font-semibold transition-all ${form.rooms===n.toString()?"bg-navy text-gold border-navy":"bg-white text-cream-muted border-navy/15 hover:border-navy/30"}`}>
                    {n === "" ? "—" : n === 6 ? "6+" : n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">SDB</label>
              <div className="flex gap-1">
                {["",1,2,3,4].map(n => (
                  <button key={n} type="button" onClick={() => setForm({...form, bathrooms: n.toString()})}
                    className={`flex-1 py-2.5 rounded-xl border text-[12px] font-semibold transition-all ${form.bathrooms===n.toString()?"bg-navy text-gold border-navy":"bg-white text-cream-muted border-navy/15 hover:border-navy/30"}`}>
                    {n === "" ? "—" : n === 4 ? "4+" : n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Étage / Total</label>
              <div className="flex gap-2">
                <input type="number" value={form.floor} onChange={e => setForm({...form,floor:e.target.value})} placeholder="3" className={`${INPUT} w-1/2`}/>
                <input type="number" value={form.total_floors} onChange={e => setForm({...form,total_floors:e.target.value})} placeholder="7" className={`${INPUT} w-1/2`}/>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Deed */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-2">Titre de propriété</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {DEEDS.map(d => (
            <button key={d.v} type="button" onClick={() => setForm({...form, deed: form.deed===d.v ? "" : d.v})}
              className={`p-3 rounded-xl border-2 text-left transition-all ${form.deed===d.v?"border-navy bg-navy/5":"border-navy/12 hover:border-navy/25"}`}>
              <p className={`text-[12px] font-semibold ${form.deed===d.v?"text-navy":"text-navy/70"}`}>{d.l}</p>
              <p className="text-[10px] text-cream-muted mt-0.5 leading-snug">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Orientation */}
      {!isLand && (
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-2">Orientation principale</label>
          <div className="flex flex-wrap gap-2">
            {ORIENTATIONS.map(o => (
              <button key={o} type="button" onClick={() => setForm({...form, orientation: form.orientation===o ? "" : o})}
                className={`w-12 h-10 rounded-xl border-2 text-[13px] font-bold transition-all ${form.orientation===o?"border-navy bg-navy text-gold":"border-navy/15 text-navy/60 hover:border-navy/30"}`}>
                {o}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-cream-muted mt-2">Indiquez l'exposition principale du logement (favorise l'ensoleillement)</p>
        </div>
      )}
    </div>
  );
}

function Step3({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  const INPUT = "w-full px-4 py-3.5 rounded-xl border-2 border-navy/15 bg-white text-[14px] text-navy focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all placeholder:text-cream-muted/40";
  const SEL_STYLE = {backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%239A8878' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",backgroundSize:"16px"};

  return (
    <div className="space-y-6">
      {/* Wilaya */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Wilaya *</label>
        <select value={form.wilaya} onChange={e => setForm({...form, wilaya: e.target.value})}
          className={`${INPUT} appearance-none`} style={SEL_STYLE}>
          <option value="">Sélectionner une wilaya</option>
          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {/* Delegation + District */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Délégation</label>
          <input type="text" value={form.delegation} onChange={e => setForm({...form, delegation: e.target.value})}
            placeholder="Ex: La Marsa, Ariana Ville…" className={INPUT}/>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Quartier</label>
          <input type="text" value={form.district} onChange={e => setForm({...form, district: e.target.value})}
            placeholder="Ex: Lac 2, Les Jasmins…" className={INPUT}/>
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Adresse (optionnel)</label>
        <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
          placeholder="Ex: Rue des Roses, immeuble El Andalous, appt. 3B" className={INPUT}/>
        <p className="text-[11px] text-cream-muted mt-1.5">L'adresse exacte ne sera visible que par les acheteurs contactant l'agent.</p>
      </div>

      {/* Distances */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-3">Proximité (distances en mètres)</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {k:"metro_distance",    l:"Métro / TGM", icon:"🚇"},
            {k:"beach_distance",    l:"Mer / Plage",  icon:"🏖"},
            {k:"school_distance",   l:"École",        icon:"🏫"},
            {k:"mosque_distance",   l:"Mosquée",      icon:"🕌"},
          ].map(d => (
            <div key={d.k}>
              <label className="block text-[12px] font-medium text-navy/60 mb-1">{d.icon} {d.l}</label>
              <input type="number" value={(form as any)[d.k]} onChange={e => setForm({...form, [d.k]: e.target.value})}
                placeholder="500"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-navy/15 bg-white text-[13px] focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all"/>
            </div>
          ))}
        </div>
      </div>

      {/* Location tip */}
      <div className="bg-navy/4 border border-navy/10 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">📍</span>
        <div>
          <p className="text-[12px] font-semibold text-navy">Position sur la carte</p>
          <p className="text-[11px] text-cream-muted mt-0.5 leading-relaxed">
            Votre annonce sera automatiquement géolocalisée par wilaya. Vous pourrez affiner la position exacte depuis votre tableau de bord.
          </p>
        </div>
      </div>
    </div>
  );
}

function Step4({ photos, setPhotos, userId }: {
  photos: UploadedPhoto[];
  setPhotos: (p: UploadedPhoto[]) => void;
  userId: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(async (file: File, index: number) => {
    if (!userId) return null;
    const sb = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}_${index}.${ext}`;
    const { data, error } = await sb.storage.from("immo-media").upload(path, file, {
      contentType: file.type, upsert: false,
    });
    if (error || !data) return null;
    const { data: { publicUrl } } = sb.storage.from("immo-media").getPublicUrl(path);
    return publicUrl;
  }, [userId]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 10 - photos.length);
    if (!newFiles.length) return;

    const newPhotos: UploadedPhoto[] = newFiles.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      uploading: true,
    }));

    setPhotos([...photos, ...newPhotos]);

    // Upload each
    const updatedAll = [...photos, ...newPhotos];
    for (let i = 0; i < newPhotos.length; i++) {
      const globalIdx = photos.length + i;
      const url = await uploadFile(newFiles[i], globalIdx);
      updatedAll[globalIdx] = {
        ...updatedAll[globalIdx],
        url: url || undefined,
        uploading: false,
        error: !url,
      };
      setPhotos([...updatedAll]);
    }
  }, [photos, uploadFile, setPhotos]);

  const removePhoto = useCallback((i: number) => {
    const next = [...photos];
    URL.revokeObjectURL(next[i].preview);
    next.splice(i, 1);
    setPhotos(next);
  }, [photos, setPhotos]);

  const movePhoto = useCallback((from: number, to: number) => {
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setPhotos(next);
  }, [photos, setPhotos]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-navy">{photos.length}/10 photos</p>
          <p className="text-[11px] text-cream-muted mt-0.5">Les annonces avec 5+ photos reçoivent 3× plus de leads</p>
        </div>
        {photos.length > 0 && (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-navy/20 text-[12px] font-semibold text-navy hover:bg-cream transition">
            ➕ Ajouter des photos
          </button>
        )}
      </div>

      {/* Drop zone */}
      {photos.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragOver ? "border-navy bg-navy/5 scale-[1.01]" : "border-navy/20 hover:border-navy/40 hover:bg-cream/50"
          }`}
        >
          <div className="text-5xl mb-4">📸</div>
          <p className="text-[16px] font-semibold text-navy mb-1">Glissez vos photos ici</p>
          <p className="text-[13px] text-cream-muted mb-4">ou cliquez pour sélectionner depuis votre appareil</p>
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-gold text-[13px] font-bold">
            📁 Parcourir les fichiers
          </span>
          <p className="text-[11px] text-cream-muted mt-4">JPEG, PNG, WebP · Max 10 Mo par photo · Jusqu'à 10 photos</p>
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((p, i) => (
            <div key={i}
              className={`relative group rounded-2xl overflow-hidden aspect-[4/3] ${i===0?"ring-2 ring-gold ring-offset-2":""}`}
              draggable
              onDragStart={e => e.dataTransfer.setData("idx", i.toString())}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData("idx")); movePhoto(from, i); }}
            >
              <img src={p.preview} alt="" className="w-full h-full object-cover"/>

              {/* Uploading overlay */}
              {p.uploading && (
                <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
                </div>
              )}

              {/* Error overlay */}
              {p.error && (
                <div className="absolute inset-0 bg-rose-900/70 flex items-center justify-center">
                  <div className="text-center text-white">
                    <p className="text-2xl mb-1">⚠️</p>
                    <p className="text-[11px] font-semibold">Échec upload</p>
                  </div>
                </div>
              )}

              {/* Success indicator */}
              {!p.uploading && !p.error && p.url && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M1.5 6l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              )}

              {/* Cover badge */}
              {i === 0 && (
                <div className="absolute bottom-2 left-2 bg-gold text-navy text-[10px] font-bold px-2 py-0.5 rounded">
                  ★ Photo principale
                </div>
              )}

              {/* Remove button */}
              <button type="button" onClick={() => removePhoto(i)}
                className="absolute top-2 left-2 w-7 h-7 rounded-full bg-navy/80 text-cream text-[12px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600">
                ✕
              </button>
            </div>
          ))}

          {/* Add more */}
          {photos.length < 10 && (
            <button type="button" onClick={() => inputRef.current?.click()}
              className="aspect-[4/3] rounded-2xl border-2 border-dashed border-navy/20 flex flex-col items-center justify-center gap-2 hover:border-navy/40 hover:bg-cream/50 transition-all">
              <span className="text-2xl">➕</span>
              <span className="text-[11px] font-semibold text-cream-muted">Ajouter</span>
            </button>
          )}
        </div>
      )}

      {/* Tips */}
      {photos.length > 0 && (
        <div className="bg-cream border border-navy/8 rounded-2xl p-4 space-y-1.5">
          <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wider mb-2">Conseils photos</p>
          {[
            "Faites glisser pour réorganiser — la 1ère photo est la photo principale",
            "Photographiez chaque pièce avec lumière naturelle",
            "Incluez salon, cuisine, chambres, SDB et vue extérieure",
            "Résolution recommandée : 1920×1280px minimum",
          ].map((tip, i) => (
            <p key={i} className="text-[11px] text-cream-muted flex items-start gap-2">
              <span className="text-navy/30 shrink-0 mt-0.5">•</span>{tip}
            </p>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => e.target.files && addFiles(e.target.files)}/>
    </div>
  );
}

function Step5({ form, setForm, photos }: { form: FormData; setForm: (f: FormData) => void; photos: UploadedPhoto[] }) {
  const INPUT = "w-full px-4 py-3.5 rounded-xl border-2 border-navy/15 bg-white text-[14px] text-navy focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all placeholder:text-cream-muted/40";

  // Auto-generate title suggestion
  const suggestTitle = () => {
    const type = { appartement:"Appartement", villa:"Villa", terrain:"Terrain", bureau:"Bureau", duplex:"Duplex", studio:"Studio", ferme:"Ferme" }[form.type] || form.type;
    const action = form.action === "vente" ? "à vendre" : "à louer";
    const loc = form.district || form.delegation || form.wilaya;
    const area = form.area_m2 ? ` ${form.area_m2}m²` : "";
    const suggested = `${type}${area} ${action}${loc ? ` — ${loc}` : ""}`;
    setForm({...form, title: suggested});
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50">Titre de l'annonce *</label>
          <button type="button" onClick={suggestTitle}
            className="text-[11px] text-gold hover:underline font-medium flex items-center gap-1">
            ✨ Suggérer automatiquement
          </button>
        </div>
        <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
          placeholder="Ex: Appartement de luxe 3 pièces — Lac 2, Tunis"
          maxLength={120}
          className={INPUT}/>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[11px] text-cream-muted">Un bon titre améliore le référencement sur Google.tn</p>
          <span className="text-[11px] text-cream-muted">{form.title.length}/120</span>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Description</label>
        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
          rows={6} maxLength={3000}
          placeholder="Décrivez le bien en détail : luminosité, qualité des finitions, environnement du quartier, accès, points forts…"
          className={`${INPUT} resize-none`}/>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[11px] text-cream-muted">Les annonces avec description ont 2× plus de leads</p>
          <span className="text-[11px] text-cream-muted">{form.description.length}/3000</span>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/50 mb-3">Équipements</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {AMENITIES.map(a => (
            <label key={a.k} className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none"
              style={{ borderColor: (form as any)[a.k] ? "#1B2B3A" : "rgba(27,43,58,0.12)", background: (form as any)[a.k] ? "rgba(27,43,58,0.04)" : "white" }}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${(form as any)[a.k] ? "bg-navy border-navy" : "border-navy/20"}`}
                onClick={() => setForm({...form, [a.k]: !(form as any)[a.k]})}>
                {(form as any)[a.k] && <svg className="w-3 h-3 text-gold" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </div>
              <span className="text-[13px] text-navy font-medium">{a.icon} {a.l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Preview summary */}
      <div className="bg-navy rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"repeating-linear-gradient(45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 20px)",backgroundSize:"20px 20px"}}/>
        <div className="relative z-10">
          <p className="text-[11px] text-gold font-bold tracking-widest uppercase mb-3">Récapitulatif</p>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {[
              ["Type", `${({appartement:"Appartement",villa:"Villa",terrain:"Terrain",bureau:"Bureau",duplex:"Duplex",studio:"Studio",ferme:"Ferme"}[form.type]||form.type)} — ${form.action==="vente"?"Vente":"Location"}`],
              ["Prix", form.price ? `${Number(form.price).toLocaleString("fr-TN")} TND` : "—"],
              ["Surface", form.area_m2 ? `${form.area_m2} m²` : "—"],
              ["Localisation", [form.district, form.wilaya].filter(Boolean).join(", ") || "—"],
              ["Photos", `${photos.filter(p=>p.url).length} uploadée(s)`],
              ["Titre", form.title ? "✓" : "⚠ Manquant"],
            ].map(([k,v]) => (
              <div key={k}>
                <span className="text-[10px] text-cream/40">{k}</span>
                <p className="text-[12px] text-cream font-medium">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PostFormClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setFormState] = useState<FormData>(() => {
    if (typeof window !== "undefined") {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) try { return { ...INITIAL_FORM, ...JSON.parse(draft) }; } catch {}
    }
    return INITIAL_FORM;
  });
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [newListingId, setNewListingId] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    getUser().then(u => {
      setUserId(u?.id ?? null);
      setAuthLoading(false);
    });
  }, []);

  // Auto-save draft
  const setForm = useCallback((f: FormData) => {
    setFormState(f);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
  }, []);

  // Validation per step
  const canProceed = (s: Step): boolean => {
    if (s === 1) return !!(form.action && form.type);
    if (s === 2) return !!(form.price && form.area_m2);
    if (s === 3) return !!form.wilaya;
    if (s === 4) return true; // photos optional
    if (s === 5) return !!form.title.trim();
    return true;
  };

  const handleNext = () => {
    if (step < 5) setStep((step + 1) as Step);
  };
  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setSubmitError("Le titre est obligatoire."); return; }
    setSubmitting(true); setSubmitError("");

    const sb = createClient();
    const uploadedUrls = photos.filter(p => p.url).map(p => p.url!);
    const primaryUrl = uploadedUrls[0] || null;
    const restUrls = uploadedUrls.slice(1);

    const payload: any = {
      title: form.title.trim(),
      action: form.action,
      type: form.type,
      price: Number(form.price),
      area_m2: Number(form.area_m2),
      rooms:       form.rooms       ? Number(form.rooms)       : null,
      bathrooms:   form.bathrooms   ? Number(form.bathrooms)   : null,
      floor:       form.floor       ? Number(form.floor)       : null,
      total_floors:form.total_floors? Number(form.total_floors): null,
      deed:        form.deed        || null,
      orientation: form.orientation || null,
      wilaya:      form.wilaya      || null,
      delegation:  form.delegation  || null,
      district:    form.district    || null,
      address:     form.address     || null,
      description: form.description || null,
      has_parking:  form.has_parking,
      has_elevator: form.has_elevator,
      has_pool:     form.has_pool,
      has_terrace:  form.has_terrace,
      has_garden:   form.has_garden,
      has_ac:       form.has_ac,
      has_security: form.has_security,
      primary_image_url: primaryUrl,
      image_urls: restUrls.length > 0 ? restUrls : null,
      metro_distance:   form.metro_distance   ? Number(form.metro_distance)   : null,
      beach_distance:   form.beach_distance   ? Number(form.beach_distance)   : null,
      school_distance:  form.school_distance  ? Number(form.school_distance)  : null,
      mosque_distance:  form.mosque_distance  ? Number(form.mosque_distance)  : null,
      status: "active",
      agent_id: userId || null,
    };

    const { data, error } = await sb.from("listings").insert(payload).select("id").single();
    setSubmitting(false);

    if (error || !data) {
      setSubmitError("Une erreur s'est produite. Vérifiez votre connexion.");
      return;
    }

    localStorage.removeItem(DRAFT_KEY);
    setNewListingId(data.id);
    setSubmitted(true);
  };

  // Success screen
  if (submitted && newListingId) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
          <h1 className="font-display text-[32px] text-navy font-semibold mb-2">Annonce publiée !</h1>
          <p className="text-cream-muted text-[14px] mb-8 leading-relaxed">
            Votre bien est maintenant en ligne sur Hestia et visible par tous les acheteurs potentiels.
          </p>
          <div className="flex flex-col gap-3">
            <Link href={`/listings/${newListingId}`}
              className="block w-full py-3.5 rounded-xl bg-navy text-gold font-bold text-[14px] hover:bg-navy/90 transition no-underline">
              Voir mon annonce →
            </Link>
            <Link href="/dashboard"
              className="block w-full py-3 rounded-xl border-2 border-navy/15 text-navy font-semibold text-[13px] hover:bg-cream transition no-underline">
              Tableau de bord
            </Link>
            <button onClick={() => { setSubmitted(false); setFormState(INITIAL_FORM); setPhotos([]); setStep(1); setNewListingId(null); }}
              className="text-[12px] text-cream-muted hover:text-navy transition">
              Publier une autre annonce
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[#FDFAF6] border-b border-navy/10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="#1B2B3A"/>
              <path d="M10 24 L10 17 L18 11 L26 17 L26 24" fill="none" stroke="#D4AF64" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="15" y="19" width="6" height="5" rx="1" fill="#D4AF64" opacity="0.85"/>
            </svg>
            <span className="font-display text-[17px] text-navy tracking-widest hidden sm:block">HESTIA</span>
          </Link>

          <div className="flex-1 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center gap-1.5 flex-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    s.n < step ? "bg-emerald-500 text-white"
                    : s.n === step ? "bg-navy text-gold ring-4 ring-navy/10"
                    : "bg-navy/10 text-navy/30"
                  }`}>
                    {s.n < step
                      ? <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      : s.n}
                  </div>
                  <span className={`text-[9px] font-medium hidden sm:block text-center leading-none ${s.n === step ? "text-navy" : "text-navy/30"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full mb-3 transition-all ${s.n < step ? "bg-emerald-400" : "bg-navy/10"}`}/>
                )}
              </div>
            ))}
          </div>

          {/* Draft badge */}
          <span className="text-[10px] text-cream-muted hidden sm:block">Brouillon sauvegardé</span>
        </div>
      </div>

      {/* Auth gate */}
      {!authLoading && !userId && (
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="font-display text-[26px] text-navy font-semibold mb-2">Connexion requise</h2>
          <p className="text-cream-muted text-[13px] mb-6">Connectez-vous pour publier une annonce sur Hestia.</p>
          <Link href="/auth/login?returnTo=/post"
            className="block w-full py-3.5 rounded-xl bg-navy text-gold font-bold text-[14px] hover:bg-navy/90 transition no-underline">
            Se connecter
          </Link>
        </div>
      )}

      {(authLoading || userId) && (
        <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
          {/* Step header */}
          <div className="mb-8">
            <div className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-1">
              Étape {step} sur {STEPS.length}
            </div>
            <h1 className="font-display text-[28px] text-navy font-semibold leading-tight">
              {step === 1 && "Quel type de bien souhaitez-vous publier ?"}
              {step === 2 && "Les détails du bien"}
              {step === 3 && "Où se trouve votre bien ?"}
              {step === 4 && "Ajoutez des photos"}
              {step === 5 && "Finalisez votre annonce"}
            </h1>
            <p className="text-cream-muted text-[13px] mt-1">
              {step === 1 && "Commençons par identifier votre bien"}
              {step === 2 && "Plus vous êtes précis, plus vous recevrez de leads qualifiés"}
              {step === 3 && "La wilaya est obligatoire · Le reste est optionnel mais recommandé"}
              {step === 4 && "Des photos de qualité multiplient par 3 les contacts reçus"}
              {step === 5 && "Vérifiez et complétez avant de publier"}
            </p>
          </div>

          {/* Step content */}
          <div className="animate-fade-up">
            {step === 1 && <Step1 form={form} setForm={setForm}/>}
            {step === 2 && <Step2 form={form} setForm={setForm}/>}
            {step === 3 && <Step3 form={form} setForm={setForm}/>}
            {step === 4 && <Step4 photos={photos} setPhotos={setPhotos} userId={userId}/>}
            {step === 5 && <Step5 form={form} setForm={setForm} photos={photos}/>}
          </div>

          {submitError && (
            <p className="mt-4 text-[12px] text-rose-500 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{submitError}</p>
          )}
        </div>
      )}

      {/* Fixed bottom navigation */}
      {(authLoading || userId) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FDFAF6] border-t border-navy/10 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <button type="button" onClick={handleBack}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-navy/15 text-navy font-semibold text-[13px] hover:bg-cream transition ${step === 1 ? "invisible" : ""}`}>
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Précédent
            </button>

            <div className="flex-1 h-1.5 rounded-full bg-navy/8 overflow-hidden">
              <div className="h-full bg-navy rounded-full transition-all duration-500"
                style={{width:`${((step-1)/4)*100}%`}}/>
            </div>

            {step < 5 ? (
              <button type="button" onClick={handleNext} disabled={!canProceed(step)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-navy text-gold font-bold text-[13px] hover:bg-navy/90 transition disabled:opacity-40">
                Continuer
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            ) : (
              <button type="button" onClick={handleSubmit}
                disabled={submitting || !canProceed(5)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy font-bold text-[14px] hover:bg-gold/90 transition disabled:opacity-40 shadow-lg shadow-gold/20">
                {submitting ? (
                  <><div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"/>Publication…</>
                ) : (
                  <>✓ Publier maintenant</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
