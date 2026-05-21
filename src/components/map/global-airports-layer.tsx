"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { useMap } from "./map";
import { AIRPORTS_GEOJSON, type MajorAirport } from "@/lib/major-airports";

const SOURCE_ID = "airports";
const CIRCLE_LAYER = "airports-circles";
const HUB_CIRCLE_LAYER = "airports-hub-circles";
const LABEL_LAYER = "airports-labels";
const HIT_LAYER = "airports-hit";

type GlobalAirportsLayerProps = {
  isDark: boolean;
};

let _cssInjected = false;
const LAYER_CSS = `
.airport-popup .maplibregl-popup-content{
  background:rgba(12,12,14,0.95);
  color:rgba(255,255,255,0.9);
  font:600 12px/1.5 system-ui,-apple-system,sans-serif;
  padding:8px 12px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,0.08);
  backdrop-filter:blur(16px);
  box-shadow:0 8px 32px rgba(0,0,0,0.5);
  min-width:180px;
}
.airport-popup .maplibregl-popup-tip{
  border-top-color:rgba(12,12,14,0.95);
}
.airport-popup-title{
  font-size:13px;
  font-weight:700;
  margin-bottom:4px;
  color:#fff;
}
.airport-popup-detail{
  font-size:11px;
  font-weight:500;
  color:rgba(255,255,255,0.7);
  margin-top:2px;
}
.airport-hub-badge{
  display:inline-block;
  background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color:#000;
  font-size:9px;
  font-weight:700;
  padding:2px 6px;
  border-radius:4px;
  margin-top:4px;
  text-transform:uppercase;
  letter-spacing:0.5px;
}
`;

function injectCSS() {
  if (_cssInjected) return;
  const el = document.createElement("style");
  el.textContent = LAYER_CSS;
  document.head.appendChild(el);
  _cssInjected = true;
}

