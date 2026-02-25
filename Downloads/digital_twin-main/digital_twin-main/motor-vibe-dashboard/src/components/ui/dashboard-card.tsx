
// import React from "react";
// import { Card } from "@/components/ui/card";
// import { cn } from "@/lib/utils";

// interface DashboardCardProps {
//   title: string;
//   children: React.ReactNode;
//   className?: string;
// }

// export function DashboardCard({
//   title,
//   children,
//   className,
// }: DashboardCardProps) {
//   return (
//     <Card className={cn("overflow-hidden bg-dashboard-card-bg border-muted", className)}>
//       <div className="border-b border-muted p-4">
//         <h3 className="font-medium text-white">{title}</h3>
//       </div>
//       <div className="p-4">{children}</div>
//     </Card>
//   );
// }


import React from "react";
import { Card } from "@/components/ui/card"; // ✅ This import is essential
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({ title, children, className }: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden bg-dashboard-card-bg border border-dashboard-border-strong shadow-md rounded-md transition-all duration-300 hover:shadow-lg hover:border-white/40",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-dashboard-border-light p-3 sm:p-4">
        <h3 className="text-lg sm:text-xl font-semibold text-white">{title}</h3>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">{children}</div>
    </Card>
  );
}
