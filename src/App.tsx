/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  Database,
  Download,
  Info,
  Maximize2,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sun,
  User,
  Zap,
  Radio,
  FileText,
  Clock,
  History,
  TrendingUp,
  Cpu,
  BarChart3,
  Flame,
  ChevronRight,
  Sparkles,
  Terminal,
  Send,
  SlidersHorizontal,
  Play,
  Pause,
} from "lucide-react";
import SunGlobe from "./components/SunGlobe";
import XRayGraph from "./components/XRayGraph";
import {
  SolarActiveRegion,
  XRayDataPoint,
  FlarePrediction,
  CurrentFlareInfo,
  HistoricalEvent,
  CatalogFlare,
  SystemStatus,
  PerformanceMetrics,
  ChatMessage,
} from "./types";

// Generates simulated base historical database of flares
const INITIAL_CATALOG: CatalogFlare[] = [
  { flareId: "FL-2026-098", start: "22:15:10", peak: "22:19:30", end: "22:24:45", flareClass: "M4.2", leadTimeMinutes: 14, predictionAccuracy: 95.2, confidence: "High" },
  { flareId: "FL-2026-097", start: "18:40:02", peak: "18:48:15", end: "18:55:00", flareClass: "C8.1", leadTimeMinutes: 19, predictionAccuracy: 91.0, confidence: "High" },
  { flareId: "FL-2026-096", start: "14:10:00", peak: "14:14:30", end: "14:22:10", flareClass: "B9.4", leadTimeMinutes: 8, predictionAccuracy: 88.5, confidence: "Medium" },
  { flareId: "FL-2026-095", start: "11:02:44", peak: "11:08:12", end: "11:15:30", flareClass: "M1.2", leadTimeMinutes: 15, predictionAccuracy: 93.6, confidence: "High" },
  { flareId: "FL-2026-094", start: "07:22:15", peak: "07:31:50", end: "07:44:00", flareClass: "X1.1", leadTimeMinutes: 24, predictionAccuracy: 98.4, confidence: "High" },
  { flareId: "FL-2026-093", start: "03:50:11", peak: "03:54:20", end: "04:02:50", flareClass: "C4.3", leadTimeMinutes: 11, predictionAccuracy: 84.1, confidence: "Medium" },
  { flareId: "FL-2026-092", start: "00:12:30", peak: "00:18:05", end: "00:26:40", flareClass: "M2.8", leadTimeMinutes: 17, predictionAccuracy: 92.7, confidence: "High" },
];

const HISTORICAL_MATCHES: HistoricalEvent[] = [
  { flareId: "FL-2003-114", date: "2003-11-04", class: "X28.0", similarityScore: 94.8, peakFlux: "1.2e-3 W/m²", activeRegion: "AR10486", durationMinutes: 42 },
  { flareId: "FL-2017-062", date: "2017-09-06", class: "X9.3", similarityScore: 89.2, peakFlux: "9.3e-4 W/m²", activeRegion: "AR2673", durationMinutes: 31 },
  { flareId: "FL-2024-012", date: "2024-05-14", class: "X8.7", similarityScore: 84.5, peakFlux: "8.7e-4 W/m²", activeRegion: "AR3664", durationMinutes: 28 },
  { flareId: "FL-2021-081", date: "2021-10-28", class: "X1.0", similarityScore: 78.1, peakFlux: "1.0e-4 W/m²", activeRegion: "AR2887", durationMinutes: 19 },
];

