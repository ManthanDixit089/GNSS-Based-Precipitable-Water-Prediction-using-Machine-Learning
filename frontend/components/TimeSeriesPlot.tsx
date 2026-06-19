
"use client";
import { useEffect, useRef } from "react";

type Point = { t: string | Date; v: number };

type TimeSeriesPlotProps = {
  title?: string;
  series: Point[];
  yLabel?: string;
  lineName?: string;
  height?: number;
};

export default function TimeSeriesPlot({
  title = "Time Series",
  series,
  yLabel = "Value",
  lineName = "Series",
  height = 260,
}: TimeSeriesPlotProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let Plotly: any;
    let mounted = true;
    let handle: (() => void) | null = null;

    import("plotly.js-dist-min").then((mod: any) => {
      if (!mounted || !ref.current) return;
      Plotly = mod;

      const x = series.map(p => (p.t instanceof Date ? p.t : new Date(p.t)));
      const y = series.map(p => p.v);

      const data = [
        {
          x,
          y,
          type: "scatter",
          mode: "lines+markers",
          name: lineName,
          hovertemplate: "%{x|%Y-%m-%d %H:%M} → %{y:.3f}<extra></extra>",
        },
      ];

      const layout = {
        title: { text: title, font: { size: 14 } },
        height,
        margin: { l: 50, r: 20, t: 40, b: 40 },
        xaxis: {
          type: "date",
          title: { text: "Time (UTC)" },
          rangeslider: { visible: true },
        },
        yaxis: { title: { text: yLabel }, fixedrange: false },
        showlegend: false,
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
      };

      const config = {
        displayModeBar: true,
        responsive: true,
      };

      // @ts-ignore
      Plotly.newPlot(ref.current!, data, layout, config);

      // Add resize handler only if plot is mounted
      handle = () => {
        if (ref.current && Plotly) {
          // @ts-ignore
          Plotly.Plots.resize(ref.current);
        }
      };
      window.addEventListener("resize", handle);
    });

    return () => {
      mounted = false;
      if (handle) window.removeEventListener("resize", handle);
      // @ts-ignore
      if (Plotly && ref.current) Plotly.purge(ref.current);
    };
  }, [title, series, yLabel, lineName, height]);

  return <div ref={ref} className="w-full" />;
}
