"use client";
import { useState, useEffect } from "react";
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
import PositionSizerPage from "./pages/PositionSizerPage";
import { X } from "lucide-react";

const SHORTCUTS = [
  { key: "D", description: "Dashboard"       },
  { key: "J", description: "Journal"         },
  { key: "A", description: "Analytics"       },
  { key: "C", description: "Calendar"        },
  { key: "P", description: "Trade Plans"     },
  { key: "B", description: "Playbook"        },
  { key: "I", description: "Import Trades"   },
  { key: "E", description: "Export"          },
  { key: "N", description: "New Trade"       },
  { key: "/", description: "Show Shortcuts"  },
  { key: "Esc", description: "Close modal"   },
];

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300 }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(480px, 95vw)",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "16px", zIndex: 301,
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
              Keyboard Shortcuts
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Shortcuts are disabled while typing in any input
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "16px 24px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {SHORTCUTS.map(({ key, description }) => (
              <div key={key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", background: "var(--bg-secondary)",
                borderRadius: "8px",
              }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  {description}
                </span>
                <kbd style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: "28px", height: "24px", padding: "0 7px",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "5px", fontSize: "11px", fontWeight: "700",
                  color: "var(--accent-green)", fontFamily: "monospace",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                }}>
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function AppShell() {
  const { activePage, setActivePage, selectedTrade, setSelectedTrade, setTrades, trades } = useApp();
  const [showAddTrade, setShowAddTrade]         = useState(false);
  const [showShortcuts, setShowShortcuts]       = useState(false);

  const isEditorPage = activePage === "journal-editor";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement;
      const tag    = target.tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable;
      if (isTyping) return;

      switch (e.key) {
        case "d": case "D": setActivePage("dashboard");       break;
        case "j": case "J": setActivePage("journal");         break;
        case "a": case "A": setActivePage("analytics");       break;
        case "c": case "C": setActivePage("calendar");        break;
        case "p": case "P": setActivePage("plans");           break;
        case "b": case "B": setActivePage("playbook");        break;
        case "i": case "I": setActivePage("import");          break;
        case "e": case "E": setActivePage("export");          break;
        case "n": case "N": setShowAddTrade(true);            break;
        case "/":           setShowShortcuts((v) => !v);      break;
        case "Escape":
          setShowShortcuts(false);
          setShowAddTrade(false);
          setSelectedTrade(null);
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setActivePage, setSelectedTrade]);

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
        {activePage === "position-sizer" && <PositionSizerPage />}
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

      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
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
