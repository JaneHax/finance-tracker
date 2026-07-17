"use client";

import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Settings,
  PlusCircle,
  Table2,
  LogOut,
} from "lucide-react";
import { useFinance } from "@/context/FinanceContext";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "transactions", label: "Transaksi", Icon: ArrowLeftRight },
  { id: "reports", label: "Laporan", Icon: BarChart3 },
  { id: "settings", label: "Pengaturan", Icon: Settings },
];

export default function Sidebar({
  activePage,
  onNavigate,
  onAddTransaction,
  onOpenSpreadsheet,
  onLogout,
  sidebarOpen,
  setSidebarOpen,
}) {
  const { state } = useFinance();
  const user = state?.user;

  return (
    <>
      <aside
        className={`sidebar-desktop fixed left-0 top-0 bottom-0 w-64 glass-strong p-5 flex flex-col z-40 ${
          sidebarOpen ? "sidebar-mobile-open" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 mb-8 px-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(139,92,246,0.2))",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path
                d="M6 22L12 14L18 18L26 8"
                stroke="url(#sidegrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="26" cy="8" r="2.5" fill="#34D399" />
              <defs>
                <linearGradient id="sidegrad" x1="6" y1="22" x2="26" y2="8">
                  <stop stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">
              Finance Tracker
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              v2.4 Premium
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <div
            className="text-[10px] uppercase tracking-wider font-semibold mb-2 px-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Menu Utama
          </div>
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <a
              key={id}
              className={`nav-item ${activePage === id ? "active" : ""}`}
              onClick={() => onNavigate(id)}
            >
              <Icon className="nav-icon w-4 h-4" />
              <span>{label}</span>
            </a>
          ))}

          <div
            className="text-[10px] uppercase tracking-wider font-semibold mb-2 mt-6 px-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Quick Actions
          </div>
          <a className="nav-item" onClick={onAddTransaction}>
            <PlusCircle className="nav-icon w-4 h-4" />
            <span>Tambah Transaksi</span>
          </a>
          <a className="nav-item" onClick={onOpenSpreadsheet}>
            <Table2 className="nav-icon w-4 h-4" />
            <span>Sync Spreadsheet</span>
          </a>
        </nav>

        <div className="glass rounded-xl p-3 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium">Tersinkron Cloud</span>
          </div>
          <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            Data tersimpan real-time
          </p>
        </div>

        <div
          className="flex items-center gap-3 mt-4 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition"
          onClick={onLogout}
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              className="w-9 h-9 rounded-full object-cover"
              alt="avatar"
            />
          ) : (
            <div className="w-9 h-9 rounded-full gradient-emerald flex items-center justify-center text-white font-semibold text-sm">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {user?.name || "User"}
            </div>
            <div className="text-[11px] truncate" style={{ color: "var(--text-tertiary)" }}>
              {user?.email}
            </div>
          </div>
          <LogOut className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
