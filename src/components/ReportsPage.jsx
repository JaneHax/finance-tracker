"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatCompact, MONTH_SHORT } from "@/lib/utils";
import AnimatedNumber from "@/components/dashboard/AnimatedNumber";
import { MonthlyChart } from "@/components/dashboard/Charts";

const ICONS = {
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
};

export default function ReportsPage() {
  const { state, getCategoryById } = useFinance();

  const report = useMemo(() => {
    const now = new Date();
    const yearTxns = state.transactions.filter(
      (t) => new Date(t.date).getFullYear() === now.getFullYear()
    );
    const months = [];
    for (let i = 0; i < 12; i++) {
      const mTxns = yearTxns.filter((t) => new Date(t.date).getMonth() === i);
      months.push({
        income: mTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expense: mTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    const validMonths = months.filter((m) => m.income > 0 || m.expense > 0);
    const avgIncome =
      validMonths.reduce((s, m) => s + m.income, 0) / Math.max(1, validMonths.length);
    const avgExpense =
      validMonths.reduce((s, m) => s + m.expense, 0) / Math.max(1, validMonths.length);
    const totalSaving = months.reduce((s, m) => s + (m.income - m.expense), 0);

    const expenseCats = {};
    yearTxns
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        expenseCats[t.categoryId] = (expenseCats[t.categoryId] || 0) + t.amount;
      });
    const topCats = Object.entries(expenseCats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const totalExpense = Object.values(expenseCats).reduce((s, v) => s + v, 0);

    return { avgIncome, avgExpense, totalSaving, topCats, totalExpense };
  }, [state.transactions]);

  const insights = [];
  if (report.totalSaving >= 0) {
    insights.push({
      icon: "trending-up",
      color: "#34D399",
      title: "Positif",
      text: `Tahun ini Anda berhasil menabung ${formatCurrency(report.totalSaving)}.`,
    });
  } else {
    insights.push({
      icon: "trending-down",
      color: "#FB7185",
      title: "Defisit",
      text: `Tahun ini pengeluaran lebih besar ${formatCurrency(Math.abs(report.totalSaving))}.`,
    });
  }
  if (report.topCats.length > 0) {
    const tc = getCategoryById(report.topCats[0][0]);
    insights.push({
      icon: tc.icon,
      color: tc.color,
      title: "Pengeluaran Terbesar",
      text: `${tc.name} mendominasi ${((report.topCats[0][1] / report.totalExpense) * 100).toFixed(0)}% pengeluaran.`,
    });
  }

  return (
    <div>
      <div className="mb-6 animate-fadeIn">
        <h1 className="text-3xl font-bold tracking-tight">
          Laporan <span className="serif-italic text-grad-purple">Keuangan</span>
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          Analisis mendalam pola pengeluaran dan pemasukan Anda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
            Rata-rata Pengeluaran / Bulan
          </div>
          <AnimatedNumber value={report.avgExpense} className="text-2xl font-bold text-grad-rose" />
          <div className="mt-3 progress-bar">
            <div className="progress-fill gradient-rose" style={{ width: "70%" }} />
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
            Rata-rata Pemasukan / Bulan
          </div>
          <AnimatedNumber value={report.avgIncome} className="text-2xl font-bold text-grad-emerald" />
          <div className="mt-3 progress-bar">
            <div className="progress-fill gradient-emerald" style={{ width: "85%" }} />
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
            Total Saving Tahun Ini
          </div>
          <AnimatedNumber value={report.totalSaving} className="text-2xl font-bold text-grad-purple" />
          <div className="mt-3 progress-bar">
            <div className="progress-fill gradient-purple" style={{ width: "60%" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-base mb-4">Tren Bulanan (12 Bulan)</h3>
          <div style={{ height: 280 }}>
            <MonthlyChart transactions={state.transactions} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-base mb-4">Top Kategori Pengeluaran</h3>
          <div className="space-y-3">
            {report.topCats.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Belum ada data
              </p>
            ) : (
              report.topCats.map(([catId, amount]) => {
                const cat = getCategoryById(catId);
                const pct = ((amount / report.totalExpense) * 100).toFixed(1);
                const CatIcon = ICONS[cat.icon] || TrendingUp;
                return (
                  <div key={catId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: `${cat.color}20` }}
                        >
                          <CatIcon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                        </div>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold tabular">
                          {formatCurrency(amount)}
                        </div>
                        <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          {pct}%
                        </div>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-base mb-4">Insight & Rekomendasi</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.map((i, idx) => {
            const Icon = ICONS[i.icon] || TrendingUp;
            return (
              <div key={idx} className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${i.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: i.color }} />
                  </div>
                  <span className="text-sm font-semibold">{i.title}</span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {i.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
