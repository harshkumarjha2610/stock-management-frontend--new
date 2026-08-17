"use client";

import { useState, useEffect } from "react";
import { Palette, Check, Moon, Sun, Monitor, Type } from "lucide-react";

type ColorTheme = "Default" | "Purple" | "Teal" | "Blue" | "Orange" | "Pink" | "Green" | "Indigo";
type FontSize = "small" | "normal" | "large" | "xlarge";

const COLOR_THEMES = [
  { name: "Default" as ColorTheme, primary: "#ef4444", bg: "bg-red-500", ring: "ring-red-500" },
  { name: "Purple" as ColorTheme, primary: "#A05AFF", bg: "bg-[#A05AFF]", ring: "ring-[#A05AFF]" },
  { name: "Teal" as ColorTheme, primary: "#1BCFB4", bg: "bg-[#1BCFB4]", ring: "ring-[#1BCFB4]" },
  { name: "Blue" as ColorTheme, primary: "#4BCBEB", bg: "bg-[#4BCBEB]", ring: "ring-[#4BCBEB]" },
  { name: "Orange" as ColorTheme, primary: "#f97316", bg: "bg-orange-500", ring: "ring-orange-500" },
  { name: "Pink" as ColorTheme, primary: "#ec4899", bg: "bg-pink-500", ring: "ring-pink-500" },
  { name: "Green" as ColorTheme, primary: "#22c55e", bg: "bg-green-500", ring: "ring-green-500" },
  { name: "Indigo" as ColorTheme, primary: "#6366f1", bg: "bg-indigo-500", ring: "ring-indigo-500" },
];

const MODE_OPTIONS = [
  { label: "Light", icon: Sun, value: "light" },
  { label: "Dark", icon: Moon, value: "dark" },
  { label: "System", icon: Monitor, value: "system" },
];

const FONT_SIZE_OPTIONS = [
  { label: "Small", value: "small" as FontSize, scale: "0.875rem", description: "Compact text for more content density" },
  { label: "Normal", value: "normal" as FontSize, scale: "1rem", description: "Standard comfortable reading size" },
  { label: "Large", value: "large" as FontSize, scale: "1.125rem", description: "Bigger text for easier reading" },
  { label: "Extra Large", value: "xlarge" as FontSize, scale: "1.25rem", description: "Maximum readability with large text" },
];

export default function SettingsPage() {
  const [activeMode, setActiveMode] = useState("light");
  const [activeColor, setActiveColor] = useState<ColorTheme>("Default");
  const [activeFontSize, setActiveFontSize] = useState<FontSize>("normal");

  useEffect(() => {
    const savedMode = localStorage.getItem("theme");
    const savedColor = localStorage.getItem("colorTheme") as ColorTheme;
    const savedFontSize = localStorage.getItem("fontSize") as FontSize;
    if (savedMode) setActiveMode(savedMode);
    if (savedColor) setActiveColor(savedColor);
    if (savedFontSize) setActiveFontSize(savedFontSize);
  }, []);

  useEffect(() => {
    // Apply saved font size on mount
    const savedFontSize = localStorage.getItem("fontSize") as FontSize;
    if (savedFontSize) {
      applyFontSize(savedFontSize);
    }
  }, []);

  const handleModeChange = (mode: string) => {
    setActiveMode(mode);
    localStorage.setItem("theme", mode);
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(mode);
    }
  };

  const handleColorChange = (colorName: ColorTheme) => {
    setActiveColor(colorName);
    localStorage.setItem("colorTheme", colorName);
    const color = COLOR_THEMES.find((c) => c.name === colorName)?.primary || "#ef4444";
    document.documentElement.style.setProperty("--primary", color);
  };

  const applyFontSize = (size: FontSize) => {
    const option = FONT_SIZE_OPTIONS.find((o) => o.value === size);
    if (option) {
      document.documentElement.style.setProperty("--font-size-base", option.scale);
      document.documentElement.style.fontSize = option.scale;
    }
  };

  const handleFontSizeChange = (size: FontSize) => {
    setActiveFontSize(size);
    localStorage.setItem("fontSize", size);
    applyFontSize(size);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-6">

      {/* ── Appearance Section ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-text-primary">Appearance</h2>
        </div>

        {/* Color Theme */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold text-text-primary">Color Theme</p>
          <div className="flex flex-wrap gap-3">
            {COLOR_THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => handleColorChange(theme.name)}
                className={`
                  relative w-12 h-12 rounded-xl ${theme.bg} 
                  transition-all duration-200 hover:scale-110
                  ${activeColor === theme.name ? `ring-2 ${theme.ring} ring-offset-2 ring-offset-surface` : "opacity-70 hover:opacity-100"}
                `}
                title={theme.name}
              >
                {activeColor === theme.name && (
                  <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold text-text-primary">Mode</p>
          <div className="grid grid-cols-3 gap-3">
            {MODE_OPTIONS.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeChange(mode.value)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                  ${activeMode === mode.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-surface text-text-muted hover:border-text-muted"
                  }
                `}
              >
                <mode.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Text & Accessibility Section ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-text-primary">Text & Accessibility</h2>
        </div>

        {/* Font Size */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">Font Size</p>
            <span className="text-xs text-text-muted px-2 py-1 rounded-md bg-surface border border-border">
              {FONT_SIZE_OPTIONS.find((o) => o.value === activeFontSize)?.label}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FONT_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFontSizeChange(option.value)}
                className={`
                  flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 text-left
                  ${activeFontSize === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface hover:border-text-muted"
                  }
                `}
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  ${activeFontSize === option.value ? "bg-primary text-white" : "bg-gray-100 text-text-muted"}
                `}>
                  <span style={{ fontSize: option.scale }} className="font-bold leading-none">A</span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${activeFontSize === option.value ? "text-primary" : "text-text-primary"}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{option.description}</p>
                </div>
                {activeFontSize === option.value && (
                  <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}