import { getListingById } from "@/lib/supabase/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import FavoriteButton from "@/components/ui/FavoriteButton";
import MortgageCalculator from "@/components/ui/MortgageCalculator";
import PriceTrendWidget from "@/components/listings/PriceTrendWidget";
import ValuationWidget from "@/components/listings/ValuationWidget";
import type { Metadata } from "next";

export const revalidate = 60;

const fmt = (p: number) => `${Math.round(p).toLocaleString("fr-TN")} TND`;
const DEED: Record<string,string> = {titre_bleu:"Titre Bleu",titre_arabe:"Titre Arabe",henchir:"Henchir",wakf:"Wakf",manucipe:"Manucipe"};
const TYPE: Record<string,string> = {appartement:"Appartement",villa:"Villa",terrain:"Terrain",bureau:"Bureau",duplex:"Duplex",studio:"Studio",ferme:"Ferme"};
const AI: Record<string,{cls:string,label:string}> = {
  underpriced:{cls:"bg-emerald-100 text-emerald-700",label:"✓ Sous-évalué — opportunité d'achat"},
  fair:{cls:"bg-amber-100 text-amber-700",label:"Prix juste selon le marché"},
  overpriced:{cls:"bg-rose-100 text-rose-700",label:"⚠ Sur-évalué par rapport au marché"},
};

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const { id } = await params;
  const l = await getListingById(id);
  if (!l) return {};
  return {
    title: l.title,
    description: `${TYPE[l.type]||l.type} ${l.action==="vente"?"à vendre":"à louer"} — ${fmt(l.price)} — ${l.wilaya}`,
    openGraph: { title: l.title, images: l.primary_image_url ? [l.primary_image_url] : [] },
  };
}

