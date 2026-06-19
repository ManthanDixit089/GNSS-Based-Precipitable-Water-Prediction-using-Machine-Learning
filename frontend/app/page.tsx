"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import TimeScrubber from "../components/TimeScrubber";
import StationPopUp from "../components/StationPopUp";
import FileUploadButton from "../components/FileUploadButton";
import { uploadStations, validate, interpolateIdw, interpolateKnn, interpolateRandom, validateIdw } from "../lib/api";

// Dynamically import MapView with SSR disabled
const MapView = dynamic(() => import("../components/MapView"), { ssr: false });

type Station = {
  id: string;
  name?: string;
  lat: number;
  lon: number;
  elev_m?: number;
  latestZwd?: number;
  pw?: number;
  time?: string;
};

export default function Home() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [interpResults, setInterpResults] = useState<{
    idw?: number;
    rf?: number;
    knn?: number;
  }>({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [timeIndex, setTimeIndex] = useState(0);
  const [csvInfo, setCsvInfo] = useState<{ name: string; rows: number } | null>(null);
  const [allStationRows, setAllStationRows] = useState<any[]>([]);
  const [timeList, setTimeList] = useState<string[]>([]);
  const [field, setField] = useState<'zwd' | 'pw'>('zwd');

  // Handle station ZWD upload
  const handleStationFile = async (_file: File, text: string) => {
    setCsvInfo({ name: _file.name, rows: text.split(/\r?\n/).filter((l) => l.trim()).length });
    try {
      await uploadStations(_file);
      // Parse CSV to update all rows and time list
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const header = lines[0].split(",");
      const idxLat = header.findIndex((h) => h.toLowerCase().includes("lat"));
      const idxLon = header.findIndex((h) => h.toLowerCase().includes("lon"));
      const idxId = header.findIndex((h) => h.toLowerCase().includes("id"));
      const idxZwd = header.findIndex((h) => h.toLowerCase().includes("zwd"));
      const idxTime = header.findIndex((h) => h.toLowerCase().includes("time"));
      const idxPw = header.findIndex((h) => h.toLowerCase().includes("pw"));
      const allRows = lines.slice(1).map((line) => {
        const vals = line.split(",");
        const latestZwd = idxZwd >= 0 ? parseFloat(vals[idxZwd]) : undefined;
        // Use PW directly from CSV if available
        const pw = idxPw >= 0 ? parseFloat(vals[idxPw]) : undefined;
        return {
          id: idxId >= 0 ? vals[idxId] : String(Math.random()),
          lat: idxLat >= 0 ? parseFloat(vals[idxLat]) : 0,
          lon: idxLon >= 0 ? parseFloat(vals[idxLon]) : 0,
          latestZwd,
          pw,
          time: idxTime >= 0 ? vals[idxTime] : undefined,
        };
      });
      setAllStationRows(allRows);
      if (typeof window !== "undefined") {
        (window as any).allStationRows = allRows;
      }
      const uniqueTimes = Array.from(new Set(allRows.map(r => r.time).filter(Boolean) as string[])).sort();
      setTimeList(uniqueTimes);
      setTimeIndex(0);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    }
  };



  // Handle map click: fetch IDW, Random Forest, and KNN interpolation
  const handleMapClick = async (lat: number, lon: number) => {
    try {
      const [idwRes, rfRes, knnRes] = await Promise.all([
        interpolateIdw(lat, lon),
        interpolateRandom(lat, lon),
        interpolateKnn(lat, lon)
      ]);
      const currentTime = timeList[timeIndex];
      setInterpResults({
        idw: idwRes.pw_pred,
        rf: rfRes.pw_pred,
        knn: knnRes.pw_pred
      });
      setSelectedStation({
        id: "Interpolated",
        lat,
        lon,
        pw: idwRes.pw_pred,
        time: currentTime,
      });
    } catch (err: any) {
      alert("Interpolation failed: " + err.message);
    }
  };

  // Filter stations for current time
  const stations = React.useMemo(() => {
    if (!timeList.length) return [];
    const currentTime = timeList[timeIndex];
    return allStationRows.filter(r => r.time === currentTime);
  }, [allStationRows, timeList, timeIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1020] to-[#1e293b] text-white font-sans flex flex-col items-center p-4 gap-6">
      {/* Header */}
      <header className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-2 py-2">
        <h1 className="text-2xl font-bold tracking-tight">GNSS ZWD/PW Dashboard</h1>
        <div className="flex gap-4 mt-2 items-center">
          <span className="text-xs text-sky-200">Interpolation: <b>IDW</b></span>
          <button
            className={`px-3 py-1 rounded ${field === 'zwd' ? 'bg-sky-600 text-white' : 'bg-white/10 text-sky-200'}`}
            onClick={() => setField('zwd')}
          >ZWD</button>
          <button
            className={`px-3 py-1 rounded ${field === 'pw' ? 'bg-sky-600 text-white' : 'bg-white/10 text-sky-200'}`}
            onClick={() => setField('pw')}
          >PW</button>
          <button
            className="px-3 py-1 rounded bg-slate-700 text-white border border-slate-500 ml-2"
            onClick={() => setShowSidebar((v) => !v)}
          >{showSidebar ? "Hide" : "Show"} Sidebar</button>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full max-w-5xl flex flex-col md:flex-row gap-6">
        {/* Map and time scrubber */}
        <section className="flex-1 flex flex-col gap-4">
          <MapView
            stations={stations}
            timeIndex={timeIndex}
            onMapClick={handleMapClick}
            onStationClick={(station) => setSelectedStation(station)}
            useBasemap={true}
            field={field}
          />
          <div className="flex justify-center">
            <TimeScrubber
              steps={timeList.length || 1}
              value={timeIndex}
              onChange={setTimeIndex}
              label={timeList[timeIndex] || "Time"}
            />
          </div>
        </section>

        {/* Metrics and file upload */}
        <aside className="w-full md:w-[320px] flex flex-col gap-4">
    {/* Validation Metrics Panel removed */}
          <FileUploadButton label="Upload Station ZWD CSV" accept=".csv" onFileLoaded={handleStationFile} />

          {csvInfo && (
            <div className="text-xs text-sky-300 mt-1">
              Loaded <b>{csvInfo.name}</b> ({csvInfo.rows} rows)
            </div>
          )}

        {/* Show sidebar with station/interpolation info */}
        {selectedStation && showSidebar && (
          <div className="mt-2 p-4 bg-slate-800 rounded-xl text-white">
            <div className="font-bold mb-2">
              {selectedStation.id === "Interpolated" ? "Interpolation Prediction" : `Station: ${selectedStation.id}`}
            </div>
            <div>Lat: {selectedStation.lat.toFixed(4)}</div>
            <div>Lon: {selectedStation.lon.toFixed(4)}</div>
            {selectedStation.pw !== undefined && (
              <div>PW: {selectedStation.pw.toFixed(2)} kg/m²</div>
            )}
            {selectedStation.latestZwd !== undefined && (
              <div>ZWD: {selectedStation.latestZwd.toFixed(3)} m</div>
            )}
            {selectedStation.time && (
              <div>Time: {selectedStation.time}</div>
            )}
            {/* Interpolation comparison box */}
            {selectedStation.id === "Interpolated" && (
              <div className="mt-4">
                <div className="font-semibold mb-1">Model Comparison</div>
                <div className="grid grid-cols-1 gap-1 text-sm">
                  <div className="flex justify-between"><span>IDW:</span> <span>{interpResults.idw !== undefined ? interpResults.idw.toFixed(2) : "--"} kg/m²</span></div>
                  <div className="flex justify-between"><span>Random Forest:</span> <span>{interpResults.rf !== undefined ? interpResults.rf.toFixed(2) : "--"} kg/m²</span></div>
                  <div className="flex justify-between"><span>KNN:</span> <span>{interpResults.knn !== undefined ? interpResults.knn.toFixed(2) : "--"} kg/m²</span></div>
                </div>
              </div>
            )}
          </div>
        )}
        </aside>
      </main>
    </div>
  );
}

