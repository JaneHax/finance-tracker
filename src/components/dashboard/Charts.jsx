"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { formatCurrency, formatCompact, DAY_SHORT, MONTH_SHORT } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend
);

const tooltipStyle = {
  backgroundColor: "rgba(14, 16, 21, 0.95)",
  titleColor: "#F4F4F5",
  bodyColor: "#A1A1AA",
  borderColor: "rgba(255,255,255,0.08)",
  borderWidth: 1,
  padding: 12,
  cornerRadius: 10,
};

export function MainChart({ transactions, range }) {
  const { labels, incomeData, expenseData } = useMemo(() => {
    const now = new Date();
    const l = [],
      inc = [],
      exp = [];
    if (range === "7d") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        l.push(DAY_SHORT[d.getDay()]);
        const dayTxns = transactions.filter((t) => t.date === dateStr);
        inc.push(dayTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0));
        exp.push(dayTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0));
      }
    } else if (range === "30d") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        l.push(d.getDate());
        const dayTxns = transactions.filter((t) => t.date === dateStr);
        inc.push(dayTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0));
        exp.push(dayTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0));
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        l.push(MONTH_SHORT[d.getMonth()]);
        const monthTxns = transactions.filter((t) => {
          const td = new Date(t.date);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        });
        inc.push(monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0));
        exp.push(monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0));
      }
    }
    return { labels: l, incomeData: inc, expenseData: exp };
  }, [transactions, range]);

  const data = {
    labels,
    datasets: [
      {
        label: "Pemasukan",
        data: incomeData,
        borderColor: "#34D399",
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "rgba(16,185,129,0.2)";
          const g = c.createLinearGradient(0, 0, 0, 280);
          g.addColorStop(0, "rgba(16, 185, 129, 0.35)");
          g.addColorStop(1, "rgba(16, 185, 129, 0)");
          return g;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#34D399",
        pointHoverBorderColor: "#08090D",
        pointHoverBorderWidth: 2,
      },
      {
        label: "Pengeluaran",
        data: expenseData,
        borderColor: "#FB7185",
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "rgba(244,63,94,0.2)";
          const g = c.createLinearGradient(0, 0, 0, 280);
          g.addColorStop(0, "rgba(244, 63, 94, 0.35)");
          g.addColorStop(1, "rgba(244, 63, 94, 0)");
          return g;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#FB7185",
        pointHoverBorderColor: "#08090D",
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#71717A", font: { size: 11 }, maxTicksLimit: 12 },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#71717A",
          font: { size: 11 },
          callback: (v) => formatCompact(v),
        },
        border: { display: false },
      },
    },
    animation: { duration: 1000 },
  };

  return <Line data={data} options={options} />;
}

export function useDonutData(transactions, categories) {
  return useMemo(() => {
    const now = new Date();
    const monthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear() &&
        t.type === "expense"
      );
    });
    const catTotals = {};
    monthTxns.forEach((t) => {
      catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + t.amount;
    });
    const labels = [],
      data = [],
      colors = [];
    categories.expense.forEach((cat) => {
      if (catTotals[cat.id]) {
        labels.push(cat.name);
        data.push(catTotals[cat.id]);
        colors.push(cat.color);
      }
    });
    const total = data.reduce((s, v) => s + v, 0);
    return { labels, data, colors, total };
  }, [transactions, categories]);
}

export function DonutChartView({ donut }) {
  if (!donut || donut.data.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        Belum ada data
      </p>
    );
  }
  const chartData = {
    labels: donut.labels,
    datasets: [
      {
        data: donut.data,
        backgroundColor: donut.colors,
        borderColor: "#0E1015",
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.parsed)}`,
        },
      },
    },
    animation: { animateRotate: true, duration: 800 },
  };
  return <Doughnut data={chartData} options={options} />;
}

export function DonutLegend({ donut }) {
  if (!donut || donut.data.length === 0) return null;
  return donut.labels.map((label, i) => {
    const pct = ((donut.data[i] / donut.total) * 100).toFixed(1);
    return (
      <div key={label} className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: donut.colors[i] }}
          />
          <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="tabular font-medium">
            {formatCompact(donut.data[i])}
          </span>
          <span style={{ color: "var(--text-tertiary)" }} className="text-[10px]">
            {pct}%
          </span>
        </div>
      </div>
    );
  });
}

export function MonthlyChart({ transactions }) {
  const { labels, incomeData, expenseData } = useMemo(() => {
    const now = new Date();
    const yearTxns = transactions.filter(
      (t) => new Date(t.date).getFullYear() === now.getFullYear()
    );
    const inc = [],
      exp = [];
    for (let i = 0; i < 12; i++) {
      const mTxns = yearTxns.filter((t) => new Date(t.date).getMonth() === i);
      inc.push(mTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0));
      exp.push(mTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0));
    }
    return { labels: MONTH_SHORT, incomeData: inc, expenseData: exp };
  }, [transactions]);

  const data = {
    labels,
    datasets: [
      {
        label: "Pemasukan",
        data: incomeData,
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderRadius: 6,
      },
      {
        label: "Pengeluaran",
        data: expenseData,
        backgroundColor: "rgba(244, 63, 94, 0.7)",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#A1A1AA" } },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#71717A" } },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#71717A", callback: (v) => formatCompact(v) },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
