/**
 * Real-time Motor Data Hook
 * Listens to Firebase Realtime Database for live motor parameters
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase/config";
import type {
  MotorData,
  VibrationDataPoint,
  PredictiveMaintenanceData,
  FirebaseLogEntry,
} from "@/types/motor";

const MOTOR_REF = "motor01";
/** Max points on vibration graph – shows all Firebase history up to this cap */
const VIBRATION_CHART_POINTS = 500;

function parseLogEntry(entry: FirebaseLogEntry): MotorData {
  return {
    current: {
      phaseA: entry.I1 ?? 0,
      phaseB: entry.I2 ?? 0,
      phaseC: entry.I3 ?? 0,
    },
    voltage: {
      phaseA: entry.V1 ?? 0,
      phaseB: entry.V2 ?? 0,
      phaseC: entry.V3 ?? 0,
    },
    frequency: entry.frequency ?? 50,
    temperature: {
      t1: entry.T1 ?? 0,
      t2: entry.T2 ?? 0,
    },
  };
}

function sortLogEntries(entries: [string, FirebaseLogEntry][]): [string, FirebaseLogEntry][] {
  return [...entries].sort((a, b) => {
    const keyA = a[0];
    const keyB = b[0];
    if (keyA === "entry_live") return 1;
    if (keyB === "entry_live") return -1;
    const numA = parseInt(keyA.replace("entry_", ""), 10);
    const numB = parseInt(keyB.replace("entry_", ""), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return keyA.localeCompare(keyB);
  });
}

function entriesToVibrationData(entries: [string, FirebaseLogEntry][]): VibrationDataPoint[] {
  const sorted = sortLogEntries(entries);
  const latest = sorted.slice(-VIBRATION_CHART_POINTS);
  return latest.map(([, entry], idx) => ({
    time: idx,
    value: entry.vibration ?? 0,
  }));
}

// Firebase ke raw vibration ko display ke liye ek simple helper:
// sirf rounding karta hai, koi shift/clamp nahi – line bilkul real data se hi shuru hoti hai.
function mapDisplayVibration(raw: number): number {
  return Math.round(raw * 100) / 100;
}

// Display ke liye ek step helper: raw aur previous ke beech ka difference
// maxDelta se zyada na hone de, taa ke consecutive points me sirf chhota farq aaye.
function cappedStep(prev: number, raw: number, maxDelta: number): number {
  const p = mapDisplayVibration(prev);
  const r = mapDisplayVibration(raw);
  const diff = r - p;
  if (Math.abs(diff) <= maxDelta) {
    return r;
  }
  const next = p + Math.sign(diff) * maxDelta;
  return mapDisplayVibration(next);
}

/** Lerp between two numbers */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Smoothly interpolate motor data for gradual gauge movement */
function lerpMotorData(a: MotorData, b: MotorData, t: number): MotorData {
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    current: {
      phaseA: round(lerp(a.current.phaseA, b.current.phaseA, t)),
      phaseB: round(lerp(a.current.phaseB, b.current.phaseB, t)),
      phaseC: round(lerp(a.current.phaseC, b.current.phaseC, t)),
    },
    voltage: {
      phaseA: round(lerp(a.voltage.phaseA, b.voltage.phaseA, t)),
      phaseB: round(lerp(a.voltage.phaseB, b.voltage.phaseB, t)),
      phaseC: round(lerp(a.voltage.phaseC, b.voltage.phaseC, t)),
    },
    frequency: round(lerp(a.frequency, b.frequency, t)),
    temperature: {
      t1: round(lerp(a.temperature.t1, b.temperature.t1, t)),
      t2: round(lerp(a.temperature.t2, b.temperature.t2, t)),
    },
  };
}

