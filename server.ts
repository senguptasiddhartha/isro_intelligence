import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI client:", e);
      }
    }
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
  });
});

// Space Weather Briefing API
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { riskScore, riskStatus, currentFluxes, flarePredictions } = req.body;
    const client = getGeminiClient();

    if (!client) {
      // Graceful fallback when API Key is missing
      return res.json({
        briefing: `### **ADITYA-L1 MISSION BRIEFING** (Simulated - Connect Gemini API key for live insights)
**Current Threat Advisory:** ${riskStatus} (Solar Risk Score: ${riskScore}/100)
**Active Active Region AR3482:** Exhibiting continuous magnetic shear, threatening M-class triggering.
**Observational Instruments Status:**
- **SoLEXS (Soft X-rays):** Flux values are steady at **${currentFluxes?.solexs || "2.4e-6"} W/m²**. High probability of a secondary pre-flare warming sequence.
- **HEL1OS (Hard X-rays):** Currently quiet with slight thermal spikes at **${currentFluxes?.hel1os || "1.1e-7"} W/m²**.
- **Magnetic Flux Shear:** Active Region AR3482 maintains a highly sheared beta-gamma-delta magnetic field.

**Actionable Mitigation Protocols:**
1. 🛰️ **Aditya-L1 Protection:** Transition instrument high-voltage systems into safe standby mode if HEL1OS counts cross 1200 cps.
2. 📡 **GNSS Broadcast Warning:** Standardize ionospheric delay correction grids for high-latitude polar routes.
3. 🔌 **Power Grid Alert:** Ground current monitoring active in high-latitude transformer substations.`,
        isSimulated: true,
      });
    }

    const prompt = `Perform a high-priority space weather tactical risk assessment for the Aditya-L1 Mission Control Center.
Data provided:
- Solar Risk Score: ${riskScore}/100
- Risk Status: ${riskStatus}
- Current Soft X-ray (SoLEXS) Flux: ${currentFluxes?.solexs || "Unknown"} W/m²
- Current Hard X-ray (HEL1OS) Flux: ${currentFluxes?.hel1os || "Unknown"} W/m²
- Predicted Flare Probabilities (5m, 15m, 30m, 60m): ${JSON.stringify(flarePredictions)}

Please provide:
1. A highly professional "MISSION CONTROLLER'S ADVISORY" summarizing the active threats.
2. Scientific interpretations of the SoLEXS/HEL1OS observations and predicted countdown.
3. Specific mitigation protocols for Aditya-L1 satellite payload safety, high-latitude commercial aviation, and orbital satellites.
Format the output in clean, professional markdown with space-inspired and mission-critical terminology. Be concise and authoritative.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are ISRO Intelligence, the head Space Weather Analyst at the Aditya-L1 Mission Control. Your reports are highly technical, authoritative, precise, and structured with clear symbols.",
      },
    });

    res.json({
      briefing: response.text || "No briefing text generated.",
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("Error generating AI analysis:", error);
    // Graceful fallback when API fails (e.g. 503 overloaded, rate limits)
    const { riskScore, riskStatus, currentFluxes } = req.body;
    res.json({
      briefing: `### **ADITYA-L1 MISSION BRIEFING** (Real-Time Backup Feed - AI Engine overloaded/503)
**Current Threat Advisory:** ${riskStatus || "HIGH RISK"} (Solar Risk Score: ${riskScore || 82}/100)
**Active Active Region AR3482:** Exhibiting continuous magnetic shear, threatening M-class triggering.
**Observational Instruments Status:**
- **SoLEXS (Soft X-rays):** Flux values are steady at **${currentFluxes?.solexs || "2.4e-6"} W/m²**. High probability of a secondary pre-flare warming sequence.
- **HEL1OS (Hard X-rays):** Currently quiet with slight thermal spikes at **${currentFluxes?.hel1os || "1.1e-7"} W/m²**.
- **Magnetic Flux Shear:** Active Region AR3482 maintains a highly sheared beta-gamma-delta magnetic field.

