
import React from "react";
import { Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemperatureMetricProps {
  title: string;
  value: number;
  unit: string;
  warningThreshold: number;
  criticalThreshold: number;
}

export function TemperatureMetric({
  title,
  value,
  unit,
  warningThreshold,
  criticalThreshold,
}: TemperatureMetricProps) {
  const getStateColor = () => {
    if (value >= criticalThreshold) return "text-dashboard-accent-red";
    if (value >= warningThreshold) return "text-orange-500";
    if (value >= warningThreshold * 0.9) return "text-yellow-400";
    return "text-green-500";
  };

  const getAnimation = () => {
    if (value >= criticalThreshold) return "animate-pulse";
    return "";
  };

  return (
    <div className="flex items-center p-2">
      <div className="mr-3">
        <Thermometer className={cn("h-8 w-8", getStateColor())} />
      </div>
      <div>
        <h3 className="text-sm text-muted-foreground">{title}</h3>
        <div className="flex items-baseline">
          <span className={cn("text-2xl font-bold", getStateColor(), getAnimation())}>
            {value}
          </span>
          <span className="ml-1 text-sm text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  );
}
