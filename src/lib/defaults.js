export const DEFAULT_STATE = {
  user: null,
  hasUsername: false,
  fundSources: [],
  categories: {
    expense: [
      { id: "c1", name: "Makan", icon: "utensils", color: "#F43F5E" },
      { id: "c2", name: "Transport", icon: "car", color: "#3B82F6" },
      { id: "c3", name: "Hiburan", icon: "gamepad-2", color: "#8B5CF6" },
      { id: "c4", name: "Belanja", icon: "shopping-cart", color: "#EC4899" },
      { id: "c5", name: "Tagihan", icon: "receipt", color: "#F59E0B" },
      { id: "c6", name: "Kesehatan", icon: "heart-pulse", color: "#10B981" },
    ],
    income: [
      { id: "c7", name: "Gaji", icon: "briefcase", color: "#10B981" },
      { id: "c8", name: "Freelance", icon: "laptop", color: "#34D399" },
      { id: "c9", name: "Investasi", icon: "trending-up", color: "#8B5CF6" },
      { id: "c10", name: "Hadiah", icon: "gift", color: "#EC4899" },
    ],
  },
  transactions: [],
  notifications: [],
  settings: {
    currency: "IDR",
    spreadsheetConnected: false,
    spreadsheetUrl: "",
    sheetName: "Transactions",
    autoSync: false,
  },
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),
  chartRange: "30d",
};

export function generateSampleTransactions() {
  const samples = [
    { name: "Gaji Bulanan", amount: 12000000, type: "income", category: "c7", source: "fs1", note: "Gaji", daysAgo: 2 },
    { name: "Project Freelance", amount: 3500000, type: "income", category: "c8", source: "fs1", note: "Web klien", daysAgo: 5 },
    { name: "Makan Siang", amount: 18000, type: "expense", category: "c1", source: "fs2", note: "", daysAgo: 0 },
    { name: "Gojek", amount: 25000, type: "expense", category: "c2", source: "fs2", note: "", daysAgo: 0 },
    { name: "Netflix", amount: 54000, type: "expense", category: "c3", source: "fs3", note: "", daysAgo: 1 },
    { name: "Kopi", amount: 22000, type: "expense", category: "c1", source: "fs2", note: "", daysAgo: 1 },
    { name: "Indomaret", amount: 87500, type: "expense", category: "c4", source: "fs1", note: "", daysAgo: 3 },
    { name: "Token Listrik", amount: 200000, type: "expense", category: "c5", source: "fs1", note: "", daysAgo: 4 },
    { name: "Bioskop", amount: 75000, type: "expense", category: "c3", source: "fs3", note: "", daysAgo: 6 },
    { name: "Vitamin", amount: 125000, type: "expense", category: "c6", source: "fs1", note: "", daysAgo: 7 },
    { name: "Dividen", amount: 450000, type: "income", category: "c9", source: "fs1", note: "", daysAgo: 8 },
    { name: "Gas LPG", amount: 20000, type: "expense", category: "c5", source: "fs5", note: "", daysAgo: 10 },
    { name: "Makan Malam", amount: 145000, type: "expense", category: "c1", source: "fs3", note: "", daysAgo: 12 },
    { name: "Internet", amount: 350000, type: "expense", category: "c5", source: "fs3", note: "", daysAgo: 15 },
    { name: "Top up GoPay", amount: 500000, type: "expense", category: "c4", source: "fs1", note: "", daysAgo: 18 },
  ];

  return samples.map((s, i) => {
    const date = new Date();
    date.setDate(date.getDate() - s.daysAgo);
    return {
      id: "t" + Date.now() + "_" + i,
      name: s.name,
      amount: s.amount,
      type: s.type,
      categoryId: s.category,
      sourceId: s.source,
      note: s.note,
      date: date.toISOString().split("T")[0],
      createdAt: date.getTime(),
    };
  });
}

export const FUND_TYPE_LABELS = {
  bank: "Bank",
  ewallet: "E-Wallet",
  crypto: "Crypto",
  cash: "Cash",
  investment: "Investasi",
  other: "Lainnya",
};

export const FUND_ICON_MAP = {
  bank: "landmark",
  ewallet: "smartphone",
  crypto: "bitcoin",
};

export const FUND_COLOR_MAP = {
  bank: "#3B82F6",
  ewallet: "#10B981",
  crypto: "#F59E0B",
};

export const CATEGORY_ICONS = [
  "shopping-cart",
  "utensils",
  "car",
  "home",
  "gamepad-2",
  "heart-pulse",
  "graduation-cap",
  "plane",
  "briefcase",
  "laptop",
  "gift",
  "trending-up",
];

export const CATEGORY_COLORS = [
  "#10B981",
  "#F43F5E",
  "#8B5CF6",
  "#3B82F6",
  "#F59E0B",
  "#EC4899",
];
