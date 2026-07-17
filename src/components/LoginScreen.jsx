"use client";

import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";

export default function LoginScreen() {
  const { signUp, signIn, resetPassword, showToast } = useFinance();
  const [mode, setMode] = useState("signin"); // signin | signup
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPw: "",
  });
  const [error, setError] = useState("");

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setForm({ email: "", username: "", password: "", confirmPw: "" });
  };

  const validate = () => {
    const { email, username, password, confirmPw } = form;
    if (!email.trim()) return "Email wajib diisi";
    if (!email.includes("@")) return "Email tidak valid";
    if (!password || password.length < 6)
      return "Password minimal 6 karakter";
    if (mode === "signup") {
      if (!username.trim()) return "Username wajib diisi";
      if (username.length < 3) return "Username minimal 3 karakter";
      if (password !== confirmPw) return "Konfirmasi password tidak cocok";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(form.email, form.username, form.password);
        showToast("Akun dibuat! Cek email untuk verifikasi", "success");
      } else {
        await signIn(form.email || form.username, form.password);
      }
    } catch (err) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "Email sudah terdaftar"
          : err.code === "auth/user-not-found"
          ? "User tidak ditemukan"
          : err.code === "auth/wrong-password"
          ? "Password salah"
          : err.code === "auth/invalid-credential"
          ? "Email atau password salah"
          : err.message || "Terjadi kesalahan";
      setError(msg);
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Masukkan email dulu untuk reset password");
      return;
    }
    try {
      await resetPassword(form.email);
      showToast("Link reset password dikirim ke email", "success");
    } catch (err) {
      setError(err.message || "Gagal kirim reset");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div
        className="orb"
        style={{
          width: 400,
          height: 400,
          background: "#10B981",
          top: "10%",
          left: "10%",
        }}
      />
      <div
        className="orb"
        style={{
          width: 350,
          height: 350,
          background: "#8B5CF6",
          bottom: "10%",
          right: "10%",
          animationDelay: "-3s",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6 animate-fadeInScale">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(139,92,246,0.15))",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M6 22L12 14L18 18L26 8"
                stroke="url(#logingrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="26" cy="8" r="2.5" fill="#34D399" />
              <defs>
                <linearGradient id="logingrad" x1="6" y1="22" x2="26" y2="8">
                  <stop stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Finance Tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Premium personal money tracker
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-7">
          {/* Tab toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl glass mb-6">
            <button
              onClick={() => switchMode("signin")}
              className="py-2.5 rounded-lg text-sm font-semibold transition"
              style={
                mode === "signin"
                  ? { background: "rgba(16,185,129,0.15)", color: "#34D399" }
                  : { color: "var(--text-secondary)" }
              }
            >
              Masuk
            </button>
            <button
              onClick={() => switchMode("signup")}
              className="py-2.5 rounded-lg text-sm font-semibold transition"
              style={
                mode === "signup"
                  ? { background: "rgba(16,185,129,0.15)", color: "#34D399" }
                  : { color: "var(--text-secondary)" }
              }
            >
              Daftar
            </button>
          </div>

          {error && (
            <div className="mb-4 text-sm text-rose-400 text-center bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: "var(--text-secondary)" }}
              >
                {mode === "signup" ? "Email *" : "Email atau Username *"}
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <input
                  type="text"
                  className="input-field !pl-10"
                  placeholder={
                    mode === "signup"
                      ? "contoh@email.com"
                      : "Email atau username"
                  }
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label
                  className="text-xs font-medium mb-1.5 block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Username *
                </label>
                <div className="relative">
                  <User
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                  <input
                    type="text"
                    className="input-field !pl-10"
                    placeholder="Contoh: reza2005"
                    value={form.username}
                    onChange={(e) => update("username", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: "var(--text-secondary)" }}
              >
                Password *
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <input
                  type={showPw ? "text" : "password"}
                  className="input-field !pl-10 !pr-10"
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-tertiary)" }}
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label
                  className="text-xs font-medium mb-1.5 block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Konfirmasi Password *
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                  <input
                    type={showPw ? "text" : "password"}
                    className="input-field !pl-10"
                    placeholder="Ulangi password"
                    value={form.confirmPw}
                    onChange={(e) => update("confirmPw", e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {mode === "signup" ? "Daftar" : "Masuk"}
            </button>
          </form>

          {mode === "signin" && (
            <button
              type="button"
              onClick={handleForgot}
              className="text-xs text-emerald-400 hover:text-emerald-300 mt-3 block w-full text-center"
            >
              Lupa password?
            </button>
          )}

          <p
            className="text-xs text-center mt-6"
            style={{ color: "var(--text-tertiary)" }}
          >
            Dengan melanjutkan, Anda menyetujui{" "}
            <span className="text-emerald-400">Syarat Layanan</span> &{" "}
            <span className="text-emerald-400">Kebijakan Privasi</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
