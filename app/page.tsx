"use client";
import { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import TradePanel from "./components/TradePanel";
import AddTradeModal from "./components/AddTradeModal";
import Dashboard from "./pages/Dashboard";
import ImportPage from "./pages/ImportPage";
import CalendarPage from "./pages/CalendarPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import JournalPage from "./pages/JournalPage";
import JournalEditorPage from "./pages/JournalEditorPage";
import AccountsPage from "./pages/AccountsPage";
import SettingsPage from "./pages/SettingsPage";
import ExportPage from "./pages/ExportPage";
import PlansPage from "./pages/PlansPage";
import PlaybookPage from "./pages/PlaybookPage";

function AppShell() {
  const { activePage, selectedTrade, setSelectedTrade, setTrades, trades } = useApp();
  const [showAddTrade, setShowAddTrade] = useState(false);

  const isEditorPage = activePage === "journal-editor";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar onAddTrade={() => setShowAddTrade(true)} />

      <main style={{
        flex: 1,
        overflow: isEditorPage ? "hidden" : "auto",
        background: "var(--bg-primary)",
        padding: "32px",
        display: isEditorPage ? "flex" : "block",
        flexDirection: isEditorPage ? "column" : undefined,
      }}>
        {activePage === "dashboard"      && <Dashboard onAddTrade={() => setShowAddTrade(true)} />}
        {activePage === "journal"        && <JournalPage />}
        {activePage === "journal-editor" && <JournalEditorPage />}
        {activePage === "analytics"      && <AnalyticsPage />}
        {activePage === "calendar"       && <CalendarPage />}
        {activePage === "plans"          && <PlansPage />}
        {activePage === "playbook"       && <PlaybookPage />}
        {activePage === "import"         && <ImportPage />}
        {activePage === "accounts"       && <AccountsPage />}
        {activePage === "export"         && <ExportPage />}
        {activePage === "settings"       && <SettingsPage />}

        {!isEditorPage && (
          <div style={{
            textAlign: "center", marginTop: "48px",
            color: "var(--text-muted)", fontSize: "12px",
          }}>
            Made with ❤️ by The Quantum Dev
          </div>
        )}
      </main>

      <TradePanel
        trade={selectedTrade}
        onClose={() => setSelectedTrade(null)}
        onSave={(updated) => {
          setTrades(trades.map((t) => t.id === updated.id ? updated : t));
          setSelectedTrade(updated);
        }}
      />

      {showAddTrade && (
        <AddTradeModal onClose={() => setShowAddTrade(false)} />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