/** Synthetic data when Firebase has no logs – clean sine wave like oscilloscope */
function generateSyntheticVibration(step: number): number {
  // Step ko thoda slow rakha hai taa ke graph par 2–3 clear hills nazar aayen
  const t = step / 25;
  const wave = Math.sin(t * 2 * Math.PI * 0.25); // smooth up/down sine
  const base = 2.5; // center line
  const amp = 0.7; // peak distance from center
  return Math.round((base + amp * wave) * 100) / 100;
}

function generateSyntheticMotorData(step: number): MotorData {
  const t = step / 80;
  const round = (n: number) => Math.round(n * 100) / 100;

  // Baseline values + very small oscillation so change hamesha gradual aur chhota lage
  const baseCurrent = 72;
  const currentAmp = 1.0;
  const wave = Math.sin(t * 2 * Math.PI * 0.2);

  return {
    current: {
      phaseA: round(baseCurrent + currentAmp * wave + 0.2 * (Math.random() - 0.5)),
      phaseB: round(baseCurrent + 0.6 + currentAmp * 0.9 * wave + 0.2 * (Math.random() - 0.5)),
      phaseC: round(baseCurrent - 0.6 + currentAmp * 0.8 * wave + 0.2 * (Math.random() - 0.5)),
    },
    voltage: {
      phaseA: round(400 + 1.0 * Math.sin(t * 0.3) + 0.5 * (Math.random() - 0.5)),
      phaseB: round(401 + 0.5 * Math.sin(t * 0.25) + 0.5 * (Math.random() - 0.5)),
      phaseC: round(399 + 0.5 * Math.sin(t * 0.28) + 0.5 * (Math.random() - 0.5)),
    },
    frequency: round(50 + 0.01 * Math.sin(t * 0.4)),
    temperature: {
      t1: round(55 + 2.0 * Math.sin(t * 0.18) + 0.4 * (Math.random() - 0.5)),
      t2: round(50 + 1.5 * Math.sin(t * 0.16) + 0.4 * (Math.random() - 0.5)),
    },
  };
}

