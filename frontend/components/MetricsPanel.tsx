"use client";

import React from "react";

export type Metrics = {
  rmse: number;
  mae: number;
  bias: number;
  n: number;
  uncertainty?: number;
  [key: string]: number | undefined;
};

type MetricsPanelProps = {
  metrics?: Metrics;
  loading?: boolean;
  error?: string;
};


const format = (v?: number, digits = 3) =>
  v === undefined ? "--" : v.toFixed(digits);

const MetricsPanel: React.FC<MetricsPanelProps> = ({
  metrics,
  loading = false,
  error,
}) => {
  return (
    <div className="bg-black/30 rounded-xl p-4 w-full max-w-md shadow ring-1 ring-white/10">
      <h2 className="text-lg font-semibold text-white mb-2">Validation Metrics</h2>
      {loading ? (
        <div className="text-sky-300 py-6 text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-400 py-6 text-center">{error}</div>
      ) : metrics ? (
        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="RMSE" value={format(metrics.rmse)} unit="m" />
          <MetricCard label="MAE" value={format(metrics.mae)} unit="m" />
          <MetricCard label="Bias" value={format(metrics.bias)} unit="m" />
          <MetricCard label="N" value={metrics.n?.toString() ?? "--"} unit="" />
          {metrics.uncertainty !== undefined && (
            <MetricCard label="Uncertainty" value={format(metrics.uncertainty)} unit="m" />
          )}
        </div>
      ) : (
        <div className="text-sky-300 py-6 text-center">No metrics available.</div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; unit: string }> = ({
  label,
  value,
  unit,
}) => (
  <div className="flex flex-col items-center bg-white/5 rounded-lg p-3">
    <span className="text-xs text-white/70">{label}</span>
    <span className="text-xl font-mono text-sky-200">
      {value}
      {unit && <span className="text-xs text-white/50 ml-1">{unit}</span>}
    </span>
  </div>
);

export default MetricsPanel;