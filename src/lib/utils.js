export function formatCurrency(amount, withSymbol = true) {
  const formatted = new Intl.NumberFormat("id-ID").format(
    Math.abs(Math.round(amount))
  );
  return withSymbol ? "Rp " + formatted : formatted;
}

export function formatCompact(amount) {
  if (Math.abs(amount) >= 1000000000)
    return "Rp " + (amount / 1000000000).toFixed(1) + "M";
  if (Math.abs(amount) >= 1000000)
    return "Rp " + (amount / 1000000).toFixed(1) + "jt";
  if (Math.abs(amount) >= 1000)
    return "Rp " + (amount / 1000).toFixed(0) + "rb";
  return "Rp " + Math.round(amount);
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return diffDays + " hari lalu";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
export const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
export const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function extractAmountFromReceipt(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  for (const line of lines) {
    if (/total|grand\s*total|jumlah/i.test(line)) {
      const nums = line.match(/(\d[\d.,]*)/g);
      if (nums) {
        const num = nums[nums.length - 1]
          .replace(/[.,](?=\d{3})/g, "")
          .replace(",", ".");
        const val = parseFloat(num);
        if (val > 100) return Math.round(val);
      }
    }
  }
  let max = 0;
  const allNums = text.match(/(\d{1,3}(?:[.,]\d{3})+|\d{4,})/g);
  if (allNums) {
    for (const n of allNums) {
      const c = n.replace(/[.,](?=\d{3})/g, "").replace(",", ".");
      const v = parseFloat(c);
      if (v > max && v < 100000000) max = v;
    }
  }
  return Math.round(max);
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function uid(prefix = "id") {
  return (
    prefix +
    Date.now() +
    "_" +
    Math.random().toString(36).substr(2, 5)
  );
}

export function generateSparkData(current) {
  const data = [];
  const base = current / 12 || 100000;
  for (let i = 0; i < 12; i++) {
    data.push(Math.max(0, base * (1 + (Math.random() - 0.5) * 0.4)));
  }
  data[data.length - 1] = current / 8 || 100000;
  return data;
}
