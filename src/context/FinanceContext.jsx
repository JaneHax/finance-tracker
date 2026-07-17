"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  onAuthStateChanged,
  createUser,
  signInUser,
  signOutUser,
  sendResetPassword,
  getDocById,
  setDocById,
  queryCollection,
} from "@/lib/firebase-rest";
import { DEFAULT_STATE } from "@/lib/defaults";

const FinanceContext = createContext(null);

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}

export function FinanceProvider({ children }) {
  const [state, setState] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [toasts, setToasts] = useState([]);
  const saveTimer = useRef(null);

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const updateState = useCallback(
    (updater, { save = true } = {}) => {
      setState((prev) => {
        const next =
          typeof updater === "function" ? updater(prev) : updater;
        if (save && currentUser) {
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => {
            setDocById("users", currentUser.uid, next).catch((e) => {
              console.error("Save error:", e);
              showToast("Gagal menyimpan ke cloud", "error");
            });
          }, 400);
        }
        return next;
      });
    },
    [currentUser, showToast]
  );

  const signUp = useCallback(
    async (email, username, password) => {
      email = email.trim().toLowerCase();
      username = username.trim();

      const results = await queryCollection("users", "username", username, 1);
      if (results.length > 0) {
        throw new Error("Username sudah dipakai, coba yang lain");
      }

      const cred = await createUser(email, password);

      const newUserState = {
        ...DEFAULT_STATE,
        username,
        user: { name: username, email, photoURL: null },
        hasUsername: true,
      };
      await setDocById("users", cred.uid, newUserState);
      setState(newUserState);
      return cred;
    },
    []
  );

  const signIn = useCallback(
    async (identifier, password) => {
      identifier = identifier.trim();
      let email = identifier;

      if (!identifier.includes("@")) {
        const results = await queryCollection("users", "username", identifier, 1);
        if (results.length === 0) {
          throw new Error("Username tidak ditemukan");
        }
        email = results[0].user.email;
      }

      await signInUser(email, password);
    },
    []
  );

  const resetPassword = useCallback(
    async (email) => {
      await sendResetPassword(email.trim().toLowerCase());
      showToast("Link reset password telah dikirim", "success");
    },
    [showToast]
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(async (user) => {
      setAuthReady(true);
      if (user) {
        setCurrentUser(user);

        try {
          const data = await getDocById("users", user.uid);
          if (data && data.user) {
            const merged = {
              ...DEFAULT_STATE,
              ...data,
              user: {
                name: data.user?.name || data.username || "User",
                email: data.email || user.email || "",
                photoURL: data.user?.photoURL || null,
              },
            };
            setState(merged);
          } else {
            const email = user.email || "";
            const newUserState = {
              ...DEFAULT_STATE,
              username: email.split("@")[0],
              user: { name: email.split("@")[0], email, photoURL: null },
              hasUsername: true,
            };
            setState(newUserState);
            await setDocById("users", user.uid, newUserState);
          }
        } catch (e) {
          console.error("Error loading user data:", e);
          showToast("Gagal memuat data", "error");
        }
      } else {
        setCurrentUser(null);
        setState(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [showToast]);

  const logout = useCallback(async () => {
    await signOutUser();
  }, []);

  const saveUsername = useCallback(
    async (username) => {
      const next = {
        ...state,
        username,
        user: { ...state.user, name: username || state.user.name },
        hasUsername: true,
      };
      setState(next);
      if (currentUser) {
        await setDocById("users", currentUser.uid, next);
      }
    },
    [state, currentUser]
  );

  const skipUsername = useCallback(async () => {
    const next = { ...state, hasUsername: true };
    setState(next);
    if (currentUser) {
      await setDocById("users", currentUser.uid, next);
    }
  }, [state, currentUser]);

  const getCategoryById = useCallback(
    (id) => {
      if (!state) return { name: "Lainnya", icon: "tag", color: "#71717A" };
      return (
        [...state.categories.expense, ...state.categories.income].find(
          (c) => c.id === id
        ) || { name: "Lainnya", icon: "tag", color: "#71717A" }
      );
    },
    [state]
  );

  const getFundSourceById = useCallback(
    (id) => {
      if (!state) return { name: "Unknown", icon: "wallet", color: "#71717A" };
      return (
        state.fundSources.find((f) => f.id === id) || {
          name: "Unknown",
          icon: "wallet",
          color: "#71717A",
        }
      );
    },
    [state]
  );

  const addTransaction = useCallback(
    (txn) => {
      updateState((prev) => {
        const next = { ...prev, transactions: [txn, ...prev.transactions] };
        const fs = next.fundSources.find((f) => f.id === txn.sourceId);
        if (fs) {
          if (txn.type === "income") fs.balance += txn.amount;
          else fs.balance -= txn.amount;
        }
        return next;
      });
    },
    [updateState]
  );

  const deleteTransaction = useCallback(
    (id) => {
      updateState((prev) => {
        const txn = prev.transactions.find((t) => t.id === id);
        const next = {
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
        };
        if (txn) {
          const fs = next.fundSources.find((f) => f.id === txn.sourceId);
          if (fs) {
            if (txn.type === "income") fs.balance -= txn.amount;
            else fs.balance += txn.amount;
          }
        }
        return next;
      });
    },
    [updateState]
  );

  const saveFundSource = useCallback(
    (fs) => {
      updateState((prev) => {
        if (prev.fundSources.some((f) => f.id === fs.id)) {
          return {
            ...prev,
            fundSources: prev.fundSources.map((f) =>
              f.id === fs.id ? fs : f
            ),
          };
        }
        return { ...prev, fundSources: [...prev.fundSources, fs] };
      });
    },
    [updateState]
  );

  const deleteFundSource = useCallback(
    (id) => {
      if (state?.transactions.some((t) => t.sourceId === id)) {
        showToast("Tidak bisa hapus, masih dipakai transaksi", "error");
        return false;
      }
      updateState((prev) => ({
        ...prev,
        fundSources: prev.fundSources.filter((f) => f.id !== id),
      }));
      return true;
    },
    [updateState, state, showToast]
  );

  const saveCategory = useCallback(
    (cat, type) => {
      updateState((prev) => ({
        ...prev,
        categories: {
          ...prev.categories,
          [type]: [...prev.categories[type], cat],
        },
      }));
    },
    [updateState]
  );

  const deleteCategory = useCallback(
    (id, type) => {
      if (state?.transactions.some((t) => t.categoryId === id)) {
        showToast("Tidak bisa hapus, dipakai transaksi", "error");
        return false;
      }
      updateState((prev) => ({
        ...prev,
        categories: {
          ...prev.categories,
          [type]: prev.categories[type].filter((c) => c.id !== id),
        },
      }));
      return true;
    },
    [updateState, state, showToast]
  );

  const connectSpreadsheet = useCallback(
    (url, sheetName) => {
      updateState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          spreadsheetConnected: true,
          spreadsheetUrl: url,
          sheetName,
        },
      }));
    },
    [updateState]
  );

  const disconnectSpreadsheet = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        spreadsheetConnected: false,
        spreadsheetUrl: "",
        autoSync: false,
      },
    }));
  }, [updateState]);

  const toggleAutoSync = useCallback(
    (value) => {
      updateState((prev) => ({
        ...prev,
        settings: { ...prev.settings, autoSync: value },
      }));
    },
    [updateState]
  );

  const syncToSpreadsheet = useCallback(
    async (txn) => {
      if (!state?.settings.spreadsheetUrl) return;
      try {
        await fetch(state.settings.spreadsheetUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheet: state.settings.sheetName,
            data: {
              ...txn,
              category: getCategoryById(txn.categoryId).name,
              source: getFundSourceById(txn.sourceId).name,
            },
          }),
        });
        showToast("Tersinkron ke Sheets", "success");
      } catch (e) {
        showToast("Gagal sync", "error");
      }
    },
    [state, getCategoryById, getFundSourceById, showToast]
  );

  const value = {
    state,
    setState: updateState,
    currentUser,
    loading,
    authReady,
    toasts,
    showToast,
    dismissToast: (id) =>
      setToasts((prev) => prev.filter((t) => t.id !== id)),
    signUp,
    signIn,
    resetPassword,
    logout,
    saveUsername,
    skipUsername,
    getCategoryById,
    getFundSourceById,
    addTransaction,
    deleteTransaction,
    saveFundSource,
    deleteFundSource,
    saveCategory,
    deleteCategory,
    connectSpreadsheet,
    disconnectSpreadsheet,
    toggleAutoSync,
    syncToSpreadsheet,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}
