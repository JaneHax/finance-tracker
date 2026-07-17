"use client";

import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";

const config = {
  success: {
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.3)",
    Icon: CheckCircle2,
    iconColor: "#34D399",
  },
  error: {
    bg: "rgba(244, 63, 94, 0.15)",
    border: "rgba(244, 63, 94, 0.3)",
    Icon: XCircle,
    iconColor: "#FB7185",
  },
  info: {
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.3)",
    Icon: Info,
    iconColor: "#60A5FA",
  },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useFinance();

  return (
    <div className="fixed bottom-5 right-5 z-[200] space-y-2 max-w-sm">
      {toasts.map((t) => {
        const c = config[t.type] || config.info;
        const { Icon } = c;
        return (
          <div
            key={t.id}
            className="toast glass-strong rounded-xl p-3.5 flex items-center gap-3 min-w-[280px]"
            style={{ borderColor: c.border }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: c.bg }}
            >
              <Icon className="w-4 h-4" style={{ color: c.iconColor }} />
            </div>
            <div className="text-sm font-medium flex-1">{t.message}</div>
            <button
              onClick={() => dismissToast(t.id)}
              className="opacity-50 hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
