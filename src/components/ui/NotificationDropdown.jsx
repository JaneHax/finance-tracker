"use client";

import { useFinance } from "@/context/FinanceContext";
import { formatDate } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificationDropdown({ show, onClose }) {
  const { state, markAllRead } = useFinance();
  const notifications = state?.notifications || [];
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-40" onClick={onClose} />
      )}
      {show && (
        <div
          className="absolute top-full right-0 mt-2 w-80 z-50 rounded-xl border overflow-hidden"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h4 className="text-sm font-semibold">Notifikasi</h4>
            {unread > 0 && (
              <button
                onClick={() => {
                  markAllRead();
                  onClose();
                }}
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--accent)" }}
              >
                <CheckCheck className="w-3 h-3" /> Tandai dibaca
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <Bell className="w-6 h-6" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Belum ada notifikasi
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 border-b text-sm transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    background: n.read ? "transparent" : "rgba(59, 130, 246, 0.06)",
                  }}
                >
                  <div
                    className="w-2 h-2 mt-1.5 rounded-full shrink-0"
                    style={{
                      background: n.read ? "var(--text-tertiary)" : "var(--accent)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {formatDate(new Date(n.time).toISOString())}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
