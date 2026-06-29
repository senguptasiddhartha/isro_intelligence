export interface SolarActiveRegion {
  id: string; // e.g., "AR3482"
  coordinates: string; // e.g., "N18W42"
  class: string; // e.g., "Beta-Gamma-Delta"
  flareProbability: number; // percentage
  status: "active" | "moderate" | "stable";
  lastActivity: string;
}

export interface XRayDataPoint {
  time: string; // HH:MM:SS
  timestamp: number;
  solexs: number; // Soft X-ray flux
  hel1os: number; // Hard X-ray flux
  classLevel?: string; // e.g., "B2.1", "C4.5", "M1.2"
}

export interface FlarePrediction {
  timeframe: string; // e.g., "5 min", "15 min", "30 min", "60 min"
  probability: number; // e.g., 85%
  confidence: "High" | "Medium" | "Low";
  expectedClass: "C" | "M" | "X" | "None";
  countdownSeconds: number;
}

export interface CurrentFlareInfo {
  active: boolean;
  flareClass: string; // e.g., "M4.2"
  startTime: string;
  peakTime: string;
  estimatedEndTime: string;
  currentFlux: number; // e.g., 4.2e-5 W/m2
  maximumFlux: number; // e.g., 5.8e-5 W/m2
}

export interface HistoricalEvent {
  flareId: string;
  date: string;
  class: string;
  similarityScore: number; // percentage
  peakFlux: string;
  activeRegion: string;
  durationMinutes: number;
}

export interface CatalogFlare {
  flareId: string;
  start: string;
  peak: string;
  end: string;
  flareClass: string;
  leadTimeMinutes: number;
  predictionAccuracy: number; // percentage
  confidence: "High" | "Medium" | "Low";
}

export interface SystemStatus {
  adityaL1: "connected" | "degraded" | "disconnected";
  modelHealth: "optimal" | "degraded" | "offline";
  dataQuality: "nominal" | "low_snr" | "stale";
  latencyMs: number;
  apiStatus: "active" | "error";
}

export interface PerformanceMetrics {
  detectionAccuracy: number; // e.g., 94.2
  falseAlarmRate: number; // e.g., 4.8
  averageLeadTimeMinutes: number; // e.g., 18.5
  truePositiveRate: number; // e.g., 96.1
  precision: number; // e.g., 93.4
  recall: number; // e.g., 95.8
  f1Score: number; // e.g., 94.6
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