export function GlobalAirportsLayer({ isDark }: GlobalAirportsLayerProps) {
  const { map, isLoaded } = useMap();
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!map || !isLoaded || dataLoaded) return;

    injectCSS();
    const m = map;

    // Colors based on theme
    const circleColor = isDark ? "#5eead4" : "#0d9488"; // teal-300 / teal-600
    const hubCircleColor = isDark ? "#fbbf24" : "#f59e0b"; // amber-400 / amber-500
    const labelColor = isDark ? "#ffffff" : "#1f2937"; // white / gray-800
    const haloColor = isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)";

    // Add source - loaded once, no repeated fetch
    if (!m.getSource(SOURCE_ID)) {
      m.addSource(SOURCE_ID, {
        type: "geojson",
        data: AIRPORTS_GEOJSON,
        buffer: 256,
        tolerance: 0.375,
      });
      setDataLoaded(true);
    }

    // Hit detection layer (invisible, larger hit area)
    if (!m.getLayer(HIT_LAYER)) {
      m.addLayer({
        id: HIT_LAYER,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": ["step", ["zoom"], 12, 6, 16, 10, 20],
          "circle-color": "rgba(255,255,255,0.01)",
          "circle-opacity": 0.01,
          "circle-pitch-alignment": "map",
        },
      });
    }

    // Regular airport circles
    if (!m.getLayer(CIRCLE_LAYER)) {
      m.addLayer({
        id: CIRCLE_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["==", ["get", "isHub"], false],
        minzoom: 3,
        paint: {
          "circle-radius": [
            "interpolate",
            ["exponential", 1.2],
            ["zoom"],
            3,
            2,
            6,
            3,
            10,
            5,
            14,
            8,
          ],
          "circle-color": circleColor,
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            0.5,
            8,
            0.7,
            14,
            0.85,
          ],
          "circle-stroke-color": isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            0.5,
            10,
            1,
            14,
            1.5,
          ],
          "circle-pitch-alignment": "map",
        },
      });
    }

    // Hub airport circles (larger, distinct color)
    if (!m.getLayer(HUB_CIRCLE_LAYER)) {
      m.addLayer({
        id: HUB_CIRCLE_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["==", ["get", "isHub"], true],
        minzoom: 2,
        paint: {
          "circle-radius": [
            "interpolate",
            ["exponential", 1.2],
            ["zoom"],
            2,
            3,
            6,
            5,
            10,
            8,
            14,
            12,
          ],
          "circle-color": hubCircleColor,
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            0.6,
            8,
            0.8,
            14,
            0.95,
          ],
          "circle-stroke-color": isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)",
          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            1,
            10,
            1.5,
            14,
            2.5,
          ],
          "circle-pitch-alignment": "map",
        },
      });
    }

    // IATA code labels (visible after certain zoom)
    if (!m.getLayer(LABEL_LAYER)) {
      m.addLayer({
        id: LABEL_LAYER,
        type: "symbol",
        source: SOURCE_ID,
        minzoom: 5,
        layout: {
          "text-field": ["get", "iata"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            9,
            10,
            11,
            14,
            14,
          ],
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-pitch-alignment": "viewport",
        },
        paint: {
          "text-color": labelColor,
          "text-halo-color": haloColor,
          "text-halo-width": 1.5,
          "text-halo-blur": 0.5,
          "text-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            0,
            6,
            0.7,
            8,
            1,
          ],
        },
      });
    }

    // Smooth zoom-based transitions
    m.on("zoom", () => {
      const currentZoom = m.getZoom();
      
      // Fade in/out effects based on zoom
      if (m.getLayer(CIRCLE_LAYER)) {
        m.setPaintProperty(
          CIRCLE_LAYER,
          "circle-opacity",
          [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            0.5,
            8,
            0.7,
            14,
            0.85,
          ]
        );
      }
      
      // Hub visibility
      if (m.getLayer(HUB_CIRCLE_LAYER)) {
        m.setPaintProperty(
          HUB_CIRCLE_LAYER,
          "circle-opacity",
          [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            0.6,
            8,
            0.8,
            14,
            0.95,
          ]
        );
      }
    });

    // Popup for airport details
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: true,
      className: "airport-popup",
      offset: 12,
      maxWidth: "250px",
    });
    popupRef.current = popup;

    function onMouseEnter(e: maplibregl.MapMouseEvent & {
      features?: maplibregl.MapGeoJSONFeature[];
    }) {
      m.getCanvas().style.cursor = "pointer";
      const f = e.features?.[0];
      if (f?.properties) {
        const props = f.properties as Record<string, unknown>;
        const iata = String(props.iata ?? "");
        const name = String(props.name ?? "");
        const city = String(props.city ?? "");
        const countryName = String(props.countryName ?? "");
        const isHub = Boolean(props.isHub);
        const type = String(props.type ?? "");

        if (!iata) return;

        // Build popup content
        let html = `<div class="airport-popup-title">${iata}</div>`;
        html += `<div style="font-weight:600;font-size:12px;margin-bottom:6px;">${name}</div>`;
        html += `<div class="airport-popup-detail">📍 ${city}, ${countryName}</div>`;
        
        if (type) {
          const typeDisplay = type.replace("_", " ");
          html += `<div class="airport-popup-detail">✈️ ${typeDisplay}</div>`;
        }
        
        if (isHub) {
          html += `<div><span class="airport-hub-badge">Major Hub</span></div>`;
        }

        popup.setLngLat(e.lngLat).setHTML(html).addTo(m);
      }
    }

    function onMouseLeave() {
      m.getCanvas().style.cursor = "";
      popup.remove();
    }

    function onClick(e: maplibregl.MapMouseEvent & {
      features?: maplibregl.MapGeoJSONFeature[];
    }) {
      const f = e.features?.[0];
      const props = f?.properties as Record<string, unknown> | undefined;
      const iata = String(props?.iata ?? "");
      const lat = Number(props?.lat ?? 0);
      const lng = Number(props?.lng ?? 0);

      if (iata) {
        // Smooth fly to airport location
        m.flyTo({
          center: [lng, lat],
          zoom: Math.max(m.getZoom(), 10),
          speed: 1.2,
          curve: 1,
          easing: (t) => t,
        });

        // Keep popup open on click
        popup.setLngLat(e.lngLat).addTo(m);
      }
    }

    // Attach event listeners
    m.on("mouseenter", HIT_LAYER, onMouseEnter);
    m.on("mouseleave", HIT_LAYER, onMouseLeave);
    m.on("click", HIT_LAYER, onClick);

    return () => {
      m.off("mouseenter", HIT_LAYER, onMouseEnter);
      m.off("mouseleave", HIT_LAYER, onMouseLeave);
      m.off("click", HIT_LAYER, onClick);
      popup.remove();
      
      // Cleanup layers and source
      try {
        if (m.getLayer(LABEL_LAYER)) m.removeLayer(LABEL_LAYER);
        if (m.getLayer(HUB_CIRCLE_LAYER)) m.removeLayer(HUB_CIRCLE_LAYER);
        if (m.getLayer(CIRCLE_LAYER)) m.removeLayer(CIRCLE_LAYER);
        if (m.getLayer(HIT_LAYER)) m.removeLayer(HIT_LAYER);
        if (m.getSource(SOURCE_ID)) m.removeSource(SOURCE_ID);
      } catch {
        /* already cleaned up */
      }
    };
  }, [map, isLoaded, isDark, dataLoaded]);

  return null;
}
