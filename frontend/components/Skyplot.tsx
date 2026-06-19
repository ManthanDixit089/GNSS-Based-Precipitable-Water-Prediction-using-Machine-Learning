import React from "react";

// Props: array of {elevation_deg, azimuth_deg, sat_id}
const Skyplot: React.FC<{ sats: { elevation_deg: number; azimuth_deg: number; sat_id?: string }[]; size?: number }> = ({ sats, size = 180 }) => {
  // Convert azimuth/elevation to x/y in polar plot
  const center = size / 2;
  const radius = size / 2 - 16;
  const points = sats.map((s) => {
    // Azimuth: 0=N, 90=E, 180=S, 270=W (clockwise from top)
    const azRad = ((s.azimuth_deg - 90) * Math.PI) / 180; // SVG: 0=right, so rotate -90
    const r = radius * (1 - s.elevation_deg / 90); // 90°=center, 0°=edge
    return {
      x: center + r * Math.cos(azRad),
      y: center + r * Math.sin(azRad),
      ...s,
    };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-slate-900 rounded-full">
      {/* Circles for elevation */}
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={radius * f}
          fill="none"
          stroke="#334155"
          strokeDasharray="2 2"
        />
      ))}
      {/* Cross lines for N/E/S/W */}
      <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="#334155" strokeWidth={1} />
      <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="#334155" strokeWidth={1} />
      {/* Satellite points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={7} fill="#0ea5e9" stroke="#fff" strokeWidth={1.5} />
          {p.sat_id && (
            <text x={p.x + 10} y={p.y} fontSize={12} fill="#fff">{p.sat_id}</text>
          )}
        </g>
      ))}
      {/* Cardinal directions */}
      <text x={center} y={center - radius - 6} textAnchor="middle" fontSize={13} fill="#fff">N</text>
      <text x={center + radius + 6} y={center} textAnchor="start" fontSize={13} fill="#fff">E</text>
      <text x={center} y={center + radius + 18} textAnchor="middle" fontSize={13} fill="#fff">S</text>
      <text x={center - radius - 6} y={center} textAnchor="end" fontSize={13} fill="#fff">W</text>
    </svg>
  );
};

export default Skyplot;
