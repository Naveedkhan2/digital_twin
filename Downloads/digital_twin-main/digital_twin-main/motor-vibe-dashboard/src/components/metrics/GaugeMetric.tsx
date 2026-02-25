
import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Gauge } from "lucide-react";

interface GaugeMetricProps {
  title: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  color?: string;
  icon?: React.ReactNode;
  warning?: { min: number; max: number };
}

export function GaugeMetric({
  title,
  value,
  unit,
  min,
  max,
  color = "bg-primary",
  icon = <Gauge className="h-5 w-5" />,
  warning,
}: GaugeMetricProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  // Determine health condition based on value
  const getHealthColor = () => {
    if (!warning) return color;
    
    const range = max - min;
    const warningMin = warning.min;
    const warningMax = warning.max;
    
    // Critical zone (red) - outside warning ranges by more than 20%
    if (value < warningMin - (range * 0.2) || value > warningMax + (range * 0.2)) {
      return "bg-dashboard-accent-red";
    }
    // Warning zone (orange) - outside warning ranges by up to 20%
    else if (value < warningMin || value > warningMax) {
      return "bg-orange-500";
    }
    // Slightly above normal (yellow) - within 10% of warning boundary
    else if (value < warningMin + (range * 0.1) || value > warningMax - (range * 0.1)) {
      return "bg-yellow-400";
    }
    // Normal condition (green)
    else {
      return "bg-green-500";
    }
  };
  
  const healthColor = getHealthColor();
  const isWarning = healthColor === "bg-orange-500" || healthColor === "bg-dashboard-accent-red";
  const isCritical = healthColor === "bg-dashboard-accent-red";

  return (
    <div className="flex flex-col space-y-2 p-1 sm:p-2">
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2 text-muted-foreground">
      {icon}
      <span className="text-xs sm:text-sm">{title}</span>
        </div>
        <div className={cn("text-lg font-medium", 
          isCritical ? "text-dashboard-accent-red animate-pulse" : 
          isWarning ? "text-orange-500" : 
          "text-white")}>
          {value.toFixed(1)}
          <span className="text-sm ml-1 text-muted-foreground">{unit}</span>
        </div>
      </div>
      <Progress value={percentage} className="h-2 w-full bg-muted" indicatorClassName={healthColor} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
