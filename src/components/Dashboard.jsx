"use client";

import { useState, useMemo } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Settings2,
  Trash2,
} from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import {
  formatCurrency,
  formatCompact,
  formatDate,
  MONTH_NAMES,
  MONTH_SHORT,
} from "@/lib/utils";
import AnimatedNumber from "@/components/dashboard/AnimatedNumber";
import Sparkline from "@/components/dashboard/Sparkline";
import { MainChart, DonutChartView, DonutLegend } from "@/components/dashboard/Charts";

const ICONS = {
  wallet: Wallet,
  "arrow-down-left": ArrowDownLeft,
  "arrow-up-right": ArrowUpRight,
  "piggy-bank": PiggyBank,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "refresh-cw": RefreshCw,
  "settings-2": Settings2,
};

function getIcon(name) {
  return ICONS[name] || Wallet;
}

export default function Dashboard({ onNavigate }) {
  const { state, getCategoryById, getFundSourceById } = useFinance();
  const [chartRange, setChartRange] = useState("30d");
  const [showBalanceDetail, setShowBalanceDetail] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    if (hour >= 18 || hour < 4) return "Selamat malam";
    return "Selamat pagi";
  }, []);

  const now = new Date();
  const summary = useMemo(() => {
    const totalBalance = state.fundSources.reduce((s, f) => s + f.balance, 0);
    const thisMonth = state.transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = state.transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === lastMonthDate.getMonth() &&
        d.getFullYear() === lastMonthDate.getFullYear()
      );
    });
    const income = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const lastIncome = lastMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const lastExpense = lastMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    const incomeChange = lastIncome > 0 ? ((income - lastIncome) / lastIncome) * 100 : 0;
    const expenseChange = lastExpense > 0 ? ((expense - lastExpense) / lastExpense) * 100 : 0;
    const balanceChange =
      ((income - expense) - (lastIncome - lastExpense)) /
      Math.max(1, lastIncome - lastExpense) *
      100;
    const savingRate = income > 0 ? (net / income) * 100 : 0;
    return { totalBalance, income, expense, net, incomeChange, expenseChange, balanceChange, savingRate };
  }, [state]);

  const greetingSummary = useMemo(() => {
    let s = `Bulan ${MONTH_NAMES[now.getMonth()]}: pemasukan ${formatCompact(summary.income)}, pengeluaran ${formatCompact(summary.expense)}`;
    if (summary.net >= 0) s += `, surplus ${formatCompact(summary.net)}. Mantap!`;
    else s += `, defisit ${formatCompact(Math.abs(summary.net))}. Hati-hati ya.`;
    return s;
  }, [summary]);

  const recent = useMemo(
    () =>
      [...state.transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt)
        .slice(0, 5),
    [state.transactions]
  );

  const donut = useMemo(() => {
    const fs = state.fundSources || [];
    if (fs.length === 0)
      return { labels: [], data: [], colors: [], total: 0 };
    const colors = { bank: "#10B981", ewallet: "#3B82F6", crypto: "#F59E0B" };
    const labels = { bank: "Bank", ewallet: "E-Wallet", crypto: "Crypto" };
    const grouped = {};
    fs.forEach((f) => {
      const t = f.type || "other";
      if (!grouped[t]) grouped[t] = { balance: 0, label: labels[t] || t };
      grouped[t].balance += f.balance || 0;
    });
    const resultLabels = [],
      resultData = [],
      resultColors = [];
    Object.entries(grouped).forEach(([t, info]) => {
      resultLabels.push(info.label);
      resultData.push(info.balance);
      resultColors.push(colors[t] || "#71717A");
    });
    const total = resultData.reduce((s, v) => s + v, 0);
    return { labels: resultLabels, data: resultData, colors: resultColors, total };
  }, [state.fundSources]);

  const changeMonth = (delta) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCalMonth(m);
    setCalYear(y);
  };

  const totalBalance = state.fundSources.reduce((s, f) => s + f.balance, 0);

  return (
    <div>
      <div className="mb-7 animate-fadeIn">
        <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
          <span>{now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
          <span>•</span>
          <span>
            {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][now.getDay()]}, {now.getDate()} {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          <span>{greeting},</span>{" "}
          <span className="serif-italic text-grad-emerald">{state.user?.name}</span>.
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          {greetingSummary}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 stagger">
        <div
          className="card card-glow-purple p-5 cursor-pointer"
          onClick={() => setShowBalanceDetail((v) => !v)}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                Total Saldo
              </div>
              <AnimatedNumber
                value={totalBalance}
                className="text-2xl font-bold text-grad-purple"
              />
            </div>
            <div className="icon-pill" style={{ background: "rgba(139, 92, 246, 0.12)" }}>
              <Wallet className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">
                {(summary.balanceChange >= 0 ? "+" : "") + summary.balanceChange.toFixed(1) + "%"}
              </span>
              <span>vs bulan lalu</span>
            </div>
            <Sparkline id="sparkBalance" value={totalBalance} color="#A78BFA" />
          </div>
          {showBalanceDetail && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                Rincian Sumber Dana
              </div>
              <div className="space-y-2">
                {state.fundSources.map((fs) => {
                  const pct = totalBalance > 0 ? (fs.balance / totalBalance) * 100 : 0;
                  const FsIcon = getIcon(fs.icon);
                  return (
                    <div key={fs.id} className="flex items-center gap-2.5 text-xs">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center"
                        style={{ background: `${fs.color}20` }}
                      >
                        <FsIcon className="w-3 h-3" style={{ color: fs.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="truncate">{fs.name}</span>
                          <span className="tabular font-medium">{formatCurrency(fs.balance)}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: fs.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate("settings");
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 mt-3 flex items-center gap-1"
              >
                <Settings2 className="w-3 h-3" /> Kelola sumber dana
              </button>
            </div>
          )}
        </div>

        <div className="card card-glow-emerald p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                Pemasukan Bulan Ini
              </div>
              <AnimatedNumber value={summary.income} className="text-2xl font-bold text-grad-emerald" />
            </div>
            <div className="icon-pill" style={{ background: "rgba(16, 185, 129, 0.12)" }}>
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
              {summary.incomeChange >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-400" />
              )}
              <span className="font-medium">
                {(summary.incomeChange >= 0 ? "+" : "") + summary.incomeChange.toFixed(1) + "%"}
              </span>
              <span>vs bulan lalu</span>
            </div>
            <Sparkline id="sparkIncome" value={summary.income} color="#34D399" />
          </div>
        </div>

        <div className="card card-glow-rose p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                Pengeluaran Bulan Ini
              </div>
              <AnimatedNumber value={summary.expense} className="text-2xl font-bold text-grad-rose" />
            </div>
            <div className="icon-pill" style={{ background: "rgba(244, 63, 94, 0.12)" }}>
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
              {summary.expenseChange >= 0 ? (
                <TrendingUp className="w-3 h-3 text-rose-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-emerald-400" />
              )}
              <span className="font-medium">
                {(summary.expenseChange >= 0 ? "+" : "") + summary.expenseChange.toFixed(1) + "%"}
              </span>
              <span>vs bulan lalu</span>
            </div>
            <Sparkline id="sparkExpense" value={summary.expense} color="#FB7185" />
          </div>
        </div>

        <div className="card card-glow-emerald p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                Sisa / Net Saving
              </div>
              <AnimatedNumber
                value={summary.net}
                className="text-2xl font-bold"
                style={
                  summary.net >= 0
                    ? {
                        background: "linear-gradient(135deg, #34D399, #10B981)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }
                    : {
                        background: "linear-gradient(135deg, #FB7185, #F43F5E)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }
                }
              />
            </div>
            <div className="icon-pill" style={{ background: "rgba(16, 185, 129, 0.12)" }}>
              <PiggyBank className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              <span>Saving rate </span>
              <span className="font-semibold text-emerald-400">
                {summary.savingRate.toFixed(0)}%
              </span>
            </div>
            <Sparkline id="sparkSaving" value={summary.net} color="#10B981" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-base">Riwayat Keuangan</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Perbandingan pemasukan vs pengeluaran
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg glass">
              {[
                { id: "7d", label: "7 Hari" },
                { id: "30d", label: "30 Hari" },
                { id: "1y", label: "1 Tahun" },
              ].map((r) => (
                <button
                  key={r.id}
                  className={`chart-tab px-3 py-1.5 text-xs rounded-md transition font-medium ${chartRange === r.id ? "active" : ""}`}
                  onClick={() => setChartRange(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-5 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span style={{ color: "var(--text-secondary)" }}>Pemasukan</span>
              <span className="font-semibold">{formatCompact(summary.income)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span style={{ color: "var(--text-secondary)" }}>Pengeluaran</span>
              <span className="font-semibold">{formatCompact(summary.expense)}</span>
            </div>
          </div>
          <div className="relative" style={{ height: 280 }}>
            <MainChart transactions={state.transactions} range={chartRange} />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base">Total Saldo</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Per Sumber Dana
              </p>
            </div>
          </div>
          <div className="relative flex items-center justify-center" style={{ height: 200 }}>
            <DonutChartView donut={donut} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Total
              </div>
              <div className="text-xl font-bold tabular">{formatCompact(donut.total)}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <DonutLegend donut={donut} />
          </div>
        </div>
      </div>

      {/* Calendar + Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <CalendarWidget
          calMonth={calMonth}
          calYear={calYear}
          onChangeMonth={changeMonth}
          transactions={state.transactions}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          getCategoryById={getCategoryById}
          getFundSourceById={getFundSourceById}
        />

        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base">Transaksi Terbaru</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                5 transaksi terakhir
              </p>
            </div>
            <button className="btn-ghost text-xs" onClick={() => onNavigate("transactions")}>
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {recent.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  Belum ada transaksi
                </p>
              </div>
            ) : (
              recent.map((t) => (
                <TransactionRow
                  key={t.id}
                  txn={t}
                  getCategoryById={getCategoryById}
                  getFundSourceById={getFundSourceById}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarWidget({
  calMonth,
  calYear,
  onChangeMonth,
  transactions,
  selectedDay,
  setSelectedDay,
  getCategoryById,
  getFundSourceById,
}) {
  const months = MONTH_NAMES;
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedDayTxns = selectedDay
    ? transactions.filter((t) => t.date === selectedDay)
    : [];

  return (
    <div className="card p-5 xl:col-span-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base">
            {months[calMonth]} {calYear}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Klik tanggal untuk lihat transaksi
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-ghost !p-1.5" onClick={() => onChangeMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="btn-ghost !p-1.5" onClick={() => onChangeMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold py-1"
            style={{ color: "var(--text-tertiary)" }}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="cal-day empty" />;
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const dayTxns = transactions.filter((t) => t.date === dateStr);
          const hasIncome = dayTxns.some((t) => t.type === "income");
          const hasExpense = dayTxns.some((t) => t.type === "expense");
          const isToday =
            today.getDate() === d &&
            today.getMonth() === calMonth &&
            today.getFullYear() === calYear;
          const isSelected = selectedDay === dateStr;
          let dots = "";
          if (hasIncome && hasExpense)
            dots = (
              <div className="flex gap-0.5">
                <div className="dot" style={{ background: "#34D399" }} />
                <div className="dot" style={{ background: "#FB7185" }} />
              </div>
            );
          else if (hasIncome)
            dots = <div className="dot" style={{ background: "#34D399" }} />;
          else if (hasExpense)
            dots = <div className="dot" style={{ background: "#FB7185" }} />;
          return (
            <div
              key={i}
              className={`cal-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedDay(dateStr)}
            >
              <span>{d}</span>
              {dots}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span style={{ color: "var(--text-secondary)" }}>Pemasukan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span style={{ color: "var(--text-secondary)" }}>Pengeluaran</span>
        </div>
      </div>
      {selectedDayTxns.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
            Transaksi {new Date(selectedDay).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedDayTxns.map((t) => {
              const cat = getCategoryById(t.categoryId);
              const source = getFundSourceById(t.sourceId);
              const CatIcon = getIcon(cat.icon);
              return (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${cat.color}20` }}
                  >
                    <CatIcon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{t.name}</div>
                    <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      {source.name}
                    </div>
                  </div>
                  <div className={`text-xs tabular font-medium ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount, false)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function TransactionRow({ txn, getCategoryById, getFundSourceById, onDelete }) {
  const cat = getCategoryById(txn.categoryId);
  const source = getFundSourceById(txn.sourceId);
  const CatIcon = getIcon(cat.icon);
  const SourceIcon = getIcon(source.icon);
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition group">
      <div
        className="icon-pill"
        style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}25` }}
      >
        <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{txn.name}</span>
          <span className="tag" style={{ background: `${cat.color}15`, color: cat.color }}>
            {cat.name}
          </span>
          {txn.note && (
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              • {txn.note}
            </span>
          )}
        </div>
        <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
          <span>{formatDate(txn.date)}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <SourceIcon className="w-3 h-3" />
            {source.name}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-semibold tabular text-sm ${txn.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
          {txn.type === "income" ? "+" : "-"}
          {formatCurrency(txn.amount, false)}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(txn.id)}
          className="opacity-0 group-hover:opacity-100 transition btn-ghost !p-2 !bg-rose-500/10 !border-rose-500/20 hover:!bg-rose-500/20"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
        </button>
      )}
    </div>
  );
}
