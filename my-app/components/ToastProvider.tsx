"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  show: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Global event bus so toast can be called outside React components too
let globalToastHandler: ((type: ToastType, message: string, title?: string, duration?: number) => void) | null = null;

export const toast = {
  success: (message: string, title: string = "Success", duration: number = 4000) => {
    if (globalToastHandler) globalToastHandler("success", message, title, duration);
  },
  error: (message: string, title: string = "Failed", duration: number = 4500) => {
    if (globalToastHandler) globalToastHandler("error", message, title, duration);
  },
  warning: (message: string, title: string = "Warning", duration: number = 4000) => {
    if (globalToastHandler) globalToastHandler("warning", message, title, duration);
  },
  info: (message: string, title: string = "Notice", duration: number = 4000) => {
    if (globalToastHandler) globalToastHandler("info", message, title, duration);
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message, title, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          remove(id);
        }, duration);
      }
    },
    [remove]
  );

  const success = useCallback((msg: string, title?: string, dur?: number) => show("success", msg, title || "Success", dur), [show]);
  const error = useCallback((msg: string, title?: string, dur?: number) => show("error", msg, title || "Action Failed", dur), [show]);
  const warning = useCallback((msg: string, title?: string, dur?: number) => show("warning", msg, title || "Warning", dur), [show]);
  const info = useCallback((msg: string, title?: string, dur?: number) => show("info", msg, title || "Notice", dur), [show]);

  useEffect(() => {
    globalToastHandler = show;

    // Intercept native browser alert so any existing alert() calls become sleek popups!
    if (typeof window !== "undefined") {
      const originalAlert = window.alert;
      window.alert = (message?: any) => {
        const text = String(message ?? "");
        const lower = text.toLowerCase();
        if (
          lower.includes("fail") ||
          lower.includes("error") ||
          lower.includes("insufficient") ||
          lower.includes("invalid") ||
          lower.includes("rejected") ||
          lower.includes("wrong")
        ) {
          show("error", text, "Action Failed");
        } else if (
          lower.includes("success") ||
          lower.includes("saved") ||
          lower.includes("created") ||
          lower.includes("updated") ||
          lower.includes("deleted")
        ) {
          show("success", text, "Success");
        } else if (lower.includes("warning") || lower.includes("attention")) {
          show("warning", text, "Warning");
        } else {
          show("info", text, "Notice");
        }
      };

      return () => {
        window.alert = originalAlert;
      };
    }
  }, [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info, remove }}>
      {children}

      {/* Floating Toasts Viewport */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((t) => {
          const cfg = {
            success: {
              icon: CheckCircle2,
              iconColor: "text-emerald-500",
              bg: "bg-white/95 dark:bg-slate-900/95",
              border: "border-emerald-500/20",
              glow: "shadow-emerald-500/10",
              badgeBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
            },
            error: {
              icon: XCircle,
              iconColor: "text-rose-500",
              bg: "bg-white/95 dark:bg-slate-900/95",
              border: "border-rose-500/20",
              glow: "shadow-rose-500/10",
              badgeBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
            },
            warning: {
              icon: AlertTriangle,
              iconColor: "text-amber-500",
              bg: "bg-white/95 dark:bg-slate-900/95",
              border: "border-amber-500/20",
              glow: "shadow-amber-500/10",
              badgeBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
            },
            info: {
              icon: Info,
              iconColor: "text-blue-500",
              bg: "bg-white/95 dark:bg-slate-900/95",
              border: "border-blue-500/20",
              glow: "shadow-blue-500/10",
              badgeBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
            },
          }[t.type];

          const IconComponent = cfg.icon;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-md border ${cfg.bg} ${cfg.border} ${cfg.glow} animate-in fade-in slide-in-from-top-3 duration-200 transition-all`}
              style={{
                boxShadow: "0 12px 30px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.08)",
              }}
            >
              <div className={`p-2 rounded-xl ${cfg.badgeBg} shrink-0 mt-0.5`}>
                <IconComponent size={18} className={cfg.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                {t.title && (
                  <p className="text-xs font-bold text-text-primary tracking-wide mb-0.5">
                    {t.title}
                  </p>
                )}
                <p className="text-xs text-text-secondary leading-relaxed break-words font-medium">
                  {t.message}
                </p>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return toast;
  }
  return ctx;
}

export default ToastProvider;
