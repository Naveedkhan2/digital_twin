/**
 * Real-time Motor Data Hook
 * Listens to Firebase Realtime Database for live motor parameters
 */
import { useState, useEffect, useCallback } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase/config";
import type {
  MotorData,
  VibrationDataPoint,
  PredictiveMaintenanceData,
  FirebaseLogEntry,
} from "@/types/motor";

const MOTOR_REF = "motor01";
const VIBRATION_CHART_POINTS = 50;

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

export function useMotorData() {
  const [motorData, setMotorData] = useState<MotorData | null>(null);
  const [vibrationData, setVibrationData] = useState<VibrationDataPoint[]>([]);
  const [predictiveMaintenance, setPredictiveMaintenance] =
    useState<PredictiveMaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loopEntries, setLoopEntries] = useState<FirebaseLogEntry[]>([]);

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

  // Loop through all available log entries on the client so that
  // the dashboard and 3D model both replay the same 500-point history.
  useEffect(() => {
    if (!loopEntries || loopEntries.length === 0) return;

    let index = 0;

    const applyEntry = (entry: FirebaseLogEntry) => {
      setMotorData(parseLogEntry(entry));
      setLastUpdated(new Date());
      setVibrationData((prev) => {
        const rawVib = entry.vibration ?? 0;
        const lastValue = prev.length > 0 ? prev[prev.length - 1].value : rawVib;
        const alpha = 0.3; // smoothing factor – smaller alpha => smoother, fewer spikes
        const smoothed = lastValue + (rawVib - lastValue) * alpha;
        const next = [...prev, { time: prev.length, value: Number(smoothed.toFixed(2)) }];
        return next.slice(-VIBRATION_CHART_POINTS);
      });
    };

    applyEntry(loopEntries[index]);

    const id = window.setInterval(() => {
      index = (index + 1) % loopEntries.length;
      applyEntry(loopEntries[index]);
    }, 15000);

    return () => {
      window.clearInterval(id);
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
