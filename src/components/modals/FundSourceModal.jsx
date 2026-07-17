"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { uid } from "@/lib/utils";
import { FUND_ICON_MAP, FUND_COLOR_MAP } from "@/lib/defaults";
import Modal from "@/components/ui/Modal";

export default function FundSourceModal({ show, onClose, editingId = null }) {
  const { state, saveFundSource, showToast } = useFinance();
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [balance, setBalance] = useState("");

  useEffect(() => {
    if (show) {
      if (editingId) {
        const fs = state.fundSources.find((f) => f.id === editingId);
        if (fs) {
          setName(fs.name);
          setType(fs.type);
          setBalance(String(fs.balance));
        }
      } else {
        setName("");
        setType("bank");
        setBalance("");
      }
    }
  }, [show, editingId, state.fundSources]);

  const handleSave = () => {
    if (!name.trim()) return showToast("Masukkan nama", "error");
    const fs = {
      id: editingId || uid("fs"),
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      icon: FUND_ICON_MAP[type],
      color: FUND_COLOR_MAP[type],
    };
    saveFundSource(fs);
    showToast("Sumber dana disimpan", "success");
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="max-w-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">
            {editingId ? "Edit Sumber Dana" : "Tambah Sumber Dana"}
          </h3>
          <button onClick={onClose} className="btn-ghost !p-2">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Nama Sumber Dana *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Contoh: Bank BCA, GoPay..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Tipe
            </label>
            <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="bank">Bank</option>
              <option value="ewallet">E-Wallet</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Saldo Saat Ini
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                Rp
              </span>
              <input
                type="number"
                className="input-field !pl-10 tabular"
                placeholder="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">
            Batal
          </button>
          <button onClick={handleSave} className="btn-primary flex-1 justify-center">
            Simpan
          </button>
        </div>
      </div>
    </Modal>
  );
}
