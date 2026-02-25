import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PredictiveMaintenanceData } from "@/types/motor";

interface MaintenanceItem {
  component: string;
  status: "healthy" | "warning" | "critical";
  remainingLifeHours: number;
  recommendation: string;
}

interface PredictiveMaintenanceProps {
  motorData?: {
    current: { phaseA: number; phaseB: number; phaseC: number };
    temperature: { t1: number; t2: number };
  } | null;
  predictiveMaintenance?: PredictiveMaintenanceData | null;
}

export function PredictiveMaintenance({ motorData, predictiveMaintenance }: PredictiveMaintenanceProps) {
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceItem[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<Date>(new Date());

  useEffect(() => {
    if (predictiveMaintenance?.components?.length) {
      setMaintenanceData(
        predictiveMaintenance.components.map((c) => ({
          component: c.component,
          status: c.status,
          remainingLifeHours: c.remainingLifeHours,
          recommendation: c.recommendation,
        }))
      );
      if (predictiveMaintenance.lastAnalysis) {
        setLastAnalysis(new Date(predictiveMaintenance.lastAnalysis));
      }
      return;
    }

    if (!motorData) return;

    const simulatePredictiveAnalysis = () => {
      const tempStatus: "healthy" | "warning" | "critical" =
        motorData.temperature.t1 > 80
          ? "warning"
          : motorData.temperature.t1 > 70
          ? "warning"
          : "healthy";

      const tempLife =
        tempStatus === "warning"
          ? Math.round(120 - (motorData.temperature.t1 - 65) * 10)
          : Math.round(500 - (motorData.temperature.t1 - 50) * 5);

      const currents = [
        motorData.current.phaseA,
        motorData.current.phaseB,
        motorData.current.phaseC,
      ];
      const avgCurrent = currents.reduce((sum, val) => sum + val, 0) / 3;
      const maxDeviation = Math.max(...currents.map((c) => Math.abs(c - avgCurrent)));
      const imbalancePercent = (maxDeviation / avgCurrent) * 100;

      const currentStatus: "healthy" | "warning" | "critical" =
        imbalancePercent > 10
          ? "critical"
          : imbalancePercent > 5
          ? "warning"
          : "healthy";

      const currentLife =
        currentStatus === "critical"
          ? 48
          : currentStatus === "warning"
          ? 120
          : 2000;

      const vibrationStatus: "healthy" | "warning" | "critical" =
        Math.random() > 0.7 ? "warning" : "healthy";
      const vibrationLife =
        vibrationStatus === "warning"
          ? Math.round(100 + Math.random() * 100)
          : Math.round(1000 + Math.random() * 1000);

      return [
        {
          component: "Bearing Assembly",
          status: vibrationStatus,
          remainingLifeHours: vibrationLife,
          recommendation:
            vibrationStatus === "warning"
              ? "Schedule inspection within next maintenance cycle"
              : "No action needed",
        },
        {
          component: "Winding Insulation",
          status: tempStatus,
          remainingLifeHours: tempLife,
          recommendation:
            tempStatus === "warning"
              ? "Monitor temperature trends; consider inspection"
              : "No action needed",
        },
        {
          component: "Phase Balancing",
          status: currentStatus,
          remainingLifeHours: currentLife,
          recommendation:
            currentStatus === "critical"
              ? "Immediate inspection required"
              : currentStatus === "warning"
              ? "Schedule balancing within 1 week"
              : "No action needed",
        },
      ];
    };

    setMaintenanceData(simulatePredictiveAnalysis());
    setLastAnalysis(new Date());
  }, [motorData, predictiveMaintenance]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CircleCheck className="h-5 w-5 text-green-400" />;
      case "warning":
        return <CircleAlert className="h-5 w-5 text-yellow-400" />;
      case "critical":
        return <CircleAlert className="h-5 w-5 text-red-500 animate-pulse" />;
      default:
        return <CircleCheck className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTimeDisplay = (hours: number) => {
    if (hours < 24) return `${hours} hours`;
    if (hours < 168) return `${Math.round(hours / 24)} days`;
    return `${Math.round(hours / 168)} weeks`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-white/70">
          Last analysis: {lastAnalysis.toLocaleTimeString()}
        </div>
        <div className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/80 border border-white/20">
          AI-Powered Analysis
        </div>
      </div>

      {/* Maintenance Cards */}
      <div className="space-y-3">
        {maintenanceData.map((item, index) => (
          <Card
            key={index}
            className={cn(
              "p-3 sm:p-4 rounded-md bg-[#385b8a]/60 backdrop-blur border border-white/10 shadow-sm transition-all duration-300 hover:border-white/30",
              item.status === "critical"
                ? "border-l-4 border-l-red-500"
                : item.status === "warning"
                ? "border-l-4 border-l-yellow-400"
                : "border-l-4 border-l-green-400"
            )}
          >
            {/* Row layout - responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(item.status)}
                <div>
                  <h4 className="font-semibold text-white">{item.component}</h4>
                  <p className="text-xs text-white/70">
                    Est. remaining service life: {getTimeDisplay(item.remainingLifeHours)}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={cn(
                  "text-xs px-3 py-1 rounded-full font-semibold tracking-wide",
                  item.status === "critical"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : item.status === "warning"
                    ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
                    : "bg-green-500/20 text-green-400 border border-green-500/30"
                )}
              >
                {item.status.toUpperCase()}
              </div>
            </div>

            {/* Recommendation */}
            <div className="mt-2 text-sm text-white/80">
              <span className="font-medium">Recommendation:</span>{" "}
              {item.recommendation}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
