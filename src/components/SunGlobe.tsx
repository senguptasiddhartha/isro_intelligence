import { useEffect, useRef, useState } from "react";
import { SolarActiveRegion } from "../types";
import { Zap, Radio, Maximize2 } from "lucide-react";

interface SunGlobeProps {
  activeRegions: SolarActiveRegion[];
  onSelectRegion: (region: SolarActiveRegion) => void;
  selectedRegion: SolarActiveRegion | null;
}

export default function SunGlobe({ activeRegions, onSelectRegion, selectedRegion }: SunGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [flareActive, setFlareActive] = useState<string | null>(null);
  const [flareFlash, setFlareFlash] = useState(0); // For pulsate effect

  // Trigger random flare animations on active regions for high fidelity
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeRegions.length > 0 && Math.random() > 0.4) {
        const randomRegion = activeRegions[Math.floor(Math.random() * activeRegions.length)];
        setFlareActive(randomRegion.id);
        // Flash trigger
        setFlareFlash(1.0);
        setTimeout(() => {
          setFlareActive(null);
        }, 1500);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeRegions]);

  // Handle flare flash decay
  useEffect(() => {
    if (flareFlash > 0) {
      const frame = requestAnimationFrame(() => {
        setFlareFlash((f) => Math.max(0, f - 0.04));
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [flareFlash]);

  // Canvas drawing loop for the rotating Sun globe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let localRot = 0;

    const draw = () => {
      localRot += 0.003; // speed of rotation
      setRotation(localRot);

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) / 2.6;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw outer corona glow
      const coronaGlow = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.6);
      coronaGlow.addColorStop(0, "rgba(249, 115, 22, 0.3)"); // Orange
      coronaGlow.addColorStop(0.3, "rgba(168, 85, 247, 0.15)"); // Purple
      coronaGlow.addColorStop(0.7, "rgba(59, 130, 246, 0.05)"); // Blue
      coronaGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = coronaGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // 2. Solar Prominence loops (plasma arches) outside the limb
      ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const angle = localRot * (i % 2 === 0 ? 1 : -1) * 0.5 + (i * Math.PI) / 2;
        const startX = cx + Math.cos(angle) * radius;
        const startY = cy + Math.sin(angle) * radius;
        const ctrlX = cx + Math.cos(angle) * (radius * (1.15 + Math.sin(localRot * 3 + i) * 0.05));
        const ctrlY = cy + Math.sin(angle) * (radius * (1.15 + Math.cos(localRot * 2 + i) * 0.05));
        const endX = cx + Math.cos(angle + 0.15) * radius;
        const endY = cy + Math.sin(angle + 0.15) * radius;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();
      }

      // 3. Draw solid Sun Sphere base with deep red-orange background
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#1e0b02"; // Deep space sun base
      ctx.fill();

      // 4. Draw Sun Surface textures (solar granulation and magnetic flux lines)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip(); // Clip everything to the sun sphere

      // Granulation/noise simulation
      const granCount = 20;
      for (let i = 0; i < granCount; i++) {
        const tRot = localRot + (i * Math.PI) / 10;
        const xOffset = Math.sin(tRot) * radius * 0.8;
        const yOffset = Math.cos(i * 1.5) * radius * 0.7;
        const rSize = (3 + (i % 5)) * (radius / 80);

        ctx.fillStyle = i % 3 === 0 ? "rgba(234, 179, 8, 0.15)" : "rgba(249, 115, 22, 0.12)";
        ctx.beginPath();
        ctx.arc(cx + xOffset, cy + yOffset, rSize * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D Shading/Vignette on the sphere edges (gives depth)
      const sphereShade = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, radius * 0.2, cx, cy, radius);
      sphereShade.addColorStop(0, "rgba(254, 240, 138, 0.5)"); // Sunlight spot (yellow-white)
      sphereShade.addColorStop(0.3, "rgba(249, 115, 22, 0.35)"); // Sun orange
      sphereShade.addColorStop(0.7, "rgba(220, 38, 38, 0.6)"); // Dark red edge
      sphereShade.addColorStop(0.95, "rgba(15, 10, 5, 0.95)"); // Deep limb darkening
      sphereShade.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = sphereShade;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Magnetic flux lines overlaying surface
      ctx.strokeStyle = "rgba(168, 85, 247, 0.2)";
      ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        const y = cy + i * (radius / 4);
        const w = Math.sqrt(radius * radius - (y - cy) * (y - cy));
        ctx.ellipse(cx, y, w, radius / 8, 0, 0, Math.PI, i % 2 === 0);
        ctx.stroke();
      }

      // Draw active regions onto the rotating sphere
      activeRegions.forEach((region, index) => {
        // Calculate coordinate rotation around the sphere
        // ARs rotate horizontally
        const baseAngle = (index * Math.PI) / 2.5;
        const currentAngle = baseAngle + localRot * 0.4;
        const cosAngle = Math.cos(currentAngle);
        const sinAngle = Math.sin(currentAngle);

        // Map 3D to 2D
        const rx = cx + cosAngle * radius * 0.7;
        const ry = cy + Math.sin(index * 2) * radius * 0.4; // constant latitude

        // Only draw if on the front side of the sphere (cosAngle > -0.2 for semi-occlusion)
        const isFront = cosAngle >= -0.15;
        if (isFront) {
          const isSelected = selectedRegion?.id === region.id;
          const isFlarringNow = flareActive === region.id;

          // Draw region glow
          const rGlow = isSelected ? 12 : isFlarringNow ? 18 : 6;
          ctx.shadowBlur = rGlow;
          ctx.shadowColor = region.status === "active" ? "#f97316" : region.status === "moderate" ? "#eab308" : "#3b82f6";

          // Core point
          ctx.fillStyle = region.status === "active" ? "#f97316" : region.status === "moderate" ? "#eab308" : "#3b82f6";
          ctx.beginPath();
          ctx.arc(rx, ry, isSelected ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Outer pulsing ring
          const ringPulse = 1 + Math.sin(localRot * 8 + index) * 0.4;
          ctx.strokeStyle = ctx.shadowColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(rx, ry, (isSelected ? 9 : 7) * ringPulse, 0, Math.PI * 2);
          ctx.stroke();

          // If flaring, draw dynamic energy bursts (plasma ejecta)
          if (isFlarringNow) {
            const burstRadius = radius * 0.3 * flareFlash;
            const flashGlow = ctx.createRadialGradient(rx, ry, 1, rx, ry, burstRadius);
            flashGlow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
            flashGlow.addColorStop(0.2, "rgba(253, 186, 116, 0.8)"); // Light orange
            flashGlow.addColorStop(0.6, "rgba(249, 115, 22, 0.3)");
            flashGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = flashGlow;
            ctx.beginPath();
            ctx.arc(rx, ry, burstRadius, 0, Math.PI * 2);
            ctx.fill();

            // Flare ray bursts
            ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
            ctx.lineWidth = 2;
            for (let r = 0; r < 6; r++) {
              const rayAngle = (r * Math.PI) / 3 + localRot * 5;
              const rStart = (isSelected ? 10 : 8);
              const rEnd = rStart + 15 * flareFlash;
              ctx.beginPath();
              ctx.moveTo(rx + Math.cos(rayAngle) * rStart, ry + Math.sin(rayAngle) * rStart);
              ctx.lineTo(rx + Math.cos(rayAngle) * rEnd, ry + Math.sin(rayAngle) * rEnd);
              ctx.stroke();
            }
          }

          // Reset shadows
          ctx.shadowBlur = 0;

          // Label / ID (with glass badge backing)
          ctx.fillStyle = "rgba(10, 15, 30, 0.75)";
          ctx.strokeStyle = isSelected ? "rgba(249, 115, 22, 0.8)" : "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = 1;
          const text = `${region.id} [${region.coordinates}]`;
          ctx.font = "bold 9px monospace";
          const textWidth = ctx.measureText(text).width;

          // Draw rounded box for text
          const bx = rx + 8;
          const by = ry - 14;
          const bw = textWidth + 10;
          const bh = 14;

          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 3);
          ctx.fill();
          ctx.stroke();

          // Label Text
          ctx.fillStyle = isSelected ? "#f97316" : "#ffffff";
          ctx.fillText(text, bx + 5, by + 10);
        }
      });

      ctx.restore();

      // 5. Orbital path of Aditya-L1 spacecraft (subtle dotted ring with satellite icon)
      ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
      ctx.setLineDash([3, 5]);
      ctx.lineWidth = 1;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.15); // slant orbit
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.55, radius * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.setLineDash([]); // Reset line dash

      // Aditya-L1 Sat position calculation
      const satAngle = localRot * 0.18;
      const satDistX = radius * 1.55;
      const satDistY = radius * 0.45;
      const unrotatedSatX = Math.cos(satAngle) * satDistX;
      const unrotatedSatY = Math.sin(satAngle) * satDistY;

      // Apply orbital rotation matrix (-0.15 radians)
      const cosSlant = Math.cos(-0.15);
      const sinSlant = Math.sin(-0.15);
      const satX = cx + unrotatedSatX * cosSlant - unrotatedSatY * sinSlant;
      const satY = cy + unrotatedSatX * sinSlant + unrotatedSatY * cosSlant;

      // Draw Satellite Icon indicator
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#3b82f6";
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(satX, satY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Satellite antenna/solar panel indicator drawing
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(satX - 6, satY);
      ctx.lineTo(satX + 6, satY);
      ctx.moveTo(satX, satY - 4);
      ctx.lineTo(satX, satY + 4);
      ctx.stroke();

      // Dotted beam pointing to Sun center
      ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(satX, satY);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label "Aditya-L1"
      ctx.fillStyle = "#60a5fa";
      ctx.font = "8px monospace";
      ctx.fillText("ADITYA-L1", satX + 8, satY - 5);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [activeRegions, selectedRegion, flareActive, flareFlash]);

  // Click on region card handler
  const handleSelect = (region: SolarActiveRegion) => {
    onSelectRegion(region);
  };

  return (
    <div id="sun-observatory-panel" className="relative h-full flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
      {/* Glow highlight */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <h3 className="font-sans font-medium text-xs tracking-wider text-slate-400 uppercase">
            Aditya-L1 Solar Corona Observatory
          </h3>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 font-mono text-[9px] text-slate-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
            <Radio className="w-2.5 h-2.5 text-blue-400" /> AR3482 ACTIVE
          </span>
        </div>
      </div>

      {/* Main Observatory Window */}
      <div className="relative flex-1 flex items-center justify-center py-4 min-h-[220px]">
        <canvas
          ref={canvasRef}
          width={360}
          height={280}
          className="max-w-full h-auto cursor-pointer"
          title="Interactive Solar Globe. Active magnetic regions rotate in real time."
        />

        {/* Outer overlay metrics */}
        <div className="absolute top-2 left-2 bg-black/60 border border-white/5 backdrop-blur-sm p-1.5 rounded text-[9px] font-mono leading-relaxed text-slate-400 select-none">
          <span className="text-orange-500 font-bold block mb-0.5">INSTRUMENT FEEDS:</span>
          <div>SoLEXS (Soft): 1-8 Å Spectrum</div>
          <div>HEL1OS (Hard): 10-150 keV</div>
          <div>Filter: Fe XVIII / Fe XX</div>
        </div>

        <div className="absolute bottom-2 right-2 bg-black/60 border border-white/5 backdrop-blur-sm p-1.5 rounded text-[9px] font-mono text-slate-400 text-right select-none">
          <div className="text-cyan-400 font-bold mb-0.5">GRID POSITION:</div>
          <div>HELIOGRAPHIC N18 W42</div>
          <div>SOLAR ROT: <span className="text-white">{(rotation % (Math.PI * 2)).toFixed(3)} rad</span></div>
        </div>
      </div>

      {/* Active Regions Selector List */}
      <div>
        <div className="text-[10px] font-mono text-slate-400 tracking-wider mb-2 uppercase flex items-center justify-between">
          <span>Active Sunspot Regions</span>
          <span className="text-orange-500">P(FLARE) DETECTED</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {activeRegions.map((region) => {
            const isSelected = selectedRegion?.id === region.id;
            return (
              <button
                key={region.id}
                onClick={() => handleSelect(region)}
                className={`flex flex-col text-left p-1.5 rounded border transition-all duration-300 ${
                  isSelected
                    ? "bg-orange-500/10 border-orange-500/50 text-white"
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-[10px] font-bold text-white">{region.id}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      region.status === "active"
                        ? "bg-orange-500"
                        : region.status === "moderate"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-[9px] text-slate-400">{region.coordinates}</span>
                  <span className="font-mono text-[10px] font-bold text-orange-400">
                    {region.flareProbability}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
