"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

// Install: npm i leaflet
// CSS: import once (e.g., in this file or app/layout.tsx)
import "leaflet/dist/leaflet.css";
import L, { Map as LMap } from "leaflet";
import "leaflet.heat";

/** -------------------- Types -------------------- */
export type Station = {
  id: string;
  name?: string;
  lat: number;
  lon: number;
  elev_m?: number;
  latestZwd?: number; // optional for popup
};

type ErrorStation = {
  id: string;
  lat: number;
  lon: number;
  true: number;
  pred: number;
  error: number;
};

type MapViewProps = {
  stations?: (Station & { pw?: number })[];
  timeIndex?: number;
  onMapClick?: (lat: number, lon: number) => void;
  onStationClick?: (station: Station & { pw?: number }) => void;
  useBasemap?: boolean;
  errorStations?: ErrorStation[];
  field?: 'zwd' | 'pw';
};



function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** -------------------- Component -------------------- */
const MapView: React.FC<MapViewProps> = (props) => {
  const {
    stations,
    timeIndex = 0,
    onMapClick,
    onStationClick,
    useBasemap = true,
    errorStations = [],
    field = 'zwd',
  } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LMap | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);


  const dataStations = useMemo(
    () => (stations && stations.length ? stations : []),
    [stations]
  );

  // Debug state for heatmap min/max
  const [heatmapDebug, setHeatmapDebug] = useState<{ vmin: number; vmax: number; count: number } | null>(null);

  // Initial map setup
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [28.61, 77.21],
      zoom: 10,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    });
    mapRef.current = map;

    if (useBasemap) {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
    } else {
      const pane = map.createPane("blank");
      pane.style.background = "#0b1020";
    }

    // Stations layer
    const markers = L.layerGroup();
    markersLayerRef.current = markers;
    markers.addTo(map);

    // Heat layer
    // @ts-ignore
    const heatLayer = (L as any).heatLayer([], {
      radius: 32,
      blur: 24,
      maxZoom: 17,
      minOpacity: 0.3,
      max: 1.0,
      gradient: {
        0.0: "#00f",
        0.5: "#0ff",
        0.7: "#ff0",
        1.0: "#f00"
      }
    });
    heatLayer.addTo(map);
    heatLayerRef.current = heatLayer;
    // Set zIndex for heat layer (should be above tiles, below markers)
    if (heatLayer.setZIndex) heatLayer.setZIndex(400);

    // Click handler for point probe
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onMapClick?.(lat, lng);
      const m = L.circleMarker([lat, lng], {
        radius: 6,
        color: "#fff",
        weight: 1,
        fillColor: "#00d4ff",
        fillOpacity: 0.9,
      });
      m.addTo(map);
      setTimeout(() => map.removeLayer(m), 1200);
    });

    // First draw
  drawStations();
  drawHeatLayer();

    // Cleanup
    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      heatLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useBasemap]);

  // Update stations when data changes
  useEffect(() => {
    drawStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataStations]);

  // Redraw heat when timeIndex, data, or field changes
  useEffect(() => {
    drawHeatLayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeIndex, dataStations, field]);

  /** Draw station markers with popups */
  const drawStations = () => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    // Draw main stations
    dataStations.forEach((s) => {
      const marker = L.circleMarker([s.lat, s.lon], {
        radius: 6,
        color: "#22d3ee",
        weight: 2,
        fillColor: "#0ea5e9",
        fillOpacity: 0.8,
      }).bindPopup(
        `<div style="font: 12px/1.2 Inter, system-ui, sans-serif">
           <div><b>${s.name ?? s.id}</b></div>
           <div>Lat: ${s.lat.toFixed(3)}, Lon: ${s.lon.toFixed(3)}</div>
           ${s.latestZwd !== undefined ? `<div>ZWD: ${s.latestZwd.toFixed(3)} m</div>` : ""}
         </div>`
      );
      marker.on('click', () => {
        if (onStationClick) onStationClick(s);
      });
      marker.addTo(layer);
    });
    // Draw error markers if available
    errorStations.forEach((e) => {
      const color = Math.abs(e.error) > 0.05 ? "#f87171" : "#22d3ee"; // red if error > 0.05
      const marker = L.circleMarker([e.lat, e.lon], {
        radius: 8,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.5,
        dashArray: Math.abs(e.error) > 0.05 ? "2 2" : undefined,
      }).bindPopup(
        `<div style="font: 12px/1.2 Inter, system-ui, sans-serif">
           <div><b>${e.id}</b></div>
           <div>Lat: ${e.lat.toFixed(3)}, Lon: ${e.lon.toFixed(3)}</div>
           <div>True: ${e.true.toFixed(3)} m</div>
           <div>Pred: ${e.pred.toFixed(3)} m</div>
           <div style='color:${color}'>Error: ${e.error.toFixed(3)} m</div>
         </div>`
      );
      marker.addTo(layer);
    });
  };

  /** Draw heat layer using leaflet.heat */
  const drawHeatLayer = () => {
    const map = mapRef.current;
    const heatLayer = heatLayerRef.current;
    if (!map || !heatLayer) return;

    // Use selected field for heatmap (ZWD or PW)
    const valueKey = field === 'pw' ? 'pw' : 'latestZwd';
    const values = dataStations.map((s) => s[valueKey] ?? 0);
    const vmin = Math.min(...values);
    const vmax = Math.max(...values);
    setHeatmapDebug({ vmin, vmax, count: dataStations.length });

    // Normalize to [0,1] for heatmap intensity
    const points: [number, number, number][] = dataStations.map((s) => {
      let intensity = 0.5;
      const val = s[valueKey] ?? 0;
      if (vmax > vmin) {
        intensity = (val - vmin) / (vmax - vmin);
      }
      return [s.lat, s.lon, intensity];
    });

    // @ts-ignore
    heatLayer.setLatLngs(points);
    (heatLayer as any).setOptions?.({ minOpacity: 0.3, max: 1.0 });
    (heatLayer as any).setZIndex?.(400);
  };

  return (
    <div className="relative h-[72vh] w-full rounded-2xl overflow-hidden ring-1 ring-white/10">
      <div ref={containerRef} className="h-full w-full" />
      {/* Heatmap debug overlay */}
      <div className="pointer-events-none absolute left-3 top-3 z-[5000] rounded-lg bg-black/60 px-3 py-2 text-xs text-white min-w-[180px]">
        <div className="font-semibold text-sky-200 mb-1">{field === 'pw' ? 'PW Interpolation Heatmap' : 'ZWD Interpolation Heatmap'}</div>
        <div className="mb-1 text-white/80">Shows interpolated {field === 'pw' ? 'precipitable water (PW)' : 'zenith-wet delay (ZWD)'} field based on GNSS station data.</div>
        {heatmapDebug && (
          <div className="mt-1 text-[11px]">
            <div>Stations: {heatmapDebug.count}</div>
            <div>Min: {heatmapDebug.vmin.toFixed(3)} {field === 'pw' ? 'mm' : 'm'} | Max: {heatmapDebug.vmax.toFixed(3)} {field === 'pw' ? 'mm' : 'm'}</div>
          </div>
        )}
        {/* Simple color legend */}
        <div className="mt-2 flex items-center gap-2">
          <span className="w-4 h-2 rounded-sm" style={{background: '#00f'}} />
          <span className="w-4 h-2 rounded-sm" style={{background: '#0ff'}} />
          <span className="w-4 h-2 rounded-sm" style={{background: '#ff0'}} />
          <span className="w-4 h-2 rounded-sm" style={{background: '#f00'}} />
          <span className="text-[10px] text-white/60 ml-2">Low → High {field === 'pw' ? 'PW' : 'ZWD'}</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
