import React, { useEffect, useRef } from "react";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useMotorData } from "@/hooks/useMotorData";

export default function Motor3DView() {
  const { motorData, vibrationData } = useMotorData();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const postMotorData = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !motorData) return;

    const latestVibration =
      vibrationData.length > 0
        ? vibrationData[vibrationData.length - 1]?.value ?? null
        : null;

    iframe.contentWindow.postMessage(
      {
        type: "MOTOR_DATA",
        motorData: {
          current: motorData.current,
          voltage: motorData.voltage,
          frequency: motorData.frequency,
          temperature: motorData.temperature,
        },
        latestVibration,
      },
      "*"
    );
  };

  useEffect(() => {
    postMotorData();
  }, [motorData, vibrationData]);

  return (
    <div className="min-h-screen bg-[#1a2b4b] flex flex-col">
      <header className="flex items-center gap-3 p-4 border-b border-white/10 shrink-0">
        <HamburgerMenu />
        <h1 className="text-xl font-semibold text-white">
          3D Digital Twin
        </h1>
      </header>
      <main className="flex-1 min-h-0">
        <iframe
          ref={iframeRef}
          src="/maya_digital_model/index.html"
          title="3D Motor Model"
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 65px)" }}
          onLoad={postMotorData}
        />
      </main>
    </div>
  );
}
