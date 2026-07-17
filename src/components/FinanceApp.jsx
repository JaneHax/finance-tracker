"use client";

import { useState, useEffect, useCallback } from "react";
import { FinanceProvider, useFinance } from "@/context/FinanceContext";
import LoginScreen from "@/components/LoginScreen";
import UsernamePopup from "@/components/UsernamePopup";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import TransactionsPage from "@/components/TransactionsPage";
import ReportsPage from "@/components/ReportsPage";
import SettingsPage from "@/components/SettingsPage";
import ToastContainer from "@/components/ui/ToastContainer";
import AddTransactionModal from "@/components/modals/AddTransactionModal";
import FundSourceModal from "@/components/modals/FundSourceModal";
import CategoryModal from "@/components/modals/CategoryModal";
import SpreadsheetModal from "@/components/modals/SpreadsheetModal";
import LogoutModal from "@/components/modals/LogoutModal";

function AppContent() {
  const { state, currentUser, loading, authReady, logout, showToast } = useFinance();
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showUsername, setShowUsername] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [showFundSource, setShowFundSource] = useState(false);
  const [editingFundId, setEditingFundId] = useState(null);
  const [showCategory, setShowCategory] = useState(false);
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  useEffect(() => {
    if (loading || !authReady) {
      const timer = setTimeout(() => setLoadTimeout(true), 15000);
      return () => clearTimeout(timer);
    }
  }, [loading, authReady]);

  useEffect(() => {
    if (state && !state.hasUsername) {
      setEditMode(false);
      setShowUsername(true);
    }
  }, [state]);

  const navigateTo = useCallback(
    (page) => {
      setActivePage(page);
      setSidebarOpen(false);
      if (page === "transactions") setSearch("");
    },
    []
  );

  const handleSearch = useCallback(
    (value) => {
      setSearch(value);
      if (value && activePage !== "transactions") {
        setActivePage("transactions");
      }
    },
    [activePage]
  );

  const handleEditProfile = () => {
    setEditMode(true);
    setShowUsername(true);
  };

  const handleAddFundSource = () => {
    setEditingFundId(null);
    setShowFundSource(true);
  };

  const handleEditFundSource = (id) => {
    setEditingFundId(id);
    setShowFundSource(true);
  };

  const handleLogout = () => {
    logout();
    setShowLogout(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("searchInput")?.focus();
      }
      if (e.key === "Escape") {
        setShowAddTxn(false);
        setShowFundSource(false);
        setShowCategory(false);
        setShowSpreadsheet(false);
        setShowLogout(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!authReady || loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#08090D",
          color: "#71717A",
          fontSize: 14,
          gap: 16,
        }}
      >
        <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        {loadTimeout ? (
          <>
            <p>Memuat lama? Coba refresh halaman (F5)</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Refresh
            </button>
          </>
        ) : (
          <p>Memuat...</p>
        )}
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Logged in but no state yet
  if (!state) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#08090D",
          color: "#71717A",
          fontSize: 14,
        }}
      >
        Memuat data...
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <Sidebar
        activePage={activePage}
        onNavigate={navigateTo}
        onAddTransaction={() => setShowAddTxn(true)}
        onOpenSpreadsheet={() => {
          navigateTo("settings");
          setTimeout(() => setShowSpreadsheet(true), 300);
        }}
        onLogout={() => setShowLogout(true)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="lg:ml-64 min-h-screen flex flex-col">
        <Header
          onMenu={() => setSidebarOpen(true)}
          onAddTransaction={() => setShowAddTxn(true)}
          onSearch={handleSearch}
          searchValue={search}
        />

        <div className="flex-1 p-5 lg:p-7">
          <div className={activePage === "dashboard" ? "block" : "hidden"}>
            <Dashboard onNavigate={navigateTo} />
          </div>
          <div className={activePage === "transactions" ? "block" : "hidden"}>
            <TransactionsPage externalSearch={search} />
          </div>
          <div className={activePage === "reports" ? "block" : "hidden"}>
            <ReportsPage />
          </div>
          <div className={activePage === "settings" ? "block" : "hidden"}>
            <SettingsPage
              onEditProfile={handleEditProfile}
              onAddFundSource={handleAddFundSource}
              onEditFundSource={handleEditFundSource}
              onAddCategory={() => setShowCategory(true)}
              onOpenSpreadsheet={() => setShowSpreadsheet(true)}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <UsernamePopup
        show={showUsername}
        onClose={() => setShowUsername(false)}
        editMode={editMode}
      />
      <AddTransactionModal show={showAddTxn} onClose={() => setShowAddTxn(false)} />
      <FundSourceModal
        show={showFundSource}
        onClose={() => setShowFundSource(false)}
        editingId={editingFundId}
      />
      <CategoryModal show={showCategory} onClose={() => setShowCategory(false)} />
      <SpreadsheetModal show={showSpreadsheet} onClose={() => setShowSpreadsheet(false)} />
      <LogoutModal
        show={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />

      <ToastContainer />
    </div>
  );
}

export default function FinanceApp() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
