"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Heart,
  MapPin,
  Maximize2,
  BedDouble,
  Bath,
  Verified,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
} from "lucide-react";
import type { Listing, Currency } from "@immo-na/types";
import { cn, formatPrice, formatArea, getPropertyTypeLabel, getDeedLabel, timeAgo } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
  currency?: Currency;
  view?: "grid" | "list";
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

const PriceSignalIcon = ({ signal }: { signal: "underpriced" | "fair" | "overpriced" | undefined }) => {
  if (!signal) return null;
  const map = {
    underpriced: { Icon: TrendingDown, color: "text-green-600", label: "Sous-évalué" },
    fair: { Icon: Minus, color: "text-gold-500", label: "Juste prix" },
    overpriced: { Icon: TrendingUp, color: "text-terracotta-500", label: "Surévalué" },
  };
  const { Icon, color, label } = map[signal];
  return (
    <span className={cn("flex items-center gap-1 text-2xs font-medium", color)}>
      <Icon size={10} />
      {label}
    </span>
  );
};

export function ListingCard({
  listing,
  currency = "TND",
  view = "grid",
  onSave,
  isSaved = false,
}: ListingCardProps) {
  const [saved, setSaved] = useState(isSaved);
  const primaryImage = listing.media.find((m) => m.isPrimary) ?? listing.media[0];

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    onSave?.(listing.id);
  };

  if (view === "list") {
    return (
      <Link href={`/listings/${listing.id}`} className="group block">
        <div className="card flex gap-4 p-4 hover:-translate-y-px transition-transform duration-200">
          {/* Image */}
          <div className="relative w-52 flex-shrink-0 rounded-xl overflow-hidden aspect-listing">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={listing.titleFr}
                fill
                className="listing-img"
                sizes="208px"
              />
            ) : (
              <div className="w-full h-full bg-sand-100 flex items-center justify-center">
                <span className="text-sand-400 text-xs">Photo à venir</span>
              </div>
            )}
            {listing.isFeatured && (
              <span className="absolute top-2 left-2 badge-gold text-2xs">
                <Star size={9} /> En vedette
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <span className="badge-dark text-2xs">
                  {getPropertyTypeLabel(listing.propertyType)} · {listing.type === "sale" ? "Vente" : "Location"}
                </span>
                <button onClick={handleSave} className="p-1.5 -mt-0.5 -mr-0.5 rounded-lg hover:bg-sand-100 transition-colors">
                  <Heart
                    size={15}
                    className={cn("transition-colors", saved ? "fill-terracotta-500 text-terracotta-500" : "text-sand-400")}
                  />
                </button>
              </div>
              <h3 className="font-display text-lg font-medium text-charcoal-900 line-clamp-1 mb-1">
                {listing.titleFr}
              </h3>
              <div className="flex items-center gap-1.5 text-sand-500 text-xs font-body mb-3">
                <MapPin size={11} />
                <span>{listing.location.delegation}, {listing.location.wilaya}</span>
              </div>
              <p className="text-sm font-body text-sand-500 line-clamp-2">{listing.descriptionFr}</p>
            </div>

            <div className="flex items-end justify-between mt-3">
              <div className="flex items-center gap-4 text-sm font-body text-sand-600">
                <span className="flex items-center gap-1.5">
                  <Maximize2 size={12} className="text-gold-500" />
                  {formatArea(listing.areaM2)}
                </span>
                {listing.rooms && (
                  <span className="flex items-center gap-1.5">
                    <BedDouble size={12} className="text-gold-500" />
                    {listing.rooms} pièces
                  </span>
                )}
                {listing.bathrooms && (
                  <span className="flex items-center gap-1.5">
                    <Bath size={12} className="text-gold-500" />
                    {listing.bathrooms} sdb
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-semibold text-charcoal-900">
                  {formatPrice(listing.priceTnd, currency)}
                  {listing.type === "rent" && (
                    <span className="text-sm font-body font-normal text-sand-400">/mois</span>
                  )}
                </div>
                {listing.aiEstimateTnd && (
                  <div className="text-xs font-body text-sand-400">
                    Estim. IA: {formatPrice(listing.aiEstimateTnd, currency)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <article className="card overflow-hidden hover:-translate-y-1 transition-transform duration-300">
        {/* Image container */}
        <div className="relative overflow-hidden aspect-listing bg-sand-100">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={listing.titleFr}
              fill
              className="listing-img"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sand-400 text-sm font-body">Photo à venir</span>
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {listing.isFeatured && (
              <span className="badge badge-gold">
                <Star size={9} />
                En vedette
              </span>
            )}
            <span className="badge badge-dark">
              {listing.type === "sale" ? "Vente" : "Location"}
            </span>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border border-white/50 shadow-sm hover:bg-white transition-all"
            aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart
              size={14}
              className={cn(
                "transition-all duration-200",
                saved ? "fill-terracotta-500 text-terracotta-500 scale-110" : "text-charcoal-700"
              )}
            />
          </button>

          {/* Photo count */}
          {listing.media.length > 1 && (
            <span className="absolute bottom-3 right-3 badge badge-dark text-2xs">
              {listing.media.length} photos
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Location */}
          <div className="flex items-center gap-1 text-sand-500 text-xs font-body mb-2">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="truncate">{listing.location.delegation}, {listing.location.wilaya}</span>
          </div>

          {/* Title */}
          <h3 className="font-display text-lg font-medium text-charcoal-900 line-clamp-2 mb-3 leading-tight">
            {listing.titleFr}
          </h3>

          {/* Specs */}
          <div className="flex items-center gap-3 text-xs font-body text-sand-600 mb-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Maximize2 size={11} className="text-gold-500" />
              {formatArea(listing.areaM2)}
            </span>
            {listing.rooms && (
              <span className="flex items-center gap-1">
                <BedDouble size={11} className="text-gold-500" />
                {listing.rooms} pièces
              </span>
            )}
            {listing.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath size={11} className="text-gold-500" />
                {listing.bathrooms} sdb
              </span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <span
                className={cn(
                  "font-medium px-1.5 py-0.5 rounded-md text-2xs",
                  listing.deedType === "titre_bleu"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-sand-100 text-sand-600"
                )}
              >
                {getDeedLabel(listing.deedType)}
              </span>
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-sand-100 pt-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="font-display text-xl font-semibold text-charcoal-900">
                  {formatPrice(listing.priceTnd, currency)}
                  {listing.type === "rent" && (
                    <span className="text-sm font-body font-normal text-sand-400">/mois</span>
                  )}
                </div>
                {listing.areaM2 > 0 && (
                  <div className="text-2xs font-body text-sand-400 mt-0.5">
                    {formatPrice(Math.round(listing.priceTnd / listing.areaM2), currency)}/m²
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {listing.aiEstimateTnd && (
                  <PriceSignalIcon
                    signal={
                      listing.priceTnd > listing.aiEstimateTnd * 1.1
                        ? "overpriced"
                        : listing.priceTnd < listing.aiEstimateTnd * 0.9
                        ? "underpriced"
                        : "fair"
                    }
                  />
                )}
                <div className="text-2xs font-body text-sand-400">
                  {timeAgo(listing.publishedAt ?? listing.createdAt)}
                </div>
              </div>
            </div>

            {/* Agent row */}
            {listing.owner && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-sand-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-sand-200 flex items-center justify-center text-2xs font-medium text-sand-600">
                    {listing.owner.firstName?.[0]}
                    {listing.owner.lastName?.[0]}
                  </div>
                  <span className="text-xs font-body text-sand-500 truncate max-w-[100px]">
                    {listing.owner.firstName} {listing.owner.lastName}
                  </span>
                  {listing.owner.role !== "seeker" && (
                    <Verified size={11} className="text-gold-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-2xs font-body text-sand-400">
                  <MessageCircle size={10} />
                  {listing.leadCount} contacts
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
