"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useTheme } from "@/components/ThemeProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === "true");
    }
    setMounted(true);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  if (!mounted) return null;

  const isSaas = theme === "saas";

  return (
    <div
      className={`h-screen w-full overflow-hidden ${isSaas ? "bg-transparent" : "bg-background"
        }`}
    >
      <div className="flex h-full w-full overflow-hidden">
        <div className="h-full flex-shrink-0">
          <Sidebar
            collapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header toggleSidebar={handleToggleSidebar} />

          <main className="flex-1 min-w-0 overflow-y-auto px-6 py-8 sm:px-8 text-foreground">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}