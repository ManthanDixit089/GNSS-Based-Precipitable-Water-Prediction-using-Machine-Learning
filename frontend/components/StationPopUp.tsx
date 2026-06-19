"use client";

import React, { useEffect, useState } from "react";
import Skyplot from "./Skyplot";

export type Station = {
  id: string;
  name?: string;
  lat: number;
  lon: number;
  elev_m?: number;
  latestZwd?: number;
  [key: string]: any;
};

type StationPopUpProps = {
  station: Station;
  extra?: React.ReactNode; // Optional: for additional info or actions
};


const StationPopUp: React.FC<StationPopUpProps> = ({ station, extra }) => {
  return (
    <div className="min-w-[180px] text-xs font-sans text-white/90">
      <div className="font-semibold text-base text-sky-200 mb-1">
        {station.name ?? station.id}
      </div>
      <div>
        <span className="text-white/60">Lat:</span> {station.lat.toFixed(4)}
        <span className="ml-2 text-white/60">Lon:</span> {station.lon.toFixed(4)}
      </div>
      {station.elev_m !== undefined && (
        <div>
          <span className="text-white/60">Elev:</span> {station.elev_m} m
        </div>
      )}
      {station.latestZwd !== undefined && (
        <div>
          <span className="text-white/60">ZWD:</span> {station.latestZwd.toFixed(3)} m
        </div>
      )}
      {extra && <div className="mt-2">{extra}</div>}
    </div>
  );
};

export default StationPopUp;