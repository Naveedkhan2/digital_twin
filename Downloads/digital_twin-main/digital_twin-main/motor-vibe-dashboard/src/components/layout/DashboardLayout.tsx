
// import React from "react";

// interface DashboardLayoutProps {
//   children: React.ReactNode;
//   title: string;
// }

// export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
//   return (
//     // <div className="min-h-screen bg-dashboard-dark-bg text-white">
//     //   <header className="border-b border-muted p-4">
//     //     <div className="container mx-auto flex items-center justify-between">
//     //       <h1 className="text-2xl font-bold text-white flex items-center gap-2">
//     //         <span className="text-primary">Epsilon AI</span>Motor Monitoring System
//     //       </h1>
//     <div className="min-h-screen bg-company-gradient text-white">
//   <header className="border-b border-company-light p-4">
//     <div className="container mx-auto flex items-center justify-between">
//       <h1 className="text-2xl font-bold text-white flex items-center gap-2">
//         <span className="text-company-light">Epsilon AI</span> Motor Monitoring System
//       </h1>
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
//               <span className="text-sm text-green-500">System Online</span>
//             </div>
//           </div>
//         </div>
//       </header>
//       <main className="container mx-auto px-4 py-6">
//         <div className="mb-6">
//           <h2 className="text-xl font-medium text-white">{title}</h2>
//           <p className="text-muted-foreground">
//             Real-time monitoring and analytics
//           </p>
//         </div>
//         {children}
//       </main>
//     </div>
//   );
// };

import React from "react";
import { HamburgerMenu } from "@/components/HamburgerMenu";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated?: Date | null;
}

export const DashboardLayout = ({ children, title, lastUpdated }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-company-gradient text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-company-light/50 p-4 bg-[#1a2b4b]">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <HamburgerMenu />
            <h1 className="text-2xl sm:text-3xl font-bold text-white text-center sm:text-left leading-tight">
              <span className="text-company-light">Epsilon</span>{" "}
              <span className="text-white/90">AI Motor Monitoring System</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-white/70">Real-time monitoring and analytics</p>
        </div>
        {children}
      </main>
    </div>
  );
};
