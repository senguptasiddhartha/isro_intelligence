import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { XRayDataPoint } from "../types";
import { Zap, ZoomIn, Sliders, Play, Pause } from "lucide-react";

interface XRayGraphProps {
  data: XRayDataPoint[];
  liveUpdating: boolean;
  onToggleLive: () => void;
}

export default function XRayGraph({ data, liveUpdating, onToggleLive }: XRayGraphProps) {
  const [timeWindow, setTimeWindow] = useState<number>(30); // minutes (data points)
  const [selectedYScale, setSelectedYScale] = useState<"log" | "linear">("log");

  // Filter data based on time window
  const filteredData = useMemo(() => {
    if (data.length <= timeWindow) return data;
    return data.slice(data.length - timeWindow);
  }, [data, timeWindow]);

  // Format Scientific Notation for Fluxes
  const formatFlux = (val: number) => {
    return val.toExponential(2);
  };

  // Custom tooltips to look like NASA telemetry metrics
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-white/10 backdrop-blur-md p-3 rounded-lg shadow-2xl font-mono text-xs text-slate-300">
          <p className="text-white font-bold mb-1.5 border-b border-white/10 pb-0.5">TIME: {label}</p>
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                SoLEXS (Soft):
              </span>
              <span className="text-white font-bold">{formatFlux(payload[0].value)} W/m²</span>
            </p>
            <p className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-1.5 text-orange-500">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                HEL1OS (Hard):
              </span>
              <span className="text-white font-bold">{formatFlux(payload[1].value)} W/m²</span>
            </p>
            {payload[0].payload.classLevel && (
              <p className="mt-1 text-[10px] text-slate-400 border-t border-white/5 pt-1 text-right">
                CURRENT FLUX CAT: <span className="text-orange-400 font-bold">{payload[0].payload.classLevel}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="x-ray-flux-chart" className="flex flex-col rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-sans font-semibold text-sm text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Aditya-L1 Real-Time Solar X-Ray Spectrometer Feeds
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized data from Solar Low Energy (SoLEXS) & High Energy L1 Orbiting Spectrometers (HEL1OS)
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scale selection */}
          <div className="flex rounded-md bg-white/5 border border-white/10 p-0.5 text-xs font-mono">
            <button
              onClick={() => setSelectedYScale("log")}
              className={`px-2 py-1 rounded transition-colors ${
                selectedYScale === "log" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              LOG
            </button>
            <button
              onClick={() => setSelectedYScale("linear")}
              className={`px-2 py-1 rounded transition-colors ${
                selectedYScale === "linear" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              LIN
            </button>
          </div>

          {/* Timeframe Slider */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-xs font-mono text-slate-400">
            <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
            <span>Time Window:</span>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(Number(e.target.value))}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value={10}>Last 10m</option>
              <option value={20}>Last 20m</option>
              <option value={30}>Last 30m</option>
              <option value={60}>Last 1h</option>
              <option value={120}>Last 2h</option>
            </select>
          </div>

          {/* Pause/Live Toggle */}
          <button
            onClick={onToggleLive}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono border transition-all ${
              liveUpdating
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
            }`}
          >
            {liveUpdating ? (
              <>
                <Pause className="w-3 h-3 fill-emerald-400" />
                LIVE STREAMING
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-amber-400" />
                STREAM PAUSED
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Chart Rendering */}
      <div className="h-[280px] w-full font-mono text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="solexsGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hel1osGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              stroke="rgba(255,255,255,0.3)"
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <YAxis
              scale={selectedYScale}
              domain={selectedYScale === "log" ? [1e-8, 1e-3] : [0, "auto"]}
              tickFormatter={(v) => v.toExponential(0)}
              stroke="rgba(255,255,255,0.3)"
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Flare Classification thresholds as Reference Lines (Log scale references) */}
            {selectedYScale === "log" && (
              <>
                <ReferenceLine y={1e-4} stroke="rgba(239, 68, 68, 0.4)" strokeDasharray="3 3">
                  {/* Label for X-Class Flares */}
                  <div className="text-red-500 font-bold text-[9px] bg-red-950/80 px-1 py-0.5 rounded ml-2">X-Class (Extreme)</div>
                </ReferenceLine>
                <ReferenceLine y={1e-5} stroke="rgba(249, 115, 22, 0.4)" strokeDasharray="3 3">
                  {/* Label for M-Class Flares */}
                </ReferenceLine>
                <ReferenceLine y={1e-6} stroke="rgba(234, 179, 8, 0.4)" strokeDasharray="3 3">
                  {/* Label for C-Class Flares */}
                </ReferenceLine>
              </>
            )}

            <Line
              type="monotone"
              dataKey="solexs"
              stroke="#22d3ee" // Soft cyan
              strokeWidth={2}
              dot={false}
              name="SoLEXS (Soft X-ray)"
              activeDot={{ r: 5, stroke: "#22d3ee", strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="hel1os"
              stroke="#f97316" // Intense orange
              strokeWidth={2}
              dot={false}
              name="HEL1OS (Hard X-ray)"
              activeDot={{ r: 5, stroke: "#f97316", strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Flare Classification scale bar below chart */}
      <div className="flex items-center justify-between mt-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-mono text-slate-400">
        <span className="text-slate-500 font-semibold uppercase">Solar Flux Scale thresholds:</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded bg-blue-500" /> B-Class (&lt; 10⁻⁶ W/m²)</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded bg-yellow-500" /> C-Class (10⁻⁶ - 10⁻⁵)</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded bg-orange-500" /> M-Class (10⁻⁵ - 10⁻⁴)</span>
          <span className="flex items-center gap-1.5 animate-pulse"><span className="w-1.5 h-1.5 rounded bg-red-500" /> X-Class (&ge; 10⁻⁴ Extreme)</span>
        </div>
      </div>
    </div>
  );
}