export function useMotorData() {
  const [motorData, setMotorData] = useState<MotorData | null>(null);
  const [vibrationData, setVibrationData] = useState<VibrationDataPoint[]>([]);
  const [predictiveMaintenance, setPredictiveMaintenance] =
    useState<PredictiveMaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loopEntries, setLoopEntries] = useState<FirebaseLogEntry[]>([]);

  // Logs listener: Firebase ke motor01/logs ko memory me store karte hain (max 500),
  // baad me frontend inhi values ko loop me chalayega.
  const handleLogsSnapshot = useCallback((logsSnap: { val: () => Record<string, FirebaseLogEntry> | null }) => {
    const logs = logsSnap.val();
    if (!logs || typeof logs !== "object") return;

    const entries = Object.entries(logs) as [string, FirebaseLogEntry][];
    if (entries.length === 0) return;

    const sorted = sortLogEntries(entries);
    const allEntries = sorted.map(([, entry]) => entry);
    setLoopEntries(allEntries.slice(-VIBRATION_CHART_POINTS));
  }, []);

  const handleLiveReadingSnapshot = useCallback(
    (snap: { val: () => unknown }) => {
      const live = snap.val();
      if (!live || typeof live !== "object") return;
      const data = live as {
        current?: { I1?: number; I2?: number; I3?: number };
        voltage?: { V1?: number; V2?: number; V3?: number };
        temperature?: { T1?: number; T2?: number };
        frequency?: number;
        vibration?: number;
        timestamp?: string;
      };
      setMotorData({
        current: {
          phaseA: data.current?.I1 ?? 0,
          phaseB: data.current?.I2 ?? 0,
          phaseC: data.current?.I3 ?? 0,
        },
        voltage: {
          phaseA: data.voltage?.V1 ?? 0,
          phaseB: data.voltage?.V2 ?? 0,
          phaseC: data.voltage?.V3 ?? 0,
        },
        frequency: data.frequency ?? 50,
        temperature: {
          t1: data.temperature?.T1 ?? 0,
          t2: data.temperature?.T2 ?? 0,
        },
      });
      setLastUpdated(new Date());
      const vib = data.vibration ?? 0;
      setVibrationData((prev) => {
        const next = [...prev, { time: prev.length, value: vib }];
        return next.slice(-VIBRATION_CHART_POINTS);
      });
    },
    []
  );

  const handlePredictiveSnapshot = useCallback((snap: { val: () => unknown }) => {
    const pm = snap.val();
    if (!pm || typeof pm !== "object") return;
    const data = pm as PredictiveMaintenanceData;
    if (Array.isArray(data.components)) {
      setPredictiveMaintenance(data);
    }
  }, []);

  // Frontend-only looping over existing Firebase logs:
  // agar loopEntries me values hain to unhe 5s ke interval se cycle karte hain.
  useEffect(() => {
    if (!loopEntries || loopEntries.length === 0) return;

    // Seed: latest history ko waveform me dikhado (max 500 points), lekin
    // consecutive points ka farq chhota rakhen.
    const seeded = loopEntries.slice(-VIBRATION_CHART_POINTS);
    const initialVib: VibrationDataPoint[] = [];
    seeded.forEach((entry, idx) => {
      const raw = entry.vibration ?? 0;
      if (idx === 0) {
        initialVib.push({ time: 0, value: mapDisplayVibration(raw) });
      } else {
        const prev = initialVib[initialVib.length - 1].value;
        const val = cappedStep(prev, raw, 0.25); // max 0.25 ka step
        initialVib.push({ time: idx, value: val });
      }
    });
    setVibrationData(initialVib);
    const lastEntry = seeded[seeded.length - 1];
    setMotorData(parseLogEntry(lastEntry));
    setLastUpdated(new Date());

    let index = loopEntries.length - 1;
    const id = window.setInterval(() => {
      index = (index + 1) % loopEntries.length;
      const entry = loopEntries[index];
      setMotorData((prev) => {
        const target = parseLogEntry(entry);
        // Motor parameters ko bhi thoda smooth rakhen (small lerp).
        return prev ? lerpMotorData(prev, target, 0.2) : target;
      });
      setLastUpdated(new Date());
      setVibrationData((prev) => {
        const raw = entry.vibration ?? 0;
        const lastVal = prev.length > 0 ? prev[prev.length - 1].value : mapDisplayVibration(raw);
        const val = cappedStep(lastVal, raw, 0.25);
        const next = [...prev, { time: prev.length, value: val }];
        return next.slice(-VIBRATION_CHART_POINTS);
      });
    }, 5000); // 5 sec ke hisaab se gradual update

    return () => window.clearInterval(id);
  }, [loopEntries]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log(
      "%c[Firebase] Connecting to motor01...",
      "color: #3b82f6; font-weight: bold",
      "Run 'python live_updater.py' for real-time updates every 20s"
    );

    const logsRef = ref(db, `${MOTOR_REF}/logs`);
    const pmRef = ref(db, `${MOTOR_REF}/predictive_maintenance`);

    const unsubscribeLogs = onValue(
      logsRef,
      (snap) => {
        setLoading(false);
        handleLogsSnapshot(snap);
      },
      (err) => {
        setLoading(false);
        setError(err?.message ?? "Failed to load motor logs");
        console.error(
          "%c[Firebase] Connection error",
          "color: #ef4444; font-weight: bold",
          err?.message ?? err
        );
      }
    );

    const unsubscribePm = onValue(pmRef, (snap) => {
      const val = snap.val();
      if (val != null) handlePredictiveSnapshot(snap);
    });

    return () => {
      unsubscribeLogs();
      unsubscribePm();
    };
  }, [handleLogsSnapshot, handlePredictiveSnapshot]);

  return {
    motorData,
    vibrationData,
    predictiveMaintenance,
    loading,
    error,
    lastUpdated,
  };
}
