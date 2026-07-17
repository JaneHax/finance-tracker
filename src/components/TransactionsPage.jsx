"use client";

import { useState, useMemo, useEffect } from "react";
import { Inbox, Plus, X } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TransactionRow } from "@/components/Dashboard";

export default function TransactionsPage({ externalSearch = "" }) {
  const { state, getCategoryById, getFundSourceById, deleteTransaction } =
    useFinance();
  const [search, setSearch] = useState(externalSearch);
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => {
    setSearch(externalSearch);
  }, [externalSearch]);

  const allCategories = useMemo(
    () => [...state.categories.expense, ...state.categories.income],
    [state.categories]
  );

  const filtered = useMemo(() => {
    let list = [...state.transactions];
    const s = search.toLowerCase();
    if (s)
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(s) ||
          (t.note && t.note.toLowerCase().includes(s))
      );
    if (type) list = list.filter((t) => t.type === type);
    if (category) list = list.filter((t) => t.categoryId === category);
    if (source) list = list.filter((t) => t.sourceId === source);
    list.sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);
    return list;
  }, [state.transactions, search, type, category, source]);

  const handleDelete = (id) => {
    deleteTransaction(id);
  };

  return (
    <div>
      <div className="mb-6 animate-fadeIn">
        <h1 className="text-3xl font-bold tracking-tight">
          Riwayat <span className="serif-italic text-grad-emerald">Transaksi</span>
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          Semua transaksi keuangan Anda di satu tempat
        </p>
      </div>

      <div className="card p-5 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label
              className="text-xs font-medium mb-1.5 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Pencarian
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Cari nama transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label
              className="text-xs font-medium mb-1.5 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Jenis
            </label>
            <select
              className="input-field"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label
              className="text-xs font-medium mb-1.5 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Kategori
            </label>
            <select
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-xs font-medium mb-1.5 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Sumber Dana
            </label>
            <select
              className="input-field"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="">Semua Sumber</option>
              {state.fundSources.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Total: <span className="font-semibold text-white">{filtered.length}</span> transaksi
          </div>
          <button
            className="btn-ghost text-xs"
            onClick={() => {
              setSearch("");
              setType("");
              setCategory("");
              setSource("");
            }}
          >
            <X className="w-3.5 h-3.5" /> Reset Filter
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <Inbox className="w-7 h-7" style={{ color: "var(--text-tertiary)" }} />
              </div>
              <h3 className="font-semibold mb-1">Belum ada transaksi</h3>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Mulai catat keuangan kamu sekarang
              </p>
            </div>
          ) : (
            filtered.map((t) => (
              <TransactionRow
                key={t.id}
                txn={t}
                getCategoryById={getCategoryById}
                getFundSourceById={getFundSourceById}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
