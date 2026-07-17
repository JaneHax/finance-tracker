"use client";

import { Menu, Search, Calendar, Bell, Plus } from "lucide-react";
import { MONTH_SHORT } from "@/lib/utils";

export default function Header({ onMenu, onAddTransaction, onSearch, searchValue, showToast }) {
  const now = new Date();
  const dateStr = `${now.getDate()} ${MONTH_SHORT[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-white/5 px-5 py-3.5 flex items-center gap-4">
      <button className="lg:hidden btn-ghost !p-2" onClick={onMenu}>
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1 max-w-md relative">
        <Search
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-tertiary)" }}
        />
        <input
          id="searchInput"
          type="text"
          className="input-field !pl-10 !py-2.5"
          placeholder="Cari transaksi..."
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
        />
        <kbd
          className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded border border-white/10"
          style={{ color: "var(--text-tertiary)" }}
        >
          Ctrl+K
        </kbd>
      </div>
      <div className="hidden md:flex items-center gap-2 text-xs px-3 py-2 rounded-lg glass">
        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
        <span>{dateStr}</span>
      </div>
      <button
        className="btn-ghost !p-2.5 relative"
        onClick={() => showToast?.("Belum ada notifikasi", "info")}
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
      </button>
      <button onClick={onAddTransaction} className="btn-primary">
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Tambah</span>
      </button>
    </header>
  );
}