export default async function ListingDetailPage({ params }: { params: any }) {
  const { id } = await params;
  let listing: any;
  try { listing = await getListingById(id); } catch { notFound(); }
  if (!listing) notFound();

  const waMsg = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce Hestia: ${listing.title} (${fmt(listing.price)}). Merci de me contacter.`);
  const pricePerM2 = listing.area_m2>0 ? Math.round(listing.price/listing.area_m2) : null;
  const allImages = [listing.primary_image_url, ...(listing.image_urls||[])].filter(Boolean);

  const specs = [
    {label:"Surface",value:`${listing.area_m2} m²`},
    listing.rooms>0&&{label:"Pièces",value:`${listing.rooms} pièce${listing.rooms>1?"s":""}`},
    listing.bathrooms>0&&{label:"Salles de bain",value:listing.bathrooms},
    listing.floor!=null&&{label:"Étage",value:listing.floor===0?"Rez-de-chaussée":`${listing.floor}ème étage`},
    listing.deed&&{label:"Titre",value:DEED[listing.deed]||listing.deed},
    listing.wilaya&&{label:"Wilaya",value:listing.wilaya},
    listing.district&&{label:"Quartier",value:listing.district},
  ].filter(Boolean) as {label:string;value:any}[];

  const amenities = [
    listing.has_parking&&"🅿 Parking",listing.has_elevator&&"⬆ Ascenseur",
    listing.has_pool&&"🏊 Piscine",listing.has_terrace&&"☀ Terrasse",
    listing.has_garden&&"🌿 Jardin",listing.has_ac&&"❄ Climatisation",
    listing.has_security&&"🔒 Gardiennage",
  ].filter(Boolean) as string[];

  const distances = [
    listing.mosque_distance&&{icon:"🕌",label:"Mosquée",v:listing.mosque_distance},
    listing.school_distance&&{icon:"🏫",label:"École",v:listing.school_distance},
    listing.hospital_distance&&{icon:"🏥",label:"Hôpital",v:listing.hospital_distance},
    listing.metro_distance&&{icon:"🚇",label:"Métro/TGM",v:listing.metro_distance},
    listing.beach_distance&&{icon:"🏖",label:"Mer",v:listing.beach_distance},
    listing.market_distance&&{icon:"🛒",label:"Marché",v:listing.market_distance},
  ].filter(Boolean) as {icon:string;label:string;v:number}[];

  const aiCfg = listing.ai_signal ? AI[listing.ai_signal] : null;

  return (
    <>
      <Navbar/>
      <main className="bg-cream min-h-screen pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-cream-muted mb-6">
            <Link href="/" className="hover:text-gold transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/listings" className="hover:text-gold transition-colors">Annonces</Link>
            {listing.wilaya && <><span>/</span><Link href={`/listings?wilaya=${listing.wilaya}`} className="hover:text-gold transition-colors">{listing.wilaya}</Link></>}
            <span>/</span>
            <span className="text-navy/60 line-clamp-1">{listing.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
            {/* LEFT */}
            <div className="space-y-6">

              {/* Image gallery */}
              <div className="rounded-2xl overflow-hidden relative">
                {/* Action buttons: heart + share — top right of gallery (ImmoScout24 style) */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                  <FavoriteButton
                    listingId={listing.id}
                    userId={null}
                    variant="detail"
                  />
                  <button
                    className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: listing.title, url: window.location.href });
                      } else {
                        navigator.clipboard?.writeText(window.location.href);
                      }
                    }}
                    title="Partager"
                  >
                    <svg className="w-5 h-5 text-navy" viewBox="0 0 20 20" fill="none">
                      <path d="M15 7a2 2 0 100-4 2 2 0 000 4zM5 10a2 2 0 100-4 2 2 0 000 4zM15 17a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M7 9l6-3M7 12l6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {allImages.length > 0 ? (
                  <div className="grid gap-2" style={{gridTemplateColumns:allImages.length>1?"1fr 1fr":"1fr",gridTemplateRows:"auto"}}>
                    <div className="relative aspect-video" style={allImages.length>1?{gridColumn:"1",gridRow:"1/3"}:{}}>
                      <Image src={allImages[0]} alt={listing.title} fill className="object-cover rounded-xl" priority
                        placeholder="blur" blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k="/>
                    </div>
                    {allImages.slice(1,3).map((src:string,i:number) => (
                      <div key={i} className="relative aspect-[4/3]">
                        <Image src={src} alt={`${listing.title} ${i+2}`} fill className="object-cover rounded-xl"
                          placeholder="blur" blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k="/>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-navy/5 rounded-xl flex items-center justify-center">
                    <span className="text-5xl opacity-20">🏛</span>
                  </div>
                )}
              </div>

              {/* Main info card */}
              <div className="bg-[#FDFAF6] rounded-2xl p-6 sm:p-8 border border-navy/10">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="text-[11px] text-gold font-bold tracking-[0.15em] uppercase mb-2">
                      {TYPE[listing.type]||listing.type} · {listing.action==="vente"?"À vendre":"À louer"}
                    </div>
                    <h1 className="font-display text-[26px] sm:text-[32px] font-semibold text-navy leading-tight">{listing.title}</h1>
                    {(listing.city||listing.wilaya) && (
                      <p className="text-cream-muted text-[13px] mt-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 115.5 5 1.5 1.5 0 017 6.5z"/></svg>
                        {[listing.city, `Wilaya de ${listing.wilaya}`].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-display text-[36px] text-gold font-semibold leading-none">{fmt(listing.price)}</div>
                    {pricePerM2 && <div className="text-[13px] text-cream-muted mt-1">{pricePerM2.toLocaleString("fr-TN")} TND/m²</div>}
                    {listing.action==="location" && <div className="text-[11px] text-cream-muted">par mois</div>}
                  </div>
                </div>

                {/* Specs grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {specs.map(s=>(
                    <div key={s.label} className="bg-cream rounded-xl p-3 border border-navy/8">
                      <div className="font-display text-[17px] text-navy font-semibold leading-none">{s.value}</div>
                      <div className="text-[10px] text-cream-muted uppercase tracking-wider mt-1.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Amenities */}
                {amenities.length>0 && (
                  <div className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-cream-muted mb-3">Équipements</p>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map(a=><span key={a} className="text-[12px] px-3 py-1.5 rounded-full bg-cream border border-navy/10 text-navy/70">{a}</span>)}
                    </div>
                  </div>
                )}

                {/* Description */}
                {listing.description && (
                  <div className="border-t border-navy/8 pt-6">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-cream-muted mb-3">Description</p>
                    <p className="text-[14px] text-navy/70 leading-[1.8] whitespace-pre-line">{listing.description}</p>
                  </div>
                )}
              </div>

              {/* AI Valuation — live, calls Edge Function */}
              {listing.wilaya && listing.area_m2 && (
                <ValuationWidget
                  request={{
                    wilaya:        listing.wilaya,
                    type:          listing.type,
                    action:        listing.action,
                    area_m2:       listing.area_m2,
                    rooms:         listing.rooms,
                    floor:         listing.floor,
                    deed:          listing.deed,
                    has_parking:   listing.has_parking,
                    has_elevator:  listing.has_elevator,
                    has_pool:      listing.has_pool,
                    has_terrace:   listing.has_terrace,
                    metro_distance:  listing.metro_distance,
                    beach_distance:  listing.beach_distance,
                    listing_price:   listing.price,
                    listing_id:      listing.id,
                  }}
                />
              )}

              {/* Proximity */}
              {distances.length>0 && (
                <div className="bg-[#FDFAF6] rounded-2xl p-6 border border-navy/10">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-cream-muted mb-4">Proximité</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {distances.map(d=>(
                      <div key={d.label} className="flex items-center gap-3 py-2">
                        <span className="text-xl">{d.icon}</span>
                        <div>
                          <div className="text-[13px] text-navy font-semibold">{d.v<1000?`${d.v}m`:`${(d.v/1000).toFixed(1)}km`}</div>
                          <div className="text-[11px] text-cream-muted">{d.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              
              {/* Mortgage Calculator */}
              {listing.action === "vente" && <MortgageCalculator initialPrice={listing.price} className="mb-6" />}
              {/* Price trend for this wilaya */}
              {listing.wilaya && <PriceTrendWidget wilaya={listing.wilaya} action={listing.action} propertyType={listing.type}/>}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="sticky top-20 space-y-4">
              {/* Contact card */}
              <div className="bg-[#FDFAF6] rounded-2xl p-6 border border-navy/10 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center font-display text-xl text-gold">H</div>
                  <div>
                    <div className="font-display text-[15px] text-navy font-semibold">Agent Hestia</div>
                    <div className="text-[11px] text-cream-muted">Certifié · SAMSAR</div>
                    <div className="text-[11px] text-gold mt-0.5">⭐ 4.9 · Répond en 30 min</div>
                  </div>
                </div>

                {/* Listing badges */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {listing.is_verified && <span className="text-[10px] px-2.5 py-1 rounded-full bg-gold/15 text-navy font-semibold">★ Vérifié Hestia</span>}
                  {listing.is_featured && <span className="text-[10px] px-2.5 py-1 rounded-full bg-navy/8 text-navy font-semibold">Annonce vedette</span>}
                </div>

                <a href={`https://wa.me/21612345678?text=${waMsg}`} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-[#25D366] text-white font-bold text-[14px] mb-3 hover:bg-[#22c55e] transition-colors shadow-lg shadow-emerald-500/20 no-underline">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Contacter via WhatsApp
                </a>

                <button className="w-full py-3 rounded-xl border-2 border-navy/15 text-navy text-[13px] font-medium hover:bg-cream transition-colors">
                  📞 Demander un rappel
                </button>

                <div className="mt-4 pt-4 border-t border-navy/8 text-center">
                  <p className="text-[11px] text-cream-muted">👁 {listing.view_count||0} vues · Ajouté il y a quelques jours</p>
                </div>
              </div>

              {/* Save search prompt */}
              <div className="bg-navy rounded-2xl p-5 border border-gold/15">
                <div className="font-display text-[17px] text-cream font-semibold mb-2">Alerte similaire</div>
                <p className="text-[12px] text-cream/45 mb-4 leading-relaxed">Recevez les biens similaires à {listing.wilaya} sur WhatsApp dès leur publication.</p>
                <Link href={`/listings?wilaya=${listing.wilaya}&type=${listing.type}&action=${listing.action}`}
                  className="block w-full py-2.5 rounded-xl bg-gold text-navy text-[13px] font-bold text-center hover:bg-gold-light transition-colors no-underline">
                  Voir les biens similaires →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        "@context":"https://schema.org","@type":"RealEstateListing",
        name:listing.title, url:`https://hestia.tn/listings/${listing.id}`,
        description:listing.description||undefined, image:listing.primary_image_url||undefined,
        offers:{"@type":"Offer",price:listing.price,priceCurrency:"TND",
          availability:listing.action==="vente"?"https://schema.org/ForSale":"https://schema.org/ForRent"},
        address:{"@type":"PostalAddress",addressLocality:listing.city||listing.wilaya,addressRegion:listing.wilaya,addressCountry:"TN"},
        floorSize:{"@type":"QuantitativeValue",value:listing.area_m2,unitCode:"MTK"},
        numberOfRooms:listing.rooms||undefined,
      })}}/>

      <footer className="bg-navy-dark py-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[11px] text-cream/20 tracking-widest">© 2026 HESTIA · TOUS DROITS RÉSERVÉS</p>
        </div>
      </footer>
    </>
  );
}
