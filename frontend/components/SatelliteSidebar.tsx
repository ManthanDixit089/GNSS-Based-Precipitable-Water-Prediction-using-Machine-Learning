import React, { useEffect, useState } from "react";
import Skyplot from "./Skyplot";
import TimeSeriesPlot from "./TimeSeriesPlot";

interface SidebarProps {
  station: {
    id: string;
    name?: string;
    lat: number;
    lon: number;
    elev_m?: number;
    latestZwd?: number;
    time?: string;
  } | null;
}

const SatelliteSidebar: React.FC<SidebarProps> = ({ station }) => {
  const [satGeometry, setSatGeometry] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [play, setPlay] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [series, setSeries] = useState<{ times: string[]; zwd: number[]; pw: number[] }>({ times: [], zwd: [], pw: [] });

  // Fetch satellite geometry
  useEffect(() => {
    if (!station || !station.id || !station.time) {
      setSatGeometry([]);
      return;
    }
    setLoading(true);
    fetch(`http://localhost:8000/sat_geometry/?station_id=${encodeURIComponent(station.id)}&time=${encodeURIComponent(station.time)}`)
      .then((res) => res.json())
      .then((data) => setSatGeometry(data))
      .catch(() => setSatGeometry([]))
      .finally(() => setLoading(false));
  }, [station]);

  // Build time series for ZWD/PW for this station
  useEffect(() => {
    if (!station || !station.id) {
      setSeries({ times: [], zwd: [], pw: [] });
      return;
    }
    // Try to get all station rows from window (hack, but works for demo)
    const allRows = (window as any).allStationRows as any[] | undefined;
    if (!allRows) {
      setSeries({ times: [], zwd: [], pw: [] });
      return;
    }
    const rows = allRows.filter(r => r.id === station.id);
    setSeries({
      times: rows.map(r => r.time),
      zwd: rows.map(r => r.latestZwd),
      pw: rows.map(r => r.pw),
    });
    // Set current index to match selected time
    const idx = rows.findIndex(r => r.time === station.time);
    setCurrentIndex(idx >= 0 ? idx : 0);
  }, [station]);

  // Animation controls
  useEffect(() => {
    if (!play || !series.times.length) return;
    const interval = setInterval(() => {
      setCurrentIndex(idx => {
        if (idx < series.times.length - 1) return idx + 1;
        setPlay(false);
        return idx;
      });
    }, 900);
    return () => clearInterval(interval);
  }, [play, series.times.length]);

  if (!station) {
    return (
      <div className="p-4 text-sky-200 text-sm">No station selected.</div>
    );
  }

  return (
    <div className="p-5 bg-slate-900 rounded-2xl shadow-xl text-white min-w-[260px] max-w-xs flex flex-col gap-5 border border-slate-700">
      {/* Station Info Card */}
      <div className="bg-slate-800 rounded-xl p-4 mb-2 flex flex-col gap-1 shadow">
        <div className="font-bold text-xl text-sky-300 mb-1">{station.name ?? station.id}</div>
        <div className="flex flex-col gap-1 text-xs text-sky-100">
          <span>Lat: <span className="font-mono text-sky-200">{station.lat.toFixed(4)}</span></span>
          <span>Lon: <span className="font-mono text-sky-200">{station.lon.toFixed(4)}</span></span>
          {station.elev_m !== undefined && <span>Elev: <span className="font-mono text-sky-200">{station.elev_m} m</span></span>}
          {series.times.length > 0 && <span>Time: <span className="font-mono text-sky-200">{series.times[currentIndex]}</span></span>}
        </div>
      </div>

      {/* Animation Controls */}
      {series.times.length > 1 && (
        <div className="flex gap-2 items-center justify-center mb-1">
          <button className="px-2 py-1 bg-sky-700 hover:bg-sky-800 rounded transition" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}>&lt;</button>
          <button className="px-2 py-1 bg-sky-700 hover:bg-sky-800 rounded transition" onClick={() => setPlay(p => !p)}>{play ? 'Pause' : 'Play'}</button>
          <button className="px-2 py-1 bg-sky-700 hover:bg-sky-800 rounded transition" onClick={() => setCurrentIndex(i => Math.min(series.times.length - 1, i + 1))}>&gt;</button>
        </div>
      )}

      {/* Time Series Plots */}
      {series.times.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-800 rounded-xl p-3 shadow">
            <div className="font-semibold text-sky-200 text-sm mb-1">ZWD Time Series</div>
            <TimeSeriesPlot
              title=""
              yLabel="ZWD (m)"
              lineName="ZWD"
              series={series.times.map((t, i) => ({ t, v: series.zwd[i] }))}
              height={140}
            />
          </div>
          <div className="bg-slate-800 rounded-xl p-3 shadow">
            <div className="font-semibold text-yellow-300 text-sm mb-1">PW Time Series</div>
            <TimeSeriesPlot
              title=""
              yLabel="PW (mm)"
              lineName="PW"
              series={series.times.map((t, i) => ({ t, v: series.pw[i] }))}
              height={140}
            />
          </div>
        </div>
      )}

      {/* Satellite Geometry Card */}
      <div className="bg-slate-800 rounded-xl p-4 flex flex-col items-center min-h-[130px] shadow">
        <div className="font-semibold text-sky-200 mb-2 text-base tracking-wide">Satellite Geometry</div>
        {loading ? (
          <span className="text-xs text-sky-300">Loading skyplot...</span>
        ) : satGeometry.length > 0 ? (
          <Skyplot sats={satGeometry} size={140} />
        ) : (
          <span className="text-xs text-sky-300">No satellite geometry</span>
        )}
      </div>
    </div>
  );
};

export default SatelliteSidebar;
