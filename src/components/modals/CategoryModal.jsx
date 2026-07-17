"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { uid } from "@/lib/utils";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/defaults";
import Modal from "@/components/ui/Modal";

export default function CategoryModal({ show, onClose }) {
  const { saveCategory, showToast } = useFinance();
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [icon, setIcon] = useState("shopping-cart");
  const [color, setColor] = useState("#10B981");

  const reset = () => {
    setName("");
    setType("expense");
    setIcon("shopping-cart");
    setColor("#10B981");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    if (!name.trim()) return showToast("Masukkan nama kategori", "error");
    saveCategory(
      { id: uid("c"), name: name.trim(), icon, color },
      type
    );
    showToast("Kategori ditambahkan", "success");
    handleClose();
  };

  return (
    <Modal show={show} onClose={handleClose} maxWidth="max-w-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Tambah Kategori</h3>
          <button onClick={handleClose} className="btn-ghost !p-2">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Nama Kategori *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Contoh: Makan, Transport..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Jenis
            </label>
            <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Warna
            </label>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_COLORS.map((c) => (
                <div
                  key={c}
                  className="h-9 rounded-lg cursor-pointer transition"
                  style={{
                    background: c,
                    transform: color === c ? "scale(1.1)" : "scale(1)",
                    boxShadow:
                      color === c
                        ? `0 0 0 2px var(--bg-primary), 0 0 0 4px ${c}`
                        : "none",
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Icon
            </label>
            <select className="input-field" value={icon} onChange={(e) => setIcon(e.target.value)}>
              {CATEGORY_ICONS.map((ic) => (
                <option key={ic} value={ic}>
                  {ic}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleClose} className="btn-ghost flex-1 justify-center">
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
