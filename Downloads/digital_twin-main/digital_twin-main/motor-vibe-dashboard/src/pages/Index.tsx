import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { GaugeMetric } from "@/components/metrics/GaugeMetric";
import { TemperatureMetric } from "@/components/metrics/TemperatureMetric";
import { WaveformVisualization } from "@/components/metrics/WaveformVisualization";
import { PredictiveMaintenance } from "@/components/metrics/PredictiveMaintenance";
import { useMotorData } from "@/hooks/useMotorData";
import { ArrowUp, ArrowDown, Gauge } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const { motorData, vibrationData, predictiveMaintenance, loading, error, lastUpdated } = useMotorData();
  const secondsSinceUpdate = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    : null;
  const isStale = secondsSinceUpdate != null && secondsSinceUpdate > 30;

  if (loading) {
    return (
      <DashboardLayout title="Motor Monitoring System">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading data...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Motor Monitoring System">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-lg text-dashboard-accent-red">Error loading data</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <div className="text-xs text-muted-foreground">
            Ensure Firebase config is set in .env and motor01/logs exists in the database.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!motorData) {
    return (
      <DashboardLayout title="Motor Monitoring System">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-lg text-muted-foreground">Waiting for motor data</div>
          <div className="text-sm text-muted-foreground">
            Run the Python backend to populate motor01/logs, or add data to Firebase.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Motor Monitoring System" lastUpdated={lastUpdated}>
      {isStale && (
        <div className="mb-4 mx-4 sm:mx-6 lg:mx-8 p-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm">
          <strong>Values not updating?</strong> Run the live updater in a separate terminal:{" "}
          <code className="bg-black/30 px-2 py-0.5 rounded">cd motor_backend</code> then <code className="bg-black/30 px-2 py-0.5 rounded">python live_updater.py</code>
        </div>
      )}
      {/* This container ensures perfect alignment with the cards */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* First Row - Current, Voltage, System Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <DashboardCard title="Current Parameters (A)">
            <div className="space-y-4">
                <GaugeMetric
                  title="Phase A Current"
                  value={motorData.current.phaseA}
                  unit="A"
                  min={0}
                  max={100}
                  color="bg-dashboard-accent-blue"
                  icon={<ArrowUp className="h-5 w-5" />}
                  warning={{ min: 60, max: 85 }}
                />
                <GaugeMetric
                  title="Phase B Current"
                  value={motorData.current.phaseB}
                  unit="A"
                  min={0}
                  max={100}
                  color="bg-dashboard-accent-purple"
                  icon={<ArrowUp className="h-5 w-5" />}
                  warning={{ min: 60, max: 85 }}
                />
                <GaugeMetric
                  title="Phase C Current"
                  value={motorData.current.phaseC}
                  unit="A"
                  min={0}
                  max={100}
                  color="bg-dashboard-accent-green"
                  icon={<ArrowUp className="h-5 w-5" />}
                  warning={{ min: 60, max: 85 }}
                />
              </div>
          </DashboardCard>

          <DashboardCard title="Voltage Parameters (V)">
            <div className="space-y-4">
                <GaugeMetric
                  title="Phase A Voltage"
                  value={motorData.voltage.phaseA}
                  unit="V"
                  min={340}
                  max={420}
                  color="bg-dashboard-accent-blue"
                  icon={<ArrowDown className="h-5 w-5" />}
                  warning={{ min: 370, max: 400 }}
                />
                <GaugeMetric
                  title="Phase B Voltage"
                  value={motorData.voltage.phaseB}
                  unit="V"
                  min={340}
                  max={420}
                  color="bg-dashboard-accent-purple"
                  icon={<ArrowDown className="h-5 w-5" />}
                  warning={{ min: 370, max: 400 }}
                />
                <GaugeMetric
                  title="Phase C Voltage"
                  value={motorData.voltage.phaseC}
                  unit="V"
                  min={340}
                  max={420}
                  color="bg-dashboard-accent-green"
                  icon={<ArrowDown className="h-5 w-5" />}
                  warning={{ min: 370, max: 400 }}
                />
              </div>
          </DashboardCard>

          <DashboardCard title="System Parameters">
            <div className="space-y-5">
                <div>
                  <div className="mb-2 text-sm text-muted-foreground">Frequency</div>
                  <div className="flex items-center space-x-2">
                    <Gauge className="h-6 w-6 text-dashboard-accent-blue" />
                    <span className="text-2xl font-bold">{motorData.frequency.toFixed(1)}</span>
                    <span className="text-muted-foreground">Hz</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="mb-2 text-sm text-muted-foreground">Temperature</div>
                  <div className="grid grid-cols-2 gap-4">
                    <TemperatureMetric
                      title="T1"
                      value={Math.round(motorData.temperature.t1 * 10) / 10}
                      unit="°C"
                      warningThreshold={75}
                      criticalThreshold={85}
                    />
                    <TemperatureMetric
                      title="T2"
                      value={Math.round(motorData.temperature.t2 * 10) / 10}
                      unit="°C"
                      warningThreshold={75}
                      criticalThreshold={85}
                    />
                  </div>
                </div>
              </div>
          </DashboardCard>
        </div>

        {/* Second Row - Vibration & Predictive Maintenance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <DashboardCard title="Vibration Analysis">
            <WaveformVisualization
              data={vibrationData}
              color="#8B5CF6"
              autoGenerate={vibrationData.length === 0}
            />
          </DashboardCard>

          <DashboardCard title="Predictive Maintenance Analysis">
            <PredictiveMaintenance
              motorData={motorData}
              predictiveMaintenance={predictiveMaintenance}
            />
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
