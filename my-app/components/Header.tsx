"use client";

import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  Menu,
  Palette,
  Building2,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

function getPageTitle(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0];

  if (!segment) return "Dashboard";

  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Header({
  toggleSidebar,
}: {
  toggleSidebar?: () => void;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex items-center justify-between border-b border-white/20 bg-transparent px-6 py-4 h-16 shrink-0 sticky top-0 z-20 backdrop-blur-sm">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {toggleSidebar && (
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-white/20 hover:text-slate-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          {getPageTitle(pathname)}
        </h2>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

          <input
            type="text"
            placeholder="Search..."
            className="
              h-10
              w-72
              rounded-full
              border border-white/40
              bg-white/30
              backdrop-blur-xl
              pl-10
              pr-4
              text-sm
              text-slate-700
              placeholder:text-slate-400
              outline-none
              focus:border-purple-400
              focus:ring-2
              focus:ring-purple-200
              transition-all
            "
          />
        </div>

        {/* Theme Switcher Toggle */}
        <button
          onClick={() => setTheme(theme === "saas" ? "enterprise" : "saas")}
          title={`Switch to ${theme === "saas" ? "Enterprise" : "SaaS"} theme`}
          className={`
            w-10 h-10 rounded-xl
            border border-white/30
            backdrop-blur-xl
            flex items-center justify-center
            transition-all duration-300
            ${theme === "saas"
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-600"
              : "bg-slate-800 text-white shadow-lg shadow-slate-900/30 hover:bg-slate-700"
            }
          `}
        >
          {theme === "saas" ? (
            <Palette size={18} className="transition-transform duration-300 hover:rotate-12" />
          ) : (
            <Building2 size={18} className="transition-transform duration-300 hover:scale-105" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="
            relative
            flex items-center justify-center
            w-10 h-10
            rounded-full
            border border-white/30
            bg-white/25
            backdrop-blur-xl
            hover:bg-white/40
            transition-all
            group
          "
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5 text-slate-600 group-hover:text-purple-600 transition-colors" />

          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-500 border border-white" />
        </button>

        {/* User Avatar */}
        <div
          className="
            w-10 h-10
            rounded-full
            bg-gradient-to-br
            from-purple-500
            to-purple-600
            flex items-center justify-center
            text-white
            text-xs
            font-bold
            select-none
            shadow-lg shadow-purple-500/20
          "
        >
          AD
        </div>
      </div>
    </header>
  );
}