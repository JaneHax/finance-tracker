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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  reload,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_STATE, generateSampleTransactions } from "@/lib/defaults";

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
  const [emailVerified, setEmailVerified] = useState(false);
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
            setDoc(doc(db, "users", currentUser.uid), next).catch((e) => {
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

  // Sign up with email, username, password
  const signUp = useCallback(
    async (email, username, password) => {
      email = email.trim().toLowerCase();
      username = username.trim();

      // Check username uniqueness
      const q = query(
        collection(db, "users"),
        where("username", "==", username),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error("Username sudah dipakai, coba yang lain");
      }

      // Create auth account
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Create user doc in Firestore
      const newUserState = {
        ...DEFAULT_STATE,
        username,
        user: {
          name: username,
          email,
          photoURL: null,
        },
        hasUsername: true,
        transactions: generateSampleTransactions(),
      };
      await setDoc(doc(db, "users", cred.user.uid), newUserState);
      // Override state in case onAuthStateChanged set a default already
      setState(newUserState);
      return cred.user;
    },
    []
  );

  // Sign in with email or username + password
  const signIn = useCallback(
    async (identifier, password) => {
      identifier = identifier.trim();
      let email = identifier;

      // If it doesn't look like an email, treat as username
      if (!identifier.includes("@")) {
        const q = query(
          collection(db, "users"),
          where("username", "==", identifier),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          throw new Error("Username tidak ditemukan");
        }
        email = snap.docs[0].data().user.email;
      }

      await signInWithEmailAndPassword(auth, email, password);
    },
    []
  );

  const resendVerification = useCallback(async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      showToast("Email verifikasi telah dikirim ulang", "success");
    }
  }, [showToast]);

  const reloadUser = useCallback(async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      const verified = auth.currentUser.emailVerified;
      setEmailVerified(verified);
      if (verified) {
        // User baru verified — load Firestore data
        try {
          const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            const merged = {
              ...DEFAULT_STATE,
              ...data,
              user: {
                name: data.user?.name || data.username || "User",
                email: auth.currentUser.email,
                photoURL: data.user?.photoURL || null,
              },
            };
            setState(merged);
          } else {
            const newUserState = {
              ...DEFAULT_STATE,
              username: auth.currentUser.email.split("@")[0],
              user: {
                name: auth.currentUser.email.split("@")[0],
                email: auth.currentUser.email,
                photoURL: null,
              },
              hasUsername: true,
              transactions: generateSampleTransactions(),
            };
            setState(newUserState);
            await setDoc(doc(db, "users", auth.currentUser.uid), newUserState);
          }
        } catch (e) {
          console.error("Error loading user data after verify:", e);
        }
        showToast("Email terverifikasi!", "success");
      }
    }
  }, [showToast]);

  const resetPassword = useCallback(
    async (email) => {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      showToast("Link reset password telah dikirim", "success");
    },
    [showToast]
  );

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthReady(true);
      if (user) {
        setCurrentUser(user);

        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            const merged = {
              ...DEFAULT_STATE,
              ...data,
              user: {
                name: data.user?.name || data.username || "User",
                email: user.email,
                photoURL: data.user?.photoURL || null,
              },
            };
            setState(merged);
          } else {
            const newUserState = {
              ...DEFAULT_STATE,
              username: user.email.split("@")[0],
              user: {
                name: user.email.split("@")[0],
                email: user.email,
                photoURL: null,
              },
              hasUsername: true,
              transactions: generateSampleTransactions(),
            };
            setState(newUserState);
            await setDoc(doc(db, "users", user.uid), newUserState);
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
    return () => unsub();
  }, [showToast]);

  const logout = useCallback(async () => {
    await signOut(auth);
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
        await setDoc(doc(db, "users", currentUser.uid), next);
      }
    },
    [state, currentUser]
  );

  const skipUsername = useCallback(async () => {
    const next = { ...state, hasUsername: true };
    setState(next);
    if (currentUser) {
      await setDoc(doc(db, "users", currentUser.uid), next);
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
    resendVerification,
    reloadUser,
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
