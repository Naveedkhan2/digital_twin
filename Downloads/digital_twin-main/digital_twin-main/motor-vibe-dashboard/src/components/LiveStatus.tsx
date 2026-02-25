import React, { useState, useEffect } from "react";

interface LiveStatusProps {
  lastUpdated?: Date | null;
}

export function LiveStatus({ lastUpdated }: LiveStatusProps) {
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => {
    if (!lastUpdated) {
      setSecondsAgo(null);
      return;
    }
    const tick = () => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const isStale = secondsAgo != null && secondsAgo > 30;

  return (
    <div className="flex flex-col items-end gap-1">
      {lastUpdated && (
        <span className={`text-xs ${isStale ? "text-amber-400" : "text-white/60"}`}>
          Last updated: {lastUpdated.toLocaleTimeString()}
          {secondsAgo != null && (
            <span className="ml-1">({secondsAgo}s ago)</span>
          )}
        </span>
      )}
      {isStale && (
        <span className="text-xs text-amber-400 font-medium">
          No updates — run: python motor_backend/live_updater.py
        </span>
      )}
      <div className="flex items-center space-x-2">
        <div
          className={`h-3 w-3 rounded-full animate-pulse ${
            isStale ? "bg-amber-500" : "bg-green-500"
          }`}
        />
        <span className={`text-sm ${isStale ? "text-amber-400" : "text-green-400"}`}>
          {isStale ? "Waiting for updates" : "Live (20s)"}
        </span>
      </div>
    </div>
  );
}
