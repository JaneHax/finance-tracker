"use client";

import { LogOut } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function LogoutModal({ show, onClose, onConfirm }) {
  return (
    <Modal show={show} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-6">
        <div className="text-center mb-5">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: "rgba(244, 63, 94, 0.12)" }}
          >
            <LogOut className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Keluar dari akun?</h3>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Data Anda tetap aman tersimpan di cloud.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary flex-1 justify-center"
            style={{
              background: "linear-gradient(135deg, #F43F5E, #E11D48)",
              boxShadow: "0 4px 20px -4px rgba(244, 63, 94, 0.4)",
            }}
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </div>
    </Modal>
  );
}
