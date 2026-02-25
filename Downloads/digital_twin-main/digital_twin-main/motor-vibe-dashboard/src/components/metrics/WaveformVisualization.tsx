
// import React, { useEffect, useState } from "react";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
// import { AudioWaveform } from "lucide-react";

// interface WaveformVisualizationProps {
//   data?: { time: number; value: number }[];
//   color?: string;
//   autoGenerate?: boolean;
// }

// export function WaveformVisualization({
//   data: initialData,
//   color = "#1EAEDB",
//   autoGenerate = true,
// }: WaveformVisualizationProps) {
//   const [data, setData] = useState(initialData || generateWaveformData(50));

//   function generateWaveformData(points: number) {
//     const newData = [];
//     for (let i = 0; i < points; i++) {
//       // Generate a baseline sine wave
//       let value = Math.sin(i / 3) * 5;
//       // Add some variance
//       value += (Math.random() - 0.5) * 3;
      
//       newData.push({
//         time: i,
//         value: Math.round(value * 100) / 100,
//       });
//     }
//     return newData;
//   }

//   useEffect(() => {
//     if (!autoGenerate) return;

//     const interval = setInterval(() => {
//       setData((prevData) => {
//         const newData = [...prevData.slice(1), { 
//           time: prevData[prevData.length - 1].time + 1,
//           value: Math.sin(prevData[prevData.length - 1].time / 3) * 5 + (Math.random() - 0.5) * 3
//         }];
//         return newData;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [autoGenerate]);

//   return (
//     <div className="p-2">
//       <div className="flex items-center space-x-2 mb-4">
//         <AudioWaveform className="text-dashboard-accent-blue h-5 w-5" />
//         <h3 className="text-sm font-medium">Real-Time Vibration</h3>
//       </div>
//       <div className="h-[240px]">
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart
//             data={data}
//             margin={{
//               top: 10,
//               right: 10,
//               left: 0,
//               bottom: 0,
//             }}
//           >
//             <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
//             <XAxis dataKey="time" stroke="#666" />
//             <YAxis stroke="#666" />
//             <Tooltip 
//               contentStyle={{ backgroundColor: "#252D3C", borderColor: "#333", color: "#fff" }}
//               labelStyle={{ color: "#fff" }}
//             />
//             <Line
//               type="monotone"
//               dataKey="value"
//               stroke={color}
//               strokeWidth={2}
//               dot={false}
//               activeDot={{ r: 4 }}
//               isAnimationActive={false}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { AudioWaveform } from "lucide-react";

interface WaveformVisualizationProps {
  data?: { time: number; value: number }[];
  color?: string;
  autoGenerate?: boolean;
}

// Custom tooltip: sirf value center me dikhayenge, upar wala index (4, 6, ...) hata denge.
function VibrationTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const v = payload[0]?.value;
  if (typeof v !== "number") return null;

  return (
    <div
      style={{
        backgroundColor: "#252D3C",
        border: "1px solid #333",
        color: "#fff",
        padding: "4px 8px",
        borderRadius: 4,
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 10, opacity: 0.8 }}>Vibration</div>
      <div style={{ fontSize: 12, fontWeight: 600 }}>{v.toFixed(2)}</div>
    </div>
  );
}

export function WaveformVisualization({
  data: initialData,
  color = "#1EAEDB",
  autoGenerate = true,
}: WaveformVisualizationProps) {
  function generateWaveformData(points: number) {
    const newData = [];
    for (let i = 0; i < points; i++) {
      let value = Math.sin(i / 3) * 5 + (Math.random() - 0.5) * 3;
      newData.push({ time: i, value: Math.round(value * 100) / 100 });
    }
    return newData;
  }

  const [fallbackData, setFallbackData] = useState(generateWaveformData(50));
  const data = initialData?.length ? initialData : fallbackData;

  useEffect(() => {
    if (!autoGenerate || initialData?.length) return;

    const interval = setInterval(() => {
      setFallbackData((prevData) => {
        const newData = [...prevData.slice(1), {
          time: prevData[prevData.length - 1].time + 1,
          value: Math.sin(prevData[prevData.length - 1].time / 3) * 5 + (Math.random() - 0.5) * 3
        }];
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoGenerate, initialData?.length]);

  return (
    <div className="p-2">
      <div className="flex items-center space-x-2 mb-2 sm:mb-4">
        <AudioWaveform className="text-dashboard-accent-blue h-4 w-4 sm:h-5 sm:w-5" />
        <h3 className="text-xs sm:text-sm font-medium">Real-Time Vibration</h3>
      </div>
      <div className="h-[180px] sm:h-[240px] md:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            {/* Neeche X-axis ki line rehne di, sirf numbers hide kiye */}
            <XAxis dataKey="time" stroke="#666" tick={false} />
            <YAxis stroke="#666" />
            <Tooltip content={<VibrationTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
