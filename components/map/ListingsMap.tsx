"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Listing } from "@immo-na/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// ─── Tunisia bounding box ──────────────────────────────────────
const TUNISIA_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [7.5, 30.2],  // SW
  [11.6, 37.6], // NE
];

const TUNISIA_CENTER: [number, number] = [9.5375, 33.8869];

interface ListingsMapProps {
  listings: Listing[];
  onListingClick?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  showControls?: boolean;
  className?: string;
}

interface MapFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    id: string;
    price: number;
    type: string;
    action: string;
    isFeatured: boolean;
    pricePerM2: number;
  };
}

const PRICE_COLORS = [
  [0,      "#2D6A4F"],   // < 100k DT — sage (affordable)
  [100000, "#D4A853"],   // 100k–300k DT — gold
  [300000, "#C4611F"],   // 300k–600k DT — terra
  [600000, "#8B3A0F"],   // > 600k DT — rust (premium)
];

export function ListingsMap({
  listings,
  onListingClick,
  center = TUNISIA_CENTER,
  zoom = 6.5,
  height = 500,
  showControls = true,
  className = "",
}: ListingsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [ready, setReady] = useState(false);

  // Build GeoJSON from listings
  const buildGeoJSON = useCallback((): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: listings
      .filter((l) => l.lat && l.lng)
      .map((l) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [l.lng!, l.lat!] },
        properties: {
          id: l.id,
          price: l.price,
          action: l.listingType,
          type: l.propertyType,
          isFeatured: l.isFeatured ?? false,
          pricePerM2: l.areaM2 > 0 ? Math.round(l.price / l.areaM2) : 0,
        },
      })),
  }), [listings]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center,
      zoom,
      maxBounds: TUNISIA_BOUNDS,
      attributionControl: false,
    });

    mapRef.current = map;

    if (showControls) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }), "top-right");
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    }

    map.on("load", () => {
      // ── GeoJSON source with clustering ────────────────────
      map.addSource("listings", {
        type: "geojson",
        data: buildGeoJSON(),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 50,
        clusterProperties: {
          // Keep min/max price in cluster for color coding
          minPrice: ["min", ["get", "price"]],
          maxPrice: ["max", ["get", "price"]],
        },
      });

      // ── Cluster circle (size based on count) ──────────────
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "listings",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step", ["get", "point_count"],
            "#EDE5D4",  // 1–9
            10, "#D4A853",  // 10–49 — gold
            50, "#C4611F",  // 50+ — terra
          ],
          "circle-radius": [
            "step", ["get", "point_count"],
            20, 10, 28, 50, 36,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FDFBF7",
          "circle-opacity": 0.92,
        },
      });

      // ── Cluster count label ────────────────────────────────
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "listings",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 13,
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#1C1208",
        },
      });

      // ── Individual listing dot (price-color coded) ─────────
      map.addLayer({
        id: "unclustered",
        type: "circle",
        source: "listings",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "step", ["get", "price"],
            "#2D6A4F",
            100000, "#D4A853",
            300000, "#C4611F",
            600000, "#8B3A0F",
          ],
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            8, 5, 14, 10,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FDFBF7",
        },
      });

      // ── Featured listing star ──────────────────────────────
      map.addLayer({
        id: "featured-glow",
        type: "circle",
        source: "listings",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "isFeatured"], true]],
        paint: {
          "circle-color": "rgba(212,168,83,0.3)",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 12, 14, 22],
          "circle-blur": 0.6,
        },
      });

      setReady(true);

      // ── Click: zoom into cluster ───────────────────────────
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        (map.getSource("listings") as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;
            const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
            map.easeTo({ center: coords, zoom: zoom! });
          }
        );
      });

      // ── Click: individual listing popup ───────────────────
      map.on("click", "unclustered", (e) => {
        const feature = e.features?.[0];
        if (!feature?.properties) return;

        const { id, price, type, action } = feature.properties;
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];

        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: "220px",
          className: "immo-popup",
          offset: 12,
        })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:'Outfit',sans-serif;padding:4px">
              <div style="font-size:11px;font-weight:600;color:#9A8070;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">
                ${type} · ${action === "vente" ? "Vente" : "Location"}
              </div>
              <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:#C4611F;margin-bottom:8px">
                ${formatPrice(price)} DT
              </div>
              <button
                onclick="window.__immoOnListingClick?.('${id}')"
                style="width:100%;padding:8px;background:#C4611F;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif"
              >
                Voir l'annonce →
              </button>
            </div>
          `)
          .addTo(map);
      });

      // Expose click handler to popup HTML
      (window as any).__immoOnListingClick = (id: string) => {
        popupRef.current?.remove();
        onListingClick?.(id);
      };

      // Cursor changes
      map.on("mouseenter", "clusters", () => map.getCanvas().style.cursor = "pointer");
      map.on("mouseleave", "clusters", () => map.getCanvas().style.cursor = "");
      map.on("mouseenter", "unclustered", () => map.getCanvas().style.cursor = "pointer");
      map.on("mouseleave", "unclustered", () => map.getCanvas().style.cursor = "");
    });

    return () => {
      delete (window as any).__immoOnListingClick;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update source when listings change
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const source = mapRef.current.getSource("listings") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(buildGeoJSON());
  }, [listings, ready, buildGeoJSON]);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{ height }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Price legend */}
      <div style={{
        position: "absolute", bottom: 32, left: 12,
        background: "rgba(253,251,247,.96)", backdropFilter: "blur(8px)",
        borderRadius: 10, padding: "10px 12px",
        boxShadow: "0 4px 16px rgba(28,18,8,.12)",
        border: "1px solid #EDE5D4",
        fontFamily: "Outfit, sans-serif",
        fontSize: 11,
      }}>
        <div style={{ fontWeight: 600, color: "#1C1208", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
          Prix
        </div>
        {PRICE_COLORS.map(([threshold, color]) => (
          <div key={threshold as number} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color as string, flexShrink: 0 }} />
            <span style={{ color: "#5C3D1E" }}>
              {threshold === 0 ? "< 100k" :
               threshold === 100000 ? "100–300k" :
               threshold === 300000 ? "300–600k" : "> 600k"} DT
            </span>
          </div>
        ))}
      </div>

      {/* Custom popup styles */}
      <style>{`
        .mapboxgl-popup-content {
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(28,18,8,.15) !important;
          border: 1px solid #EDE5D4 !important;
          padding: 14px !important;
          font-family: 'Outfit', sans-serif !important;
        }
        .mapboxgl-popup-close-button {
          font-size: 18px !important;
          color: #9A8070 !important;
          right: 8px !important;
          top: 6px !important;
        }
        .mapboxgl-popup-tip { display: none !important; }
        .mapboxgl-ctrl-group { border-radius: 10px !important; overflow: hidden; }
        .mapboxgl-ctrl-group button { width: 32px !important; height: 32px !important; }
      `}</style>
    </div>
  );
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}k`;
  return price.toString();
}

// ─── Neighbourhood heatmap layer (optional) ────────────────────
export function addHeatmapLayer(map: mapboxgl.Map, sourceId: string) {
  map.addLayer({
    id: "heatmap",
    type: "heatmap",
    source: sourceId,
    maxzoom: 11,
    paint: {
      "heatmap-weight": ["interpolate", ["linear"], ["get", "price"], 0, 0, 1000000, 1],
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
      "heatmap-color": [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(45,106,79,0)",
        0.3, "rgba(212,168,83,0.6)",
        0.6, "rgba(196,97,31,0.8)",
        1, "rgba(139,58,15,1)",
      ],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
      "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0.5],
    },
  }, "clusters");
}
