"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  success: (titleOrMessage: string, message?: string) => string;
  error: (titleOrMessage: string, message?: string) => string;
  warning: (titleOrMessage: string, message?: string) => string;
  info: (titleOrMessage: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Global event bus for toast calls outside React component trees
type ToastListener = (toast: Omit<ToastItem, "id">) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  success: (titleOrMessage: string, message?: string) => {
    const title = message ? titleOrMessage : undefined;
    const body = message || titleOrMessage;
    listeners.forEach((l) => l({ type: "success", title, message: body }));
  },
  error: (titleOrMessage: string, message?: string) => {
    const title = message ? titleOrMessage : undefined;
    const body = message || titleOrMessage;
    listeners.forEach((l) => l({ type: "error", title, message: body }));
  },
  warning: (titleOrMessage: string, message?: string) => {
    const title = message ? titleOrMessage : undefined;
    const body = message || titleOrMessage;
    listeners.forEach((l) => l({ type: "warning", title, message: body }));
  },
  info: (titleOrMessage: string, message?: string) => {
    const title = message ? titleOrMessage : undefined;
    const body = message || titleOrMessage;
    listeners.forEach((l) => l({ type: "info", title, message: body }));
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastItem, "id">) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]);
      return id;
    },
    []
  );

  const success = useCallback(
    (titleOrMessage: string, message?: string) =>
      showToast({
        type: "success",
        title: message ? titleOrMessage : undefined,
        message: message || titleOrMessage,
      }),
    [showToast]
  );

  const error = useCallback(
    (titleOrMessage: string, message?: string) =>
      showToast({
        type: "error",
        title: message ? titleOrMessage : undefined,
        message: message || titleOrMessage,
      }),
    [showToast]
  );

  const warning = useCallback(
    (titleOrMessage: string, message?: string) =>
      showToast({
        type: "warning",
        title: message ? titleOrMessage : undefined,
        message: message || titleOrMessage,
      }),
    [showToast]
  );

  const info = useCallback(
    (titleOrMessage: string, message?: string) =>
      showToast({
        type: "info",
        title: message ? titleOrMessage : undefined,
        message: message || titleOrMessage,
      }),
    [showToast]
  );

  useEffect(() => {
    const handler: ToastListener = (incoming) => {
      showToast(incoming);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback to global listener if called outside provider
    return {
      toasts: [],
      showToast: (t) => {
        listeners.forEach((l) => l(t));
        return "external";
      },
      removeToast: () => {},
      success: (t, m) => {
        toast.success(t, m);
        return "external";
      },
      error: (t, m) => {
        toast.error(t, m);
        return "external";
      },
      warning: (t, m) => {
        toast.warning(t, m);
        return "external";
      },
      info: (t, m) => {
        toast.info(t, m);
        return "external";
      },
    };
  }
  return ctx;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const duration = toast.duration || 4500;

  useEffect(() => {
    if (isHovered) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isHovered, duration, onDismiss]);

  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
      accentBg: "bg-emerald-500",
      borderColor: "border-emerald-500/30",
      badgeColor: "bg-emerald-950/60 text-emerald-300 border-emerald-800/40",
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-rose-400",
      accentBg: "bg-rose-500",
      borderColor: "border-rose-500/30",
      badgeColor: "bg-rose-950/60 text-rose-300 border-rose-800/40",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-400",
      accentBg: "bg-amber-500",
      borderColor: "border-amber-500/30",
      badgeColor: "bg-amber-950/60 text-amber-300 border-amber-800/40",
    },
    info: {
      icon: Info,
      iconColor: "text-sky-400",
      accentBg: "bg-sky-500",
      borderColor: "border-sky-500/30",
      badgeColor: "bg-sky-950/60 text-sky-300 border-sky-800/40",
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-xl border bg-zinc-950/95 backdrop-blur-md p-3.5 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 flex items-start gap-3 text-zinc-100",
        config.borderColor
      )}
    >
      {/* Accent edge line */}
      <div
        className={cn("absolute left-0 top-0 bottom-0 w-1", config.accentBg)}
      />

      {/* Type Icon */}
      <div className="shrink-0 mt-0.5">
        <Icon className={cn("h-4 w-4", config.iconColor)} />
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0 pr-1 space-y-0.5">
        {toast.title && (
          <h5 className="text-xs font-semibold text-zinc-100 leading-tight">
            {toast.title}
          </h5>
        )}
        <p className="text-xs text-zinc-400 leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={onDismiss}
        aria-label="Close notification"
        className="shrink-0 -mr-1 -mt-1 p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
