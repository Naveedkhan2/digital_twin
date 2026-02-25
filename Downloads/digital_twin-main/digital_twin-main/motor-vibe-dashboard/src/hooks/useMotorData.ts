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
/** Number of points shown on vibration graph – more = longer, smoother line for demos */
const VIBRATION_CHART_POINTS = 150;

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

export function useMotorData() {
  const [motorData, setMotorData] = useState<MotorData | null>(null);
  const [vibrationData, setVibrationData] = useState<VibrationDataPoint[]>([]);
  const [predictiveMaintenance, setPredictiveMaintenance] =
    useState<PredictiveMaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loopEntries, setLoopEntries] = useState<FirebaseLogEntry[]>([]);
  const targetMotorDataRef = useRef<MotorData | null>(null);
  const targetVibrationRef = useRef<number>(0);

  const handleLogsSnapshot = useCallback((logsSnap: { val: () => Record<string, FirebaseLogEntry> | null }) => {
    const logs = logsSnap.val();
    if (!logs || typeof logs !== "object") return;

    const entries = Object.entries(logs) as [string, FirebaseLogEntry][];
    if (entries.length === 0) return;

    const sorted = sortLogEntries(entries);
    setLoopEntries(sorted.map(([, entry]) => entry));
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

  // Loop through log entries with smooth interpolation: target updates every 15s,
  // displayed values lerp toward target every 1.5s so gauges and graph move smoothly.
  const SMOOTH_MS = 1500;
  const LOOP_STEP_MS = 15000;
  const LERP_ALPHA = 0.28;

  useEffect(() => {
    if (!loopEntries || loopEntries.length === 0) return;

    let index = 0;
    const setTarget = (entry: FirebaseLogEntry) => {
      const next = parseLogEntry(entry);
      targetMotorDataRef.current = next;
      targetVibrationRef.current = entry.vibration ?? 0;
    };

    setTarget(loopEntries[0]);
    setMotorData(parseLogEntry(loopEntries[0]));
    setLastUpdated(new Date());
    setVibrationData([{ time: 0, value: loopEntries[0].vibration ?? 0 }]);

    const loopId = window.setInterval(() => {
      index = (index + 1) % loopEntries.length;
      setTarget(loopEntries[index]);
    }, LOOP_STEP_MS);

    const smoothId = window.setInterval(() => {
      const target = targetMotorDataRef.current;
      if (!target) return;
      setLastUpdated(new Date());
      setMotorData((prev) => (prev ? lerpMotorData(prev, target, LERP_ALPHA) : prev));
      setVibrationData((prev) => {
        const lastVal = prev.length > 0 ? prev[prev.length - 1].value : targetVibrationRef.current;
        const smoothed = lastVal + (targetVibrationRef.current - lastVal) * LERP_ALPHA;
        const next = [...prev, { time: prev.length, value: Math.round(smoothed * 100) / 100 }];
        return next.slice(-VIBRATION_CHART_POINTS);
      });
    }, SMOOTH_MS);

    return () => {
      window.clearInterval(loopId);
      window.clearInterval(smoothId);
    };
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
        const val = snap.val();
        if (val != null) {
          const entries = Object.keys(val as object).length;
          const hasLive = (val as Record<string, unknown>).entry_live != null;
          console.log(
            "%c[Firebase] logs update",
            "color: #22c55e; font-weight: bold",
            `(${entries} keys${hasLive ? ", entry_live ✓" : ""})`
          );
        } else {
          console.log(
            "%c[Firebase] Connected – motor01/logs is empty",
            "color: #f59e0b; font-weight: bold"
          );
        }
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
  }, [handleLogsSnapshot, handleLiveReadingSnapshot, handlePredictiveSnapshot]);

  return {
    motorData,
    vibrationData,
    predictiveMaintenance,
    loading,
    error,
    lastUpdated,
  };
}
