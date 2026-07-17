"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import Modal from "@/components/ui/Modal";

export default function UsernamePopup({ show, onClose, editMode = false }) {
  const { state, saveUsername, skipUsername, showToast } = useFinance();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (show) {
      setValue(editMode ? state?.user?.name || "" : "");
    }
  }, [show, editMode, state]);

  const initial = (value || state?.user?.name || "U")
    .charAt(0)
    .toUpperCase();
  const photoURL = state?.user?.photoURL;

  const handleSave = async () => {
    const username = value.trim();
    await saveUsername(username);
    onClose();
    if (!editMode) {
      showToast(`Selamat datang, ${username || state?.user?.name}!`, "success");
    } else {
      showToast("Profil diperbarui", "success");
    }
  };

  const handleSkip = async () => {
    if (!editMode) {
      await skipUsername();
    }
    onClose();
  };

  return (
    <Modal id="usernamePopup" show={show} onClose={handleSkip} maxWidth="max-w-md">
      <div className="p-7">
        <div className="flex items-center gap-3 mb-5">
          {photoURL ? (
            <img
              src={photoURL}
              className="w-12 h-12 rounded-xl object-cover"
              alt="avatar"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl gradient-emerald flex items-center justify-center text-white font-bold text-lg">
              {initial}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">
              {editMode ? "Edit Profil" : "Halo, selamat datang!"}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {editMode
                ? "Ubah nama tampilan Anda"
                : "Sebelum mulai, kenalan dulu yuk"}
            </p>
          </div>
        </div>
        {!editMode && (
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            Panggilan apa yang kamu suka? Nama ini akan tampil di dashboard-mu.
          </p>
        )}
        <input
          type="text"
          className="input-field mb-4"
          placeholder="Contoh: Reza, Bro, Mas..."
          maxLength={30}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="btn-ghost flex-1 justify-center"
          >
            {editMode ? "Batal" : "Lewati"}
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex-1 justify-center"
          >
            {editMode ? "Simpan" : "Mulai Pakai"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
