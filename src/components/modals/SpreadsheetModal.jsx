"use client";

import { useState } from "react";
import { X, Table2, Link as LinkIcon } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import Modal from "@/components/ui/Modal";

export default function SpreadsheetModal({ show, onClose }) {
  const { connectSpreadsheet, showToast } = useFinance();
  const [url, setUrl] = useState("");
  const [sheetName, setSheetName] = useState("Transactions");

  const handleConnect = () => {
    if (!url || !url.includes("script.google.com"))
      return showToast("URL tidak valid", "error");
    connectSpreadsheet(url.trim(), sheetName.trim() || "Transactions");
    showToast("Google Sheets terhubung!", "success");
    setUrl("");
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="max-w-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Connect Google Sheets</h3>
          <button onClick={onClose} className="btn-ghost !p-2">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center mb-5">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: "rgba(16, 185, 129, 0.12)" }}
          >
            <Table2 className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Sinkronkan semua transaksi ke Google Spreadsheet untuk backup & analisis manual.
          </p>
          <a
            href="/api/sync"
            target="_blank"
            className="inline-flex items-center gap-1 text-xs mt-2"
            style={{ color: "var(--accent)" }}
          >
            <LinkIcon className="w-3 h-3" /> Tutorial Setup
          </a>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Apps Script Web App URL
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Nama Sheet
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Transactions"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">
            Batal
          </button>
          <button onClick={handleConnect} className="btn-primary flex-1 justify-center">
            <LinkIcon className="w-4 h-4" /> Hubungkan
          </button>
        </div>
      </div>
    </Modal>
  );
}
