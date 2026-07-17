"use client";

import { useState, useRef } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  X,
  ScanLine,
  ImagePlus,
  Check,
} from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, todayISO, uid, extractAmountFromReceipt } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

export default function AddTransactionModal({ show, onClose }) {
  const { state, addTransaction, showToast } = useFinance();
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState("");
  const fileRef = useRef(null);

  const categories = type === "expense" ? state.categories.expense : state.categories.income;

  const reset = () => {
    setType("expense");
    setAmount("");
    setName("");
    setNote("");
    setDate(todayISO());
    setScanOpen(false);
    setScanning(false);
    setScanPreview("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleType = (t) => {
    setType(t);
    setCategoryId("");
  };

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return showToast("Masukkan nominal valid", "error");
    if (!name.trim()) return showToast("Masukkan nama transaksi", "error");
    if (!date) return showToast("Pilih tanggal", "error");

    const txn = {
      id: uid("t"),
      name: name.trim(),
      amount: amt,
      type,
      categoryId: categoryId || categories[0]?.id,
      sourceId: sourceId || state.fundSources[0]?.id,
      note: note.trim(),
      date,
      createdAt: Date.now(),
    };
    addTransaction(txn);
    showToast("Transaksi tersimpan!", "success");
    handleClose();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setScanning(true);
      setScanPreview(ev.target.result);
      try {
        const Tesseract = (await import("tesseract.js")).default;
        showToast("Memulai OCR struk...", "info");
        const result = await Tesseract.recognize(file, "ind+eng");
        const extracted = extractAmountFromReceipt(result.data.text);
        if (extracted > 0) {
          setAmount(String(extracted));
          showToast(`Nominal: ${formatCurrency(extracted)}`, "success");
        } else {
          showToast("Nominal tidak terdeteksi", "info");
        }
      } catch (err) {
        console.error(err);
        showToast("Gagal scan", "error");
      }
      setScanning(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      show={show}
      onClose={handleClose}
      maxWidth="max-w-lg"
      maxHeight="max-h-[90vh]"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold">Tambah Transaksi</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Catat pemasukan atau pengeluaran Anda
            </p>
          </div>
          <button onClick={handleClose} className="btn-ghost !p-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl glass mb-5">
          <button
            onClick={() => handleType("expense")}
            className="py-2.5 rounded-lg text-sm font-semibold transition"
            style={
              type === "expense"
                ? { background: "rgba(244, 63, 94, 0.15)", color: "#FB7185" }
                : {}
            }
          >
            <ArrowUpRight className="w-4 h-4 inline mr-1" /> Pengeluaran
          </button>
          <button
            onClick={() => handleType("income")}
            className="py-2.5 rounded-lg text-sm font-semibold transition"
            style={
              type === "income"
                ? { background: "rgba(16, 185, 129, 0.15)", color: "#34D399" }
                : {}
            }
          >
            <ArrowDownLeft className="w-4 h-4 inline mr-1" /> Pemasukan
          </button>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Scan Struk (Opsional)
            </label>
            <button
              onClick={() => setScanOpen((v) => !v)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <ScanLine className="w-3.5 h-3.5" /> {scanOpen ? "Tutup" : "Aktifkan"}
            </button>
          </div>
          {scanOpen && (
            <div
              className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400/40 hover:bg-emerald-400/5 transition"
              onClick={() => fileRef.current?.click()}
            >
              {!scanning && !scanPreview && (
                <div>
                  <ImagePlus className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-tertiary)" }} />
                  <p className="text-sm font-medium mb-1">Upload foto struk</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    OCR otomatis mendeteksi nominal. Format: JPG, PNG
                  </p>
                </div>
              )}
              {scanning && (
                <div className="relative">
                  <div
                    className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  >
                    {scanPreview && (
                      <img src={scanPreview} className="w-full h-full object-cover opacity-60" alt="Receipt" />
                    )}
                    <div className="scan-line" />
                  </div>
                  <p className="text-sm font-medium mt-3 text-emerald-400">Memindai struk...</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Nominal *
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                Rp
              </span>
              <input
                type="number"
                className="input-field !pl-10 tabular"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="text-xs mt-1 tabular" style={{ color: "var(--text-tertiary)" }}>
              {parseFloat(amount) > 0 ? "= " + formatCurrency(parseFloat(amount)) : ""}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                Kategori *
              </label>
              <select
                className="input-field"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                Sumber Dana *
              </label>
              <select
                className="input-field"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                {state.fundSources.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Nama Transaksi *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Contoh: Makan siang"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                Tanggal
              </label>
              <input
                type="date"
                className="input-field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                Catatan
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Opsional..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleClose} className="btn-ghost flex-1 justify-center">
            Batal
          </button>
          <button onClick={handleSave} className="btn-primary flex-1 justify-center">
            <Check className="w-4 h-4" /> Simpan
          </button>
        </div>
      </div>
    </Modal>
  );
}