const INITIAL_ACTIVE_REGIONS: SolarActiveRegion[] = [
  { id: "AR3482", coordinates: "N18W42", class: "Beta-Gamma-Delta", flareProbability: 82, status: "active", lastActivity: "M4.2 Flare 40m ago" },
  { id: "AR3485", coordinates: "S12E15", class: "Beta-Gamma", flareProbability: 38, status: "moderate", lastActivity: "C1.5 Flare 2h ago" },
  { id: "AR3488", coordinates: "N08W67", class: "Alpha", flareProbability: 12, status: "stable", lastActivity: "Quiet" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [utcTime, setUtcTime] = useState<string>("");
  const [riskScore, setRiskScore] = useState<number>(82);
  const [riskStatus, setRiskStatus] = useState<string>("HIGH RISK");
  const [activeRegions, setActiveRegions] = useState<SolarActiveRegion[]>(INITIAL_ACTIVE_REGIONS);
  const [selectedRegion, setSelectedRegion] = useState<SolarActiveRegion | null>(INITIAL_ACTIVE_REGIONS[0]);
  const [catalog, setCatalog] = useState<CatalogFlare[]>(INITIAL_CATALOG);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [liveUpdating, setLiveUpdating] = useState<boolean>(true);

  // Dynamic simulation parameters
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulatingFlare, setIsSimulatingFlare] = useState<boolean>(false);
  const [flareMessage, setFlareMessage] = useState<string>("");

  // AI Tactical advisory state
  const [briefing, setBriefing] = useState<string>("");
  const [loadingBriefing, setLoadingBriefing] = useState<boolean>(false);
  const [isBriefingSimulated, setIsBriefingSimulated] = useState<boolean>(true);

  // Active Flare Tracking state
  const [currentFlare, setCurrentFlare] = useState<CurrentFlareInfo>({
    active: true,
    flareClass: "M4.2",
    startTime: "22:15:10",
    peakTime: "22:19:30",
    estimatedEndTime: "22:24:45",
    currentFlux: 4.2e-5,
    maximumFlux: 5.8e-5,
  });

  // AI Countdown predictions
  const [predictions, setPredictions] = useState<FlarePrediction[]>([
    { timeframe: "5 min", probability: 85, confidence: "High", expectedClass: "M", countdownSeconds: 300 },
    { timeframe: "15 min", probability: 92, confidence: "High", expectedClass: "M", countdownSeconds: 900 },
    { timeframe: "30 min", probability: 74, confidence: "Medium", expectedClass: "C", countdownSeconds: 1800 },
    { timeframe: "60 min", probability: 48, confidence: "Medium", expectedClass: "C", countdownSeconds: 3600 },
  ]);

  // System status parameters
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    adityaL1: "connected",
    modelHealth: "optimal",
    dataQuality: "nominal",
    latencyMs: 142,
    apiStatus: "active",
  });

  // Performance metrics
  const [metrics] = useState<PerformanceMetrics>({
    detectionAccuracy: 95.8,
    falseAlarmRate: 3.2,
    averageLeadTimeMinutes: 18.5,
    truePositiveRate: 97.2,
    precision: 94.6,
    recall: 96.9,
    f1Score: 95.7,
  });

  // Solar X-Ray Spectrometer initial historical dataset
  const [xrayData, setXrayData] = useState<XRayDataPoint[]>([]);

  // Selected Historical Match details overlay
  const [selectedHistoricalMatch, setSelectedHistoricalMatch] = useState<HistoricalEvent | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: "alert" | "info" | "success" }>>([
    { id: 1, message: "M4.2 solar flare peak threshold detected by Aditya-L1 SoLEXS.", type: "alert" },
    { id: 2, message: "AI Forecasting Model recalibrated using HEL1OS spectrum inputs.", type: "success" },
    { id: 3, message: "Dynamic ionospheric delay correction maps updated for polar sectors.", type: "info" },
  ]);
  const [showNotificationMenu, setShowNotificationMenu] = useState<boolean>(false);

  // Chat Panel State
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Greeting Mission Controller. I am ISRO Intelligence, ready to assist with real-time solar weather analysis and Aditya-L1 payload optimization protocols." }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Update UTC Time in Mission Control format
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate baseline X-Ray historical data on mount
  useEffect(() => {
    const baseData: XRayDataPoint[] = [];
    const nowTs = Date.now();
    for (let i = 60; i >= 0; i--) {
      const ts = nowTs - i * 60000;
      const tStr = new Date(ts).toLocaleTimeString("en-US", { hour12: false });

      // Generate a slight decay trend from the previous flare
      let baseSolexs = 2e-6 + Math.sin(i / 10) * 5e-7;
      let baseHel1os = 1.1e-7 + Math.cos(i / 15) * 2e-8;

      // Simulate a flare in the past (around index 40)
      if (i > 15 && i < 25) {
        const factor = Math.sin(((i - 15) / 10) * Math.PI);
        baseSolexs += factor * 5e-5;
        baseHel1os += factor * 8e-6;
      }

      baseData.push({
        time: tStr,
        timestamp: ts,
        solexs: baseSolexs,
        hel1os: baseHel1os,
        classLevel: getFlareCategory(baseSolexs),
      });
    }
    setXrayData(baseData);
  }, []);

  // Live Telemetry Stream and Flare Simulator Loop
  useEffect(() => {
    if (!liveUpdating) return;

    const interval = setInterval(() => {
      setXrayData((prev) => {
        const next = [...prev];
        const nextTs = Date.now();
        const nextTimeStr = new Date(nextTs).toLocaleTimeString("en-US", { hour12: false });

        let nextSolexs = 2.4e-6 + (Math.random() - 0.5) * 3e-7;
        let nextHel1os = 1.1e-7 + (Math.random() - 0.5) * 2e-8;

        // Flare Simulation Sequence
        if (isSimulatingFlare) {
          const step = simStep + 1;
          setSimStep(step);

          if (step <= 5) {
            // 1. Pre-heating phase
            nextSolexs = 2.4e-6 + (step * 8e-6) + (Math.random() * 2e-6);
            nextHel1os = 1.1e-7 + (step * 1e-7) + (Math.random() * 5e-8);
            setRiskScore((s) => Math.min(95, s + 3));
            setFlareMessage(`Pre-heating detected: Active Region ${selectedRegion?.id || "AR3482"} flux values mounting.`);
          } else if (step <= 12) {
            // 2. Impulsive peak flare phase
            const intensity = step - 5;
            nextSolexs = 4.2e-5 + (intensity * 4e-5) + (Math.random() * 5e-6);
            nextHel1os = 2.4e-6 + (intensity * 8e-6) + (Math.random() * 1e-6);
            setRiskScore((s) => Math.min(100, s + 4));
            setFlareMessage(`💥 FLUX BREAKOUT: Severe hard X-ray spike registered on HEL1OS!`);
            
            // Set current flare active
            setCurrentFlare({
              active: true,
              flareClass: getFlareCategory(nextSolexs),
              startTime: new Date(nextTs - 120000).toLocaleTimeString("en-US", { hour12: false }),
              peakTime: nextTimeStr,
              estimatedEndTime: new Date(nextTs + 480000).toLocaleTimeString("en-US", { hour12: false }),
              currentFlux: nextSolexs,
              maximumFlux: Math.max(currentFlare.maximumFlux, nextSolexs),
            });
          } else if (step <= 25) {
            // 3. Gradual decay phase
            const decayFactor = (25 - step) / 13;
            nextSolexs = 2.4e-6 + (decayFactor * 6e-5) + (Math.random() * 2e-6);
            nextHel1os = 1.1e-7 + (decayFactor * 5e-6) + (Math.random() * 1e-7);
            setRiskScore((s) => Math.max(40, s - 2));
            setFlareMessage(`Gradual decay in progress. Magnetic lines reconnecting.`);
          } else {
            // Reset simulation
            setIsSimulatingFlare(false);
            setSimStep(0);
            setFlareMessage("");
            setRiskScore(42);
            setCurrentFlare((f) => ({ ...f, active: false }));
          }
        } else {
          // Dynamic gentle background variations
          const sinOsc = Math.sin(Date.now() / 30000) * 6e-7;
          nextSolexs += sinOsc;
          nextHel1os += sinOsc * 0.05;
        }

        // Add the new data point and trim to preserve window size
        next.push({
          time: nextTimeStr,
          timestamp: nextTs,
          solexs: nextSolexs,
          hel1os: nextHel1os,
          classLevel: getFlareCategory(nextSolexs),
        });

        if (next.length > 150) next.shift();
        return next;
      });

      // Tick down countdown timers in forecast cards
      setPredictions((prev) =>
        prev.map((pred) => {
          const nextSec = pred.countdownSeconds <= 10 ? 300 : pred.countdownSeconds - 2;
          return {
            ...pred,
            countdownSeconds: nextSec,
            probability: isSimulatingFlare
              ? Math.min(99, pred.probability + 2)
              : Math.max(10, pred.probability + (Math.random() > 0.5 ? 1 : -1)),
          };
        })
      );

      // Random jitter on latency
      setSystemStatus((s) => ({
        ...s,
        latencyMs: Math.max(110, Math.min(190, s.latencyMs + Math.floor((Math.random() - 0.5) * 10))),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [liveUpdating, isSimulatingFlare, simStep, selectedRegion, currentFlare.maximumFlux]);

  // Determine current Risk status label based on riskScore
  useEffect(() => {
    if (riskScore >= 80) setRiskStatus("HIGH RISK");
    else if (riskScore >= 60) setRiskStatus("WARNING");
    else if (riskScore >= 40) setRiskStatus("MODERATE");
    else setRiskStatus("NORMAL STATUS");
  }, [riskScore]);

  // Handle fetch of AI Briefing from backend
  const fetchAIBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskScore,
          riskStatus,
          currentFluxes: {
            solexs: xrayData[xrayData.length - 1]?.solexs || 4.2e-5,
            hel1os: xrayData[xrayData.length - 1]?.hel1os || 2.4e-6,
          },
          flarePredictions: predictions.map((p) => ({ t: p.timeframe, p: p.probability, class: p.expectedClass })),
        }),
      });
      const data = await response.json();
      setBriefing(data.briefing);
      setIsBriefingSimulated(!!data.isSimulated);
    } catch (err) {
      console.error("Advisory generator failed, using native backup.", err);
    } finally {
      setLoadingBriefing(false);
    }
  };

  // Auto-fetch briefing on first render, and update when risk levels spike
  useEffect(() => {
    fetchAIBriefing();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle simulation trigger
  const triggerSimulation = () => {
    setIsSimulatingFlare(true);
    setSimStep(1);
    setRiskScore(65);
    setCurrentFlare({
      active: true,
      flareClass: "M2.1",
      startTime: new Date().toLocaleTimeString("en-US", { hour12: false }),
      peakTime: "--:--:--",
      estimatedEndTime: "Waiting...",
      currentFlux: 2.1e-5,
      maximumFlux: 2.1e-5,
    });
    setNotifications((prev) => [
      { id: Date.now(), message: "🚨 SIMULATED SOLAR FLARE BREAKOUT TRIGGERED.", type: "alert" },
      ...prev,
    ]);
  };

  // Flare Flux Class Finder Helper
  function getFlareCategory(flux: number): string {
    if (flux >= 1e-4) return `X${(flux / 1e-4).toFixed(1)}`;
    if (flux >= 1e-5) return `M${(flux / 1e-5).toFixed(1)}`;
    if (flux >= 1e-6) return `C${(flux / 1e-6).toFixed(1)}`;
    if (flux >= 1e-7) return `B${(flux / 1e-7).toFixed(1)}`;
    return `A${(flux / 1e-8).toFixed(1)}`;
  }

  // Handle chatbot query submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
        }),
      });
      const data = await response.json();
      setChatMessages((prev) => [...prev, data.message]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to Mission Intelligence relay. Telemetry links might be experiencing high flare-induced ionospheric scintillation. Please retry shortly." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Catalogue Search Filter
  const filteredCatalog = useMemo(() => {
    return catalog.filter(
      (item) =>
        item.flareId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.flareClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.confidence.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [catalog, searchQuery]);

  return (
    <div id="mission-control-root" className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-white">
      {/* Background Starry Atmosphere */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.18),rgba(255,255,255,0))] pointer-events-none" />

      {/* 1. TOP NAVIGATION BAR */}
      <header id="top-navigation-bar" className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        {/* Brand logo & product name */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-orange-500 via-purple-600 to-cyan-500 p-[1px] shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <div className="w-full h-full bg-slate-950 rounded-lg flex items-center justify-center">
              <Sun className="w-5 h-5 text-orange-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-sans font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-white to-cyan-400">
                ISRO INTELLIGENCE
              </h1>
              <span className="font-mono text-[9px] font-semibold text-orange-500 bg-orange-500/10 border border-orange-500/25 px-1.5 py-0.5 rounded tracking-widest uppercase">
                ADITYA-L1 CORE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">SOLAR WEATHER TACTICAL MISSION CENTER</p>
          </div>
        </div>

        {/* Dynamic Space telemetry fields */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Mission Time */}
          <div className="flex items-center gap-2 border-r border-white/10 pr-6">
            <Clock className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">SYSTEM TIME (UTC)</p>
              <p className="text-xs font-mono text-cyan-400 font-bold">{utcTime || "LOADING MISSION TIME..."}</p>
            </div>
          </div>

          {/* Aditya L1 connection status */}
          <div className="flex items-center gap-2 border-r border-white/10 pr-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">ADITYA-L1 TELEMETRY</p>
              <p className="text-xs font-mono text-slate-200 font-bold uppercase flex items-center gap-1">
                L1 HALO LINK <span className="text-emerald-400">NOMINAL</span>
              </p>
            </div>
          </div>

          {/* Core AI Health status */}
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">FORECAST ENGINE AI</p>
              <p className="text-xs font-mono text-purple-300 font-bold uppercase">
                MODEL: <span className="text-purple-400">ACTIVE</span>
              </p>
            </div>
          </div>
        </div>

        {/* User alerts, actions, profile */}
        <div className="flex items-center gap-3">
          {/* AI Advisor Button */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/25 text-xs text-purple-300 font-mono transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
            <span>AI ADVISOR</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </button>

          {/* Notification bell menu */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 relative transition-all"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* Notifications panel dropdown */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl z-50">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Telemetry Notifications</h4>
                  <button
                    onClick={() => setNotifications([])}
                    className="text-[9px] font-mono text-slate-500 hover:text-white"
                  >
                    CLEAR ALL
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono text-center py-4">No active telemetry advisories.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2 rounded text-[11px] font-mono border ${
                          notif.type === "alert"
                            ? "bg-red-500/10 border-red-500/25 text-red-300"
                            : notif.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                            : "bg-cyan-500/10 border-cyan-500/25 text-cyan-300"
                        }`}
                      >
                        {notif.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <div className="w-8 h-8 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[10px] font-mono font-bold text-slate-300 leading-none">FLT_LT. SEN</p>
              <p className="text-[8px] font-mono text-cyan-400">ISRO COMMANDER</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Left Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2. LEFT SIDEBAR */}
        <aside id="left-sidebar" className="hidden md:flex flex-col w-64 border-r border-white/10 bg-slate-950/60 backdrop-blur-sm p-4 justify-between select-none">
          {/* Section 1: Navigation Actions */}
          <div className="space-y-6">
            <div>
              <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">MISSION SECTOR NAVIGATION</p>
              <nav className="space-y-1">
                {[
                  { id: "dashboard", label: "Dashboard", icon: Activity },
                  { id: "live_solar", label: "Live Solar Activity", icon: Sun },
                  { id: "nowcasting", label: "Nowcasting", icon: Zap },
                  { id: "forecasting", label: "Forecasting", icon: TrendingUp },
                  { id: "catalogue", label: "Master Flare Catalogue", icon: Database },
                  { id: "historical", label: "Historical Analysis", icon: History },
                  { id: "analytics", label: "Analytics", icon: BarChart3 },
                  { id: "reports", label: "Reports", icon: FileText },
                  { id: "settings", label: "Settings", icon: Settings },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        // Auto scroll helper
                        const el = document.getElementById(tab.id);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium font-sans tracking-wide transition-all ${
                        isActive
                          ? "bg-cyan-500/15 border-l-2 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                        {tab.label}
                      </span>
                      <ChevronRight className={`w-3 h-3 text-slate-500 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Commands Simulator Button */}
            <div className="border border-white/10 bg-white/5 rounded-xl p-3 text-center">
              <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 justify-center uppercase font-bold mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Simulation Core
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed font-mono mb-2">
                Inject custom solar flare sequences to test spacecraft response and AI algorithms.
              </p>
              <button
                onClick={triggerSimulation}
                disabled={isSimulatingFlare}
                className={`w-full py-1.5 px-3 rounded text-xs font-mono font-bold transition-all ${
                  isSimulatingFlare
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                }`}
              >
                {isSimulatingFlare ? "FLARE DEPLOYED..." : "SIMULATE FLARE TRIGGER"}
              </button>
            </div>
          </div>

          {/* Section 2: Core Ground Station Info */}
          <div className="border-t border-white/5 pt-4">
            <div className="bg-slate-900/50 border border-white/5 rounded-lg p-3 font-mono text-[9px] leading-relaxed text-slate-400 space-y-1">
              <p className="font-bold text-slate-300">GROUND DATA INTEGRATION:</p>
              <p>📍 ISRO Deep Space Network</p>
              <p>📡 Payload: HEL1OS, SoLEXS</p>
              <p>🛰️ Sub-Systems: MAG, ASPEX</p>
              <p className="text-cyan-400 text-right mt-1.5 select-none font-semibold">VER v1.1.2-ALPHA</p>
            </div>
          </div>
        </aside>

        {/* 3. MAIN CONTENT SECTION */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Simulation Notification Warning Bar */}
          {isSimulatingFlare && (
            <div className="animate-pulse bg-gradient-to-r from-red-950 via-orange-950 to-red-950 border-y border-red-500/40 p-3 text-center text-xs font-mono text-orange-200 rounded-lg flex items-center justify-center gap-2">
              <Flame className="w-4 h-4 text-orange-400 animate-spin" />
              <span>[SIMULATED TELEMETRY BREAKOUT ACTIVE]</span>
              <span className="text-white font-bold">{flareMessage}</span>
              <span className="text-[10px] text-slate-400">(Sim Step: {simStep}/25)</span>
            </div>
          )}

          {/* HERO CARD & MAIN KPI DASHBOARD HEADER */}
          <section id="dashboard" className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Space Weather Intelligence Platform - Hero */}
            <div className="xl:col-span-3 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative overflow-hidden min-h-[160px]">
              <div className="absolute top-0 right-0 w-80 h-full bg-[radial-gradient(circle_at_right_top,rgba(59,130,246,0.15),transparent)] pointer-events-none" />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                    ISRO TACTICAL FORECAST ENGINE
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-[10px] font-mono text-slate-400">Aditya-L1 L1 Lagrange Point Orbit</span>
                </div>
                <h2 className="font-sans font-extrabold text-2xl lg:text-3xl text-white tracking-tight">
                  Space Weather Intelligence Platform
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Real-time solar flare observation, risk nowcasting and dynamic prediction using Aditya-L1 satellite payload
                  instruments (SoLEXS & HEL1OS spectrometer bands). High-altitude satellite operations & ground grid advisory.
                </p>
              </div>

              {/* Dynamic Status / Interactive Advisory Bar */}
              <div className="mt-4 flex flex-wrap gap-4 items-center justify-between border-t border-white/5 pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-400">CURRENT MISSION STATE:</span>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-mono">
                      Solar Activity: <span className={riskScore >= 70 ? "text-red-400 font-bold animate-pulse" : "text-yellow-400"}>{riskScore >= 70 ? "Active M-Class Flare" : "Moderate Quiet"}</span>
                    </span>
                    <span className="px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-mono">
                      Risk Level: <span className={`font-bold ${riskScore >= 80 ? "text-red-400" : riskScore >= 50 ? "text-orange-400" : "text-emerald-400"}`}>{riskStatus}</span>
                    </span>
                    <span className="px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-mono">
                      Last Live Update: <span className="text-cyan-400 font-bold">{new Date().toLocaleTimeString("en-US", { hour12: false })}</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={fetchAIBriefing}
                  disabled={loadingBriefing}
                  className="flex items-center gap-1.5 px-3 py-1 rounded border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/25 text-[10px] font-mono text-cyan-300 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBriefing ? "animate-spin" : ""}`} />
                  {loadingBriefing ? "UPDATING..." : "RECALIBRATE BRIEFINGS"}
                </button>
              </div>
            </div>

            {/* SOLAR RISK INDICATOR - Circular Gauge */}
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest text-center mb-2">Solar Flare Risk Score</p>

              {/* SVG Circular Gauge */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Gauge background trail */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-800 fill-none"
                    strokeWidth="8"
                  />
                  {/* Gauge color gradient bar */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={riskScore >= 80 ? "#ef4444" : riskScore >= 50 ? "#f97316" : riskScore >= 30 ? "#eab308" : "#10b981"}
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * riskScore) / 100}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Score centered */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-3xl font-bold text-white tracking-tighter">{riskScore}</span>
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wide">MAX 100</span>
                </div>
              </div>

              {/* Status indicator badges */}
              <div className="mt-3 text-center">
                <div className={`text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded ${
                  riskScore >= 80
                    ? "text-red-400 bg-red-500/10 border border-red-500/25"
                    : riskScore >= 50
                    ? "text-orange-400 bg-orange-500/10 border border-orange-500/25"
                    : riskScore >= 30
                    ? "text-yellow-400 bg-yellow-500/10 border border-yellow-500/25"
                    : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25"
                }`}>
                  {riskStatus}
                </div>
                <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-tight">Active Region {selectedRegion?.id || "AR3482"}</p>
              </div>
            </div>
          </section>

          {/* MAIN GRAPH + SOLAR SPOTS MAP DUAL VIEWPORT */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Live X-Ray Spectrometer Graph */}
            <div id="live_solar" className="xl:col-span-2">
              <XRayGraph
                data={xrayData}
                liveUpdating={liveUpdating}
                onToggleLive={() => setLiveUpdating(!liveUpdating)}
              />
            </div>

            {/* Rotating Sun Globe & Active regions */}
            <div className="xl:col-span-1">
              <SunGlobe
                activeRegions={activeRegions}
                onSelectRegion={setSelectedRegion}
                selectedRegion={selectedRegion}
              />
            </div>
          </section>

          {/* AI DECISION SUPPORT, FLARE FORECASTING & CURRENT FLUX PANELS */}
          <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* AI FORECAST PANEL */}
            <div id="forecasting" className="xl:col-span-2 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <h3 className="font-sans font-semibold text-sm text-white uppercase tracking-wider">AI Flare Forecasting Countdown</h3>
                </div>
                <span className="font-mono text-[9px] text-purple-400 border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 rounded uppercase">
                  Prediction Loop
                </span>
              </div>

              {/* 4 Cards for timeslots */}
              <div className="grid grid-cols-2 gap-3">
                {predictions.map((pred, idx) => {
                  const minutes = Math.floor(pred.countdownSeconds / 60);
                  const seconds = pred.countdownSeconds % 60;
                  return (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/5 hover:border-cyan-500/25 p-3 rounded-xl transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-slate-300 font-bold">{pred.timeframe}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          pred.confidence === "High"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-yellow-500/10 text-yellow-300"
                        }`}>
                          {pred.confidence} CONF
                        </span>
                      </div>

                      <div className="my-2.5">
                        <p className="text-[9px] font-mono text-slate-500 uppercase">Flare Probability</p>
                        <div className="flex items-baseline gap-1">
                          <p className="font-mono text-2xl font-bold text-white tracking-tight">{pred.probability}%</p>
                          <p className="text-[10px] text-slate-400 font-mono font-semibold">({pred.expectedClass}-Class)</p>
                        </div>
                      </div>

                      {/* Progress Probability bar */}
                      <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mb-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all duration-500"
                          style={{ width: `${pred.probability}%` }}
                        />
                      </div>

                      {/* Countdown timer */}
                      <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400 border-t border-white/5 pt-1.5 justify-between">
                        <span>EST. TRIGGER COUNTDOWN:</span>
                        <span className="text-cyan-400 font-bold">
                          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CURRENT FLARE PANEL */}
            <div id="nowcasting" className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <h3 className="font-sans font-semibold text-sm text-white uppercase tracking-wider">Current Active Flare</h3>
                </div>
                {currentFlare.active ? (
                  <span className="animate-pulse font-mono text-[9px] text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded font-bold uppercase">
                    EJECTA ONGOING
                  </span>
                ) : (
                  <span className="font-mono text-[9px] text-slate-500 bg-white/5 px-2 py-0.5 rounded uppercase">
                    QUIET STATE
                  </span>
                )}
              </div>

              <div className="space-y-4 font-mono">
                {/* Active flare Class identifier badge */}
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase">SOLAR CLASSIFICATION</p>
                    <p className="text-xl font-bold text-white tracking-tight">{currentFlare.flareClass}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 uppercase">PEAK STATE</p>
                    <p className="text-[10px] text-orange-400 font-bold">IMPULSIVE PEAK</p>
                  </div>
                </div>

                {/* Flux indicators */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 border border-white/5 p-2 rounded-lg">
                    <span className="text-[8px] text-slate-400 block mb-0.5 uppercase">Current Flux</span>
                    <span className="text-cyan-300 font-bold font-mono">{currentFlare.currentFlux.toExponential(2)}</span>
                    <span className="text-[8px] text-slate-500 block">W/m² (SoLEXS)</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-2 rounded-lg">
                    <span className="text-[8px] text-slate-400 block mb-0.5 uppercase">Max Peak Flux</span>
                    <span className="text-orange-400 font-bold font-mono">{currentFlare.maximumFlux.toExponential(2)}</span>
                    <span className="text-[8px] text-slate-500 block">W/m² (HEL1OS)</span>
                  </div>
                </div>

                {/* Start, Peak, End timestamps */}
                <div className="border-t border-white/5 pt-3 space-y-1.5 text-[10px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Ejecta Start Time:</span>
                    <span className="text-white">{currentFlare.startTime} UTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Observed Peak Time:</span>
                    <span className="text-white">{currentFlare.peakTime} UTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Decouple Time:</span>
                    <span className="text-white">{currentFlare.estimatedEndTime} UTC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SYSTEM HEALTH CARDS & METADATA */}
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <h3 className="font-sans font-semibold text-sm text-white uppercase tracking-wider">System & Telemetry Health</h3>
              </div>

              <div className="space-y-2.5 font-mono text-[11px]">
                {/* 1. Aditya link */}
                <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-slate-400">Aditya-L1 Uplink</span>
                  <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> NOMINAL
                  </span>
                </div>

                {/* 2. Model health */}
                <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-slate-400">AI Model Health</span>
                  <span className="text-cyan-400 font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" /> OPTIMAL
                  </span>
                </div>

                {/* 3. SNR data quality */}
                <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-slate-400">SNR Ratio Quality</span>
                  <span className="text-emerald-400 font-bold uppercase">98.4 dB</span>
                </div>

                {/* 4. Telemetry delay */}
                <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-slate-400">L1 Lag Latency</span>
                  <span className="text-cyan-300 font-bold">{systemStatus.latencyMs} ms</span>
                </div>

                {/* 5. API Status */}
                <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-slate-400">AI API Status</span>
                  <span className="text-purple-400 font-bold uppercase">SECURE LINK</span>
                </div>
              </div>
            </div>
          </section>

          {/* AI EXPLANATION & HISTORICAL PATTERN MATCH CHUNKS */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* AI EXPLANATION PANEL */}
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4 text-purple-400 animate-spin" />
                <h3 className="font-sans font-semibold text-sm text-white uppercase tracking-wider">AI Prognosis Explanation</h3>
              </div>

              <div className="font-mono text-xs">
                <p className="text-slate-300 mb-3 leading-relaxed">
                  The ISRO Intelligence forecasting network monitors multi-spectral anomalies. The following triggers outline the rationale behind the current <span className="text-orange-400 font-bold">{riskScore}%</span> flare forecast:
                </p>

                {/* Timeline Visualization */}
                <div className="relative border-l border-white/10 pl-6 ml-3 space-y-4">
                  {[
                    { time: "0-2m ago", text: "Soft X-ray (SoLEXS) increasing steadily in Fe XVIII channel", type: "success" },
                    { time: "1m ago", text: "Hard X-ray (HEL1OS) high-energy count spikes (12-25 keV)", type: "warning" },
                    { time: "Just now", text: "Pattern matching correlates with historical M-class pre-flare anomalies", type: "active" },
                    { time: "Prognosis", text: "Network calculates high confidence (>85%) of flare climax", type: "info" },
                  ].map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[30px] top-1.5 w-2.5 h-2.5 rounded-full border ${
                        step.type === "success"
                          ? "bg-emerald-500 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : step.type === "warning"
                          ? "bg-orange-500 border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                          : step.type === "active"
                          ? "bg-purple-500 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.5)] animate-ping"
                          : "bg-cyan-500 border-cyan-500/50 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                      }`} />
                      {step.type === "active" && (
                        <span className="absolute -left-[30px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-500" />
                      )}

                      <div className="flex items-baseline justify-between gap-4">
                        <span className={`text-[10px] font-bold ${
                          step.type === "success" ? "text-emerald-400" : step.type === "warning" ? "text-orange-400" : "text-purple-400"
                        }`}>{step.time}</span>
                        <span className="text-slate-500 text-[10px]">VERIFIED</span>
                      </div>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* HISTORICAL EVENT MATCH */}
            <div id="historical" className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-sans font-semibold text-sm text-white uppercase tracking-wider">Historical Solar Event Matching</h3>
                </div>
                <span className="font-mono text-[9px] text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded">
                  Nearest Neighbor Fit
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4 font-mono">
                Pattern matching algorithms comparing current spectral ramps against NASA/ISRO archives dating from 1996:
              </p>

              {/* Historical matching lists */}
              <div className="space-y-2.5">
                {HISTORICAL_MATCHES.map((event) => (
                  <button
                    key={event.flareId}
                    onClick={() => setSelectedHistoricalMatch(event)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-cyan-500/20 text-left font-mono transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <Flame className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{event.flareId}</span>
                          <span className="text-[10px] text-slate-500">|</span>
                          <span className="text-[10px] text-orange-400 font-bold">{event.class}</span>
                        </div>
                        <p className="text-[9px] text-slate-400">Observed {event.date} • AR: {event.activeRegion}</p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-[8px] text-slate-500 uppercase leading-none">AI SIMILARITY</p>
                        <p className="text-xs font-bold text-cyan-400">{event.similarityScore}%</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* HISTORICAL COMPREHENSIVE OVERLAY POPUP */}
          {selectedHistoricalMatch && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/15 p-6 rounded-2xl max-w-md w-full relative font-mono text-xs shadow-2xl">
                <h4 className="text-sm font-bold text-orange-400 flex items-center gap-2 border-b border-white/10 pb-3 mb-4 uppercase">
                  <Flame className="w-4 h-4 text-orange-500" /> Event Compare: {selectedHistoricalMatch.flareId}
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Flare Classification:</span>
                    <span className="text-white font-bold">{selectedHistoricalMatch.class}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Observed Historical Date:</span>
                    <span className="text-white">{selectedHistoricalMatch.date}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Observed Peak Flux:</span>
                    <span className="text-white">{selectedHistoricalMatch.peakFlux}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Active Sunspot Region:</span>
                    <span className="text-cyan-400">{selectedHistoricalMatch.activeRegion}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Ejection Duration:</span>
                    <span className="text-white">{selectedHistoricalMatch.durationMinutes} minutes</span>
                  </div>
                  <div className="flex justify-between text-cyan-400 font-bold">
                    <span>Algorithm Fit Correlation:</span>
                    <span>{selectedHistoricalMatch.similarityScore}%</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      // Apply similarity to current predictions for fidelity
                      setPredictions((prev) =>
                        prev.map((p) => ({
                          ...p,
                          probability: Math.min(99, Math.floor(p.probability * (selectedHistoricalMatch.similarityScore / 100))),
                        }))
                      );
                      setSelectedHistoricalMatch(null);
                    }}
                    className="flex-1 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold rounded-lg border border-cyan-500/30 transition-all text-center"
                  >
                    Overlay Historical Weights
                  </button>
                  <button
                    onClick={() => setSelectedHistoricalMatch(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MASTER FLARE CATALOGUE */}
          <section id="catalogue" className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-sans font-semibold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" /> Master Solar Flare Catalogue
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ISRO Aditya-L1 / NASA SOHO Joint Observational Database</p>
              </div>

              {/* Search filter input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search flare, region, class..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-full md:w-64"
                />
              </div>
            </div>

            {/* Catalogue Table */}
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-white/5 text-slate-400 border-b border-white/10">
                    <th className="p-3">Flare ID</th>
                    <th className="p-3">Trigger Start</th>
                    <th className="p-3">Peak Climax</th>
                    <th className="p-3">Decouple End</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">AI Lead Time</th>
                    <th className="p-3">Prediction Acc.</th>
                    <th className="p-3 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredCatalog.map((item, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold text-white">{item.flareId}</td>
                      <td className="p-3">{item.start}</td>
                      <td className="p-3">{item.peak}</td>
                      <td className="p-3">{item.end}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                          item.flareClass.startsWith("X")
                            ? "bg-red-500/10 text-red-400"
                            : item.flareClass.startsWith("M")
                            ? "bg-orange-500/10 text-orange-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {item.flareClass}
                        </span>
                      </td>
                      <td className="p-3 text-cyan-400 font-semibold">{item.leadTimeMinutes} min</td>
                      <td className="p-3">{item.predictionAccuracy}%</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] ${
                          item.confidence === "High" ? "bg-emerald-500/10 text-emerald-300" : "bg-yellow-500/10 text-yellow-300"
                        }`}>
                          {item.confidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SMART ALERT PANEL */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: "Normal Activity", desc: "No active M or X class flares predicted within 60 minutes. Satellite payloads clear.", bg: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" },
              { title: "Watch Active", desc: "Active sunspot region AR3482 showing thermal flux build up. Pre-heating ongoing.", bg: "bg-yellow-500/10 border-yellow-500/25 text-yellow-400" },
              { title: "Warning Issued", desc: "M-class flare countdown active. Transition polar flights to lower altitude routes.", bg: "bg-orange-500/10 border-orange-500/25 text-orange-400" },
              { title: "Critical Advisory", desc: "Extreme X-class ejecta imminent. Secure satellite high-voltage instruments.", bg: "bg-red-500/10 border-red-500/25 text-red-400" },
            ].map((alert, index) => {
              // Highlight active based on risk score
              const isActive =
                (index === 0 && riskScore < 40) ||
                (index === 1 && riskScore >= 40 && riskScore < 60) ||
                (index === 2 && riskScore >= 60 && riskScore < 80) ||
                (index === 3 && riskScore >= 80);

              return (
                <div
                  key={index}
                  className={`rounded-xl border p-4 transition-all duration-500 flex flex-col justify-between ${
                    isActive ? alert.bg + " ring-1 ring-white/20 shadow-lg" : "bg-white/5 border-white/5 text-slate-500 opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-xs uppercase tracking-wider">{alert.title}</span>
                    {isActive && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mt-2 leading-relaxed font-mono">{alert.desc}</p>
                </div>
              );
            })}
          </section>

          {/* PERFORMANCE ANALYTICS & STATISTICAL METRICS */}
          <section id="analytics" className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <h3 className="font-sans font-semibold text-sm text-white uppercase tracking-wider">AI Predictive Performance Metrics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Flare Detection Accuracy", value: metrics.detectionAccuracy, desc: "Successful predictions vs flares", color: "from-cyan-500 to-blue-500" },
                { label: "False Alarm Rate (FAR)", value: metrics.falseAlarmRate, desc: "Mismatched alarm triggers", color: "from-amber-500 to-orange-500" },
                { label: "Average Lead Warning Time", value: `${metrics.averageLeadTimeMinutes}m`, desc: "Advanced lead notification time", color: "from-purple-500 to-pink-500" },
                { label: "True Positive Detection Rate", value: metrics.truePositiveRate, desc: "Sensitivity profile matching", color: "from-emerald-500 to-cyan-500" },
              ].map((m, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">{m.label}</span>
                    <span className="text-xl font-bold text-white block mt-1">{typeof m.value === 'number' ? `${m.value}%` : m.value}</span>
                  </div>

                  {typeof m.value === 'number' && (
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden my-2.5">
                      <div
                        className={`h-full bg-gradient-to-r ${m.color}`}
                        style={{ width: `${m.value}%` }}
                      />
                    </div>
                  )}

                  <p className="text-[9px] text-slate-500 leading-normal">{m.desc}</p>
                </div>
              ))}
            </div>

            {/* Confusion Matrix stats detail row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5 text-[10px] font-mono text-slate-400">
              <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                <span>MODEL PRECISION PROFILE:</span>
                <span className="text-cyan-400 font-bold">{metrics.precision}%</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                <span>MODEL RECALL CAPACITY:</span>
                <span className="text-cyan-400 font-bold">{metrics.recall}%</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                <span>COMPOSITE F1 STATISTICAL SCORE:</span>
                <span className="text-purple-400 font-bold">{metrics.f1Score}%</span>
              </div>
            </div>
          </section>

          {/* REFORMS, TACTICAL ADVISORY, PRINTING SECTIONS */}
          <section id="reports" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Dynamic AI-generated advisory from Gemini */}
            <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 to-slate-950 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative">
              <div className="absolute top-0 right-0 w-60 h-full bg-[radial-gradient(circle_at_right_top,rgba(168,85,247,0.1),transparent)] pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">AI Tactical Mission Briefing</h3>
                </div>
                {isBriefingSimulated && (
                  <span className="font-mono text-[9px] text-yellow-400 border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 rounded uppercase">
                    SIMULATED ADVISORY
                  </span>
                )}
              </div>

              {/* Advisory details */}
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-wrap">
                {briefing ? (
                  briefing
                ) : (
                  <p className="text-slate-500 text-center py-10">Fetching Aditya-L1 tactical mission briefings from AI core...</p>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <p className="text-[10px] text-slate-500 font-mono">Powered by Google Gemini & Aditya-L1 Payload Stream</p>
                <div className="flex gap-2">
                  <button
                    onClick={fetchAIBriefing}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white font-mono text-xs rounded border border-white/10 transition-all"
                  >
                    Regenerate Insights
                  </button>
                  <button
                    onClick={() => {
                      // Generate text download of briefing
                      const blob = new Blob([briefing], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "isro_intelligence_mission_briefing.txt";
                      a.click();
                    }}
                    className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-xs rounded border border-cyan-500/30 transition-all flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Save Advisory
                  </button>
                </div>
              </div>
            </div>

            {/* QUICK TELEMETRY EXPORT SETTINGS */}
            <div id="settings" className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <h3 className="font-sans font-semibold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" /> Ground Control Settings
              </h3>

              <div className="space-y-4 font-mono text-xs">
                {/* 1. Sensor toggle */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 uppercase">Primary Instrument Input Stream</label>
                  <select className="bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500/40">
                    <option value="both">Both SoLEXS + HEL1OS Combined</option>
                    <option value="solexs">SoLEXS (1-8 Å Soft X-Ray only)</option>
                    <option value="hel1os">HEL1OS (10-150 keV Hard X-Ray only)</option>
                  </select>
                </div>

                {/* 2. Simulation options */}
                <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                  <div>
                    <p className="font-bold text-white leading-none">Auto-Calibration</p>
                    <p className="text-[9px] text-slate-400 mt-1">Recalibrate noise ratio filters</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-cyan-500 w-4 h-4 cursor-pointer" />
                </div>

                {/* 3. API Token settings */}
                <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                  <div>
                    <p className="font-bold text-white leading-none">Gemini API Link</p>
                    <p className="text-[9px] text-slate-400 mt-1">Configure workspace API secrets</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-300 font-bold uppercase">
                    RESOLVED
                  </span>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <button
                    onClick={() => {
                      alert("Space Weather Telemetry calibrations applied to ground station loops.");
                    }}
                    className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold rounded-lg font-sans transition-all"
                  >
                    Apply Calibrations
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* 4. CHAT COLLAPSIBLE DRAWER / SIDEBAR (ISRO INTELLIGENCE ADVISOR) */}
      {chatOpen && (
        <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-slate-950/95 border-l border-white/15 shadow-2xl z-50 flex flex-col justify-between font-mono text-xs">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-purple-500/20 border border-purple-500/40 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-wider">ISRO Intelligence AI Officer</h4>
                <p className="text-[8px] text-slate-400">Autonomous Space Weather Specialist</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
            >
              CLOSE ✕
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <span className="text-[8px] text-slate-500 uppercase mb-1">
                  {msg.role === "user" ? "Commander Sen" : "ISRO Assistant"}
                </span>
                <div
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 rounded-tr-none"
                      : "bg-white/5 border border-white/5 text-slate-200 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-slate-400">
                <span className="animate-spin">🌀</span>
                <span>Calculating heliospheric simulations...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Queries */}
          <div className="p-2 border-t border-white/5 bg-black/40 flex flex-wrap gap-1.5">
            {[
              "Explain X-class vs M-class flares",
              "What is the current risk profile of AR3482?",
              "How does Aditya-L1 capture solar x-rays?",
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => setChatInput(q)}
                className="text-[9px] bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-300 text-slate-400 border border-white/5 px-2 py-1 rounded transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/10 bg-slate-900 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask ISRO Intelligence about telemetry data..."
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center w-9 h-9"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
