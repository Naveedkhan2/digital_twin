/**
 * Type definitions for Epsilon AI Motor Monitoring System
 * Maps to Firebase Realtime Database structure
 */

export interface MotorData {
  current: {
    phaseA: number;
    phaseB: number;
    phaseC: number;
  };
  voltage: {
    phaseA: number;
    phaseB: number;
    phaseC: number;
  };
  frequency: number;
  temperature: {
    t1: number;
    t2: number;
  };
}

export interface VibrationDataPoint {
  time: number;
  value: number;
}

export type MaintenanceStatus = "healthy" | "warning" | "critical";

export interface MaintenanceComponent {
  id: string;
  component: string;
  status: MaintenanceStatus;
  remainingLifeHours: number;
  recommendation: string;
}

export interface PredictiveMaintenanceData {
  components: MaintenanceComponent[];
  lastAnalysis: string; // ISO timestamp
}

/** Raw log entry from Firebase (motor01/logs/entry_XXX) */
export interface FirebaseLogEntry {
  I1: number;
  I2: number;
  I3: number;
  V1: number;
  V2: number;
  V3: number;
  frequency: number;
  pf: number;
  T1: number;
  T2: number;
  vibration: number;
  timestamp: string;
}
