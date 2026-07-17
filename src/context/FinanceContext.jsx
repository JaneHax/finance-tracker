"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase";
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
          saveTimer.current = setTimeout(async () => {
            const { error } = await supabase
              .from("users")
              .update({ data: next })
              .eq("id", currentUser.id);
            if (error) {
              console.error("Save error:", error);
              showToast("Gagal menyimpan ke cloud", "error");
            }
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

      const { data: exists } = await supabase.rpc("username_exists", {
        p_username: username,
      });
      if (exists) throw new Error("Username sudah dipakai, coba yang lain");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("already registered"))
          throw new Error("Email sudah terdaftar");
        throw new Error(authError.message);
      }

      if (authData.session) {
        await supabase.auth.setSession(authData.session);
      }

      const userId = authData.user.id;

      const newUserState = {
        ...DEFAULT_STATE,
        username,
        user: { name: username, email, photoURL: null },
        hasUsername: true,
      };

      const { error: rpcError } = await supabase.rpc("create_user_profile", {
        p_id: userId,
        p_username: username,
        p_email: email,
        p_data: newUserState,
      });

      if (rpcError) throw new Error(rpcError.message);

      setState(newUserState);
      return authData.user;
    },
    []
  );

  const signIn = useCallback(
    async (identifier, password) => {
      identifier = identifier.trim();
      let email = identifier;

      if (!identifier.includes("@")) {
        const { data: foundEmail } = await supabase.rpc("get_email_by_username", {
          p_username: identifier,
        });
        if (!foundEmail) throw new Error("Username tidak ditemukan");
        email = foundEmail;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials"))
          throw new Error("Email atau password salah");
        throw new Error(error.message);
      }
    },
    []
  );

  const resetPassword = useCallback(
    async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase()
      );
      if (error) throw new Error(error.message);
      showToast("Link reset password telah dikirim", "success");
    },
    [showToast]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);

        try {
          const { data: userDoc, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (error && error.code !== "PGRST116") {
            // PGRST116 = not found
            console.error("Error loading user data:", error);
            showToast("Gagal memuat data", "error");
          }

          if (userDoc?.data) {
            const merged = {
              ...DEFAULT_STATE,
              ...userDoc.data,
              user: {
                name: userDoc.data.user?.name || userDoc.username || "User",
                email: session.user.email,
                photoURL: userDoc.data.user?.photoURL || null,
              },
            };
            setState(merged);
          } else {
            const email = session.user.email || "";
            const newUserState = {
              ...DEFAULT_STATE,
              username: email.split("@")[0],
              user: { name: email.split("@")[0], email, photoURL: null },
              hasUsername: true,
            };
            setState(newUserState);
            await supabase.rpc("create_user_profile", {
              p_id: session.user.id,
              p_username: email.split("@")[0],
              p_email: email,
              p_data: newUserState,
            });
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

    return () => subscription.unsubscribe();
  }, [showToast]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
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
        const { error } = await supabase
          .from("users")
          .update({ username, data: next })
          .eq("id", currentUser.id);
        if (error) console.error("saveUsername error:", error);
      }
    },
    [state, currentUser]
  );

  const skipUsername = useCallback(async () => {
    const next = { ...state, hasUsername: true };
    setState(next);
    if (currentUser) {
      const { error } = await supabase
        .from("users")
        .update({ data: next })
        .eq("id", currentUser.id);
      if (error) console.error("skipUsername error:", error);
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
        const res = await fetch(state.settings.spreadsheetUrl, {
          method: "POST",
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
        if (res.ok) {
          showToast("Tersinkron ke Sheets", "success");
        } else {
          showToast("Gagal sync: " + res.status, "error");
        }
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
