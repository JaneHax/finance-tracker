"use client";

import { useState } from "react";
import { MailCheck, RefreshCw, LogOut, Loader2, Send } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";

export default function EmailVerification() {
  const { currentUser, resendVerification, reloadUser, logout, showToast } =
    useFinance();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
    } catch (err) {
      showToast(err.message || "Gagal kirim ulang", "error");
    }
    setSending(false);
  };

  const handleCheck = async () => {
    setChecking(true);
    await reloadUser();
    setChecking(false);
  };

  const email = currentUser?.email || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div
        className="orb"
        style={{
          width: 350,
          height: 350,
          background: "#10B981",
          top: "15%",
          right: "5%",
        }}
      />
      <div
        className="orb"
        style={{
          width: 300,
          height: 300,
          background: "#8B5CF6",
          bottom: "5%",
          left: "10%",
          animationDelay: "-4s",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6 animate-fadeInScale">
        <div className="glass-strong rounded-2xl p-7 text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(139,92,246,0.15))",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <MailCheck className="w-8 h-8 text-emerald-400" />
          </div>

          <h2 className="text-xl font-bold mb-2">Cek Email Anda</h2>
          <p
            className="text-sm mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Kami sudah kirim link verifikasi ke:
          </p>
          <p className="text-sm font-semibold text-emerald-400 mb-4">
            {email}
          </p>
          <p
            className="text-xs mb-6"
            style={{ color: "var(--text-tertiary)" }}
          >
            Klik link di email untuk verifikasi akun, lalu klik tombol di bawah
            untuk melanjutkan.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleCheck}
              disabled={checking}
              className="btn-primary w-full justify-center"
            >
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Saya sudah verifikasi, lanjutkan
            </button>

            <button
              onClick={handleResend}
              disabled={sending}
              className="btn-ghost w-full justify-center"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Kirim ulang email verifikasi
            </button>

            <button
              onClick={logout}
              className="btn-ghost w-full justify-center text-rose-400 hover:bg-rose-500/10 border-rose-500/20"
              style={{ color: "#FB7185" }}
            >
              <LogOut className="w-4 h-4" />
              Logout / Ganti akun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
