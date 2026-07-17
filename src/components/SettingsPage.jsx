"use client";

import { useState } from "react";
import {
  User,
  Wallet,
  Tags,
  Table2,
  SlidersHorizontal,
  Edit3,
  Plus,
  Link as LinkIcon,
  X,
  Trash2,
} from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/lib/utils";
import { FUND_TYPE_LABELS } from "@/lib/defaults";

const ICON_MAP = {
  landmark: Wallet,
  smartphone: Wallet,
  bitcoin: Wallet,
  wallet: Wallet,
  "trending-up": Wallet,
  "credit-card": Wallet,
  "heart-pulse": Wallet,
  utensils: Wallet,
  car: Wallet,
  "gamepad-2": Wallet,
  "shopping-cart": Wallet,
  receipt: Wallet,
  briefcase: Wallet,
  laptop: Wallet,
  gift: Wallet,
  tag: Wallet,
};

function FsIcon({ name, ...props }) {
  const Cmp = ICON_MAP[name] || Wallet;
  return <Cmp {...props} />;
}

export default function SettingsPage({
  onEditProfile,
  onAddFundSource,
  onEditFundSource,
  onAddCategory,
  onOpenSpreadsheet,
}) {
  const {
    state,
    deleteFundSource,
    deleteCategory,
    toggleAutoSync,
    disconnectSpreadsheet,
  } = useFinance();
  const user = state.user;

  return (
    <div>
      <div className="mb-6 animate-fadeIn">
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          Kelola akun, sumber dana, kategori, dan integrasi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile */}
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold">Profil</h3>
          </div>
          <div className="flex flex-col items-center text-center mb-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                className="w-20 h-20 rounded-2xl object-cover mb-3"
                alt="avatar"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl gradient-emerald flex items-center justify-center text-white font-bold text-2xl mb-3">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="font-semibold">{user?.name}</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={onEditProfile}
            className="btn-ghost w-full justify-center"
          >
            <Edit3 className="w-4 h-4" /> Edit Nama Tampilan
          </button>
        </div>

        {/* Fund Sources */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-purple-400" />
              <h3 className="font-semibold">Sumber Dana</h3>
            </div>
            <button
              onClick={onAddFundSource}
              className="btn-primary !py-2 !px-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>
          <div className="space-y-2">
            {state.fundSources.map((fs) => (
              <div key={fs.id} className="flex items-center gap-3 p-3 rounded-xl glass">
                <div className="icon-pill" style={{ background: `${fs.color}15` }}>
                  <FsIcon name={fs.icon} className="w-4 h-4" style={{ color: fs.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{fs.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {FUND_TYPE_LABELS[fs.type]} • {formatCurrency(fs.balance)}
                  </div>
                </div>
                <button
                  onClick={() => onEditFundSource(fs.id)}
                  className="btn-ghost !p-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteFundSource(fs.id)}
                  className="btn-ghost !p-2 hover:!bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tags className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold">Kategori</h3>
            </div>
            <button
              onClick={onAddCategory}
              className="btn-primary !py-2 !px-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div
                className="text-xs font-medium mb-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                PEMASUKAN
              </div>
              <div className="space-y-1.5">
                {state.categories.income.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg glass">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${c.color}20` }}
                    >
                      <FsIcon name={c.icon} className="w-3.5 h-3.5" style={{ color: c.color }} />
                    </div>
                    <span className="text-sm flex-1">{c.name}</span>
                    <button
                      onClick={() => deleteCategory(c.id, "income")}
                      className="text-rose-400 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div
                className="text-xs font-medium mb-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                PENGELUARAN
              </div>
              <div className="space-y-1.5">
                {state.categories.expense.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg glass">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${c.color}20` }}
                    >
                      <FsIcon name={c.icon} className="w-3.5 h-3.5" style={{ color: c.color }} />
                    </div>
                    <span className="text-sm flex-1">{c.name}</span>
                    <button
                      onClick={() => deleteCategory(c.id, "expense")}
                      className="text-rose-400 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Google Sheets */}
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Table2 className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold">Google Sheets</h3>
          </div>
          <div className="mb-4">
            {state.settings.spreadsheetConnected ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium">Terhubung</span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Sheet: {state.settings.sheetName}
                </p>
                <button
                  onClick={disconnectSpreadsheet}
                  className="text-xs text-rose-400 mt-2"
                >
                  Putuskan
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-xs">Belum terhubung</span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Sync transaksi otomatis ke Google Spreadsheet Anda
                </p>
              </>
            )}
          </div>
          <button
            onClick={onOpenSpreadsheet}
            className="btn-ghost w-full justify-center"
          >
            <LinkIcon className="w-4 h-4" /> Hubungkan
          </button>
        </div>

        {/* Preferences */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-rose-400" />
            <h3 className="font-semibold">Preferensi</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium">Mata Uang</div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  IDR — Rupiah Indonesia
                </div>
              </div>
              <select className="input-field !w-auto !py-2" defaultValue="IDR">
                <option value="IDR">IDR — Rupiah</option>
                <option value="USD">USD — Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <div>
                <div className="text-sm font-medium">Notifikasi</div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Pengingat catat transaksi harian
                </div>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked readOnly />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <div>
                <div className="text-sm font-medium">Auto-sync Spreadsheet</div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Sync otomatis setiap transaksi baru
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={state.settings.autoSync}
                  onChange={(e) => toggleAutoSync(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
