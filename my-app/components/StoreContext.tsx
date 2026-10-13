"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// ─── Context Shape ──────────────────────────────────────────────
type StoreContextValue = {
  /** The currently active store ID (null = not yet loaded) */
  activeStoreId: string | null;
  /** Call this to switch stores — updates state + localStorage */
  setActiveStore: (id: string) => void;
};

const StoreContext = createContext<StoreContextValue>({
  activeStoreId: null,
  setActiveStore: () => {},
});

// ─── Provider ───────────────────────────────────────────────────
export function StoreProvider({ children }: { children: ReactNode }) {
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const stored = localStorage.getItem("activeStoreId");
    if (stored) setActiveStoreId(stored);
  }, []);

  const setActiveStore = useCallback((id: string) => {
    localStorage.setItem("activeStoreId", id);
    setActiveStoreId(id);
  }, []);

  return (
    <StoreContext.Provider value={{ activeStoreId, setActiveStore }}>
      {children}
    </StoreContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────
export function useStore() {
  return useContext(StoreContext);
}