**Actionable Mitigation Protocols (Backup System Active):**
1. 🛰️ **Aditya-L1 Protection:** Transition instrument high-voltage systems into safe standby mode if HEL1OS counts cross 1200 cps.
2. 📡 **GNSS Broadcast Warning:** Standardize ionospheric delay correction grids for high-latitude polar routes.
3. 🔌 **Power Grid Alert:** Ground current monitoring active in high-latitude transformer substations.`,
      isSimulated: true,
      errorInfo: error?.message || "Model temporarily unavailable (503)",
    });
  }
});

// AI Space Weather Consultant Chat API
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const client = getGeminiClient();

    if (!client) {
      // Simulated Chat Response
      const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
      let responseText = "";

      if (lastMsg.includes("flare") || lastMsg.includes("class")) {
        responseText = "Solar flares are classified as A, B, C, M, or X based on their peak flux of 1 to 8 Angstrom X-rays near Earth. Aditya-L1's SoLEXS payload captures these at high resolutions. Currently, we monitor AR3482, which possesses a complex beta-gamma magnetic configuration with high potential for a M-class flare in the next 15 minutes.";
      } else if (lastMsg.includes("aditya") || lastMsg.includes("satellite") || lastMsg.includes("instrument")) {
        responseText = "Aditya-L1 is positioned in a halo orbit around the Sun-Earth Lagrangian Point L1 (approximately 1.5 million km from Earth). Its primary instruments include SoLEXS (Solar Low Energy X-ray Spectrometer) and HEL1OS (High Energy L1 Orbiting X-ray Spectrometer) which monitor Solar flares in soft and hard X-ray bands continuously.";
      } else if (lastMsg.includes("risk") || lastMsg.includes("alert")) {
        responseText = "Current Solar Risk is calculated based on magnetic shearing, pre-flare thermal temperature spikes, and coronal active region classifications. If the score exceeds 80/100 (HIGH RISK), our automated protocols trigger active alerts for power grids, satellite telemetry adjustments, and polar flight route diversions.";
      } else {
        responseText = `I am ISRO Intelligence, Aditya-L1 Space Weather Specialist. Solar Flux is stable, but monitoring stations report increased magnetic complexity in Active Region AR3482. Please ask me about solar flare classifications, Aditya-L1 instruments (SoLEXS & HEL1OS), current risk metrics, or telemetry correction protocols.`;
      }

      return res.json({
        message: { role: "assistant", content: responseText },
        isSimulated: true,
      });
    }

    // Convert history format to Gemini API format
    // We expect messages to be [{role: "user" | "assistant", content: "..."}]
    const chatContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatContents,
      config: {
        systemInstruction: `You are ISRO Intelligence, the senior space weather analyst and intelligent automated consultant at the ISRO/NASA Aditya-L1 Mission Control Center. 
Your expertise lies in analyzing solar dynamics, heliophysics observations (specifically from SoLEXS and HEL1OS instruments), and magnetospheric interactions. 
Provide precise, professional, mission-focused answers about solar flares, coronal mass ejections (CMEs), solar wind, radiation hazards, and satellite/ground infrastructure safety protocols. 
Keep answers scannable with bullet points and brief technical details suitable for mission commanders. 
Never break character. Keep your tone elite, scientific, and calm.`,
      },
    });

    res.json({
      message: { role: "assistant", content: response.text || "" },
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("Error in AI chat:", error);
    // Graceful fallback when API fails (e.g. 503 overloaded, rate limits)
    const { messages } = req.body;
    const lastMsg = messages && Array.isArray(messages) && messages.length > 0 
      ? messages[messages.length - 1]?.content?.toLowerCase() || "" 
      : "";
    let responseText = "";

    if (lastMsg.includes("flare") || lastMsg.includes("class")) {
      responseText = "[AI link degraded - showing fallback protocol] Solar flares are classified as A, B, C, M, or X based on their peak flux of 1 to 8 Angstrom X-rays near Earth. Aditya-L1's SoLEXS payload captures these at high resolutions. Currently, we monitor AR3482, which possesses a complex beta-gamma magnetic configuration with high potential for a M-class flare in the next 15 minutes.";
    } else if (lastMsg.includes("aditya") || lastMsg.includes("satellite") || lastMsg.includes("instrument")) {
      responseText = "[AI link degraded - showing fallback protocol] Aditya-L1 is positioned in a halo orbit around the Sun-Earth Lagrangian Point L1 (approximately 1.5 million km from Earth). Its primary instruments include SoLEXS (Solar Low Energy X-ray Spectrometer) and HEL1OS (High Energy L1 Orbiting X-ray Spectrometer) which monitor Solar flares in soft and hard X-ray bands continuously.";
    } else if (lastMsg.includes("risk") || lastMsg.includes("alert")) {
      responseText = "[AI link degraded - showing fallback protocol] Current Solar Risk is calculated based on magnetic shearing, pre-flare thermal temperature spikes, and coronal active region classifications. If the score exceeds 80/100 (HIGH RISK), our automated protocols trigger active alerts for power grids, satellite telemetry adjustments, and polar flight route diversions.";
    } else {
      responseText = `[AI link degraded - showing fallback protocol] I am ISRO Intelligence, Aditya-L1 Space Weather Specialist. Solar Flux is stable, but monitoring stations report increased magnetic complexity in Active Region AR3482. Please ask me about solar flare classifications, Aditya-L1 instruments (SoLEXS & HEL1OS), current risk metrics, or telemetry correction protocols.`;
    }

    res.json({
      message: { role: "assistant", content: responseText },
      isSimulated: true,
      errorInfo: error?.message || "Model temporarily unavailable (503)",
    });
  }
});

// Setup Vite or Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
