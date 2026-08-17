"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";

export type ThemeId = "saas" | "enterprise";

export type ThemeOption = {
  id: ThemeId;
  label: string;
};

const themes: ThemeOption[] = [
  { id: "saas", label: "SaaS Mode" },
  { id: "enterprise", label: "Enterprise Mode" },
];

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeOption[];
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("saas");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeId;
    if (savedTheme === "enterprise" || savedTheme === "saas") {
      setThemeState(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "saas");
    }
  }, []);

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const value = useMemo(
    () => ({ theme, setTheme, themes }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export default ThemeProvider;
