"use client";
import TradePanel from "./components/TradePanel";
import PnLCalendar from "./components/PnLCalendar";
import Analytics from "./components/Analytics";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Calendar,
  Upload,
  PlusCircle,
  Settings,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
} from "lucide-react";
import ImportCSV from "./components/ImportCSV";
import { Trade } from "./lib/parseFidelityCSV";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: BookOpen, label: "Journal", id: "journal" },
  { icon: BarChart2, label: "Analytics", id: "analytics" },
  { icon: Calendar, label: "Calendar", id: "calendar" },
  { icon: Upload, label: "Import Trades", id: "import" },
];

function StatCard({
  label,
  value,
  sub,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  positive: boolean;
  icon: any;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>
          {label}
        </span>
        <Icon size={16} color={positive ? "var(--accent-green)" : "var(--accent-red)"} />
      </div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: "700",
          fontFamily: "'Syne', sans-serif",
          color: positive ? "var(--accent-green)" : "var(--accent-red)",
          marginBottom: "4px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );
}

export default function Home() {
  const [activePage, setActivePage] = useState("dashboard");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  useEffect(() => {
  const loadTrades = async () => {
    const res = await fetch("/api/trades");
    const data = await res.json();
    if (Array.isArray(data)) {
      setTrades(data.map((t: any) => ({
        ...t,
        tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags || [],
      })));
    }
    setLoading(false);
  };
  loadTrades();
}, []);
  
  const handleImport = async (imported: Trade[]) => {
  const res = await fetch("/api/trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trades: imported }),
  });
  if (res.ok) {
    setTrades((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newTrades = imported.filter((t) => !existingIds.has(t.id));
      return [...prev, ...newTrades].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
    setActivePage("dashboard");
  }
};

  // Calculate stats
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const wins = trades.filter((t) => t.status === "win");
  const losses = trades.filter((t) => t.status === "loss");
  const winRate = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "—";

  const stats = [
    {
      label: "Net P&L",
      value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`,
      sub: `${trades.length} total trades`,
      positive: totalPnl >= 0,
      icon: TrendingUp,
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      sub: `${wins.length} wins / ${losses.length} losses`,
      positive: winRate >= 50,
      icon: Target,
    },
    {
      label: "Profit Factor",
      value: String(profitFactor),
      sub: "Avg win / avg loss",
      positive: Number(profitFactor) >= 1,
      icon: Zap,
    },
    {
      label: "Avg Loss",
      value: `$${avgLoss.toFixed(2)}`,
      sub: "Per losing trade",
      positive: false,
      icon: TrendingDown,
    },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          minWidth: "220px",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
        }}
      >
        <div style={{ padding: "0 24px 32px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              background: "linear-gradient(135deg, #00e57a, #4d9fff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}
          >
            Tradello
          </h1>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            Trading Journal
          </p>
        </div>

        <nav style={{ flex: 1, padding: "0 12px" }}>
          {navItems.map(({ icon: Icon, label, id }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  marginBottom: "2px",
                  background: active ? "var(--accent-green-dim)" : "transparent",
                  color: active ? "var(--accent-green)" : "var(--text-secondary)",
                  fontSize: "14px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: active ? "600" : "400",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "0 12px 16px" }}>
          <button
            onClick={() => setActivePage("import")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--accent-green)",
              background: "var(--accent-green-dim)",
              color: "var(--accent-green)",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <PlusCircle size={15} />
            Add Trade
          </button>
        </div>

        <div style={{ padding: "16px 24px 0", borderTop: "1px solid var(--border)" }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              padding: "8px 0",
            }}
          >
            <Settings size={15} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto", background: "var(--bg-primary)", padding: "32px" }}>

        {/* DASHBOARD */}
        {activePage === "dashboard" && (
          <>
            <div style={{ marginBottom: "32px" }}>
              <h2 style={{ fontSize: "26px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
                Dashboard
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                Welcome back. Here's how you're performing.
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
              {stats.map((s) => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Trades Table or Empty State */}
            {trades.length === 0 ? (
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px dashed var(--border)",
                  borderRadius: "16px",
                  padding: "60px",
                  textAlign: "center",
                }}
              >
                <div style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: "var(--accent-green-dim)", display: "flex",
                  alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
                }}>
                  <Upload size={20} color="var(--accent-green)" />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>
                  No trades yet
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                  Import your Fidelity CSV or add a trade manually to get started.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button
                    onClick={() => setActivePage("import")}
                    style={{
                      padding: "10px 20px", borderRadius: "8px", border: "none",
                      background: "var(--accent-green)", color: "#000",
                      fontSize: "13px", fontWeight: "600",
                      fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                    }}
                  >
                    Import CSV
                  </button>
                  <button
                    style={{
                      padding: "10px 20px", borderRadius: "8px",
                      border: "1px solid var(--border)", background: "transparent",
                      color: "var(--text-primary)", fontSize: "13px",
                      fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                    }}
                  >
                    Add Manually
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
                    Trade History
                  </h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                        {["Date", "Symbol", "Type", "Strike", "Expiry", "Qty", "Entry", "Exit", "P&L", "Status"].map((h) => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: "600", whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade) => (
                        <tr
                          key={trade.id}
                          style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                          onClick={() => setSelectedTrade(trade)}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{trade.date}</td>
                          <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: "700" }}>{trade.underlying}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                              background: trade.optionType === "call" ? "rgba(77,159,255,0.15)" : "rgba(255,77,106,0.15)",
                              color: trade.optionType === "call" ? "var(--accent-blue)" : "var(--accent-red)",
                            }}>
                              {trade.optionType ? trade.optionType.toUpperCase() : trade.type.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                            {trade.strike ? `$${trade.strike}` : "—"}
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                            {trade.expiry || "—"}
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{trade.quantity}</td>
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>${trade.entryPrice}</td>
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>${trade.exitPrice}</td>
                          <td style={{ padding: "12px 16px", fontWeight: "700", color: trade.pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                            {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                              background: trade.status === "win" ? "var(--accent-green-dim)" : "var(--accent-red-dim)",
                              color: trade.status === "win" ? "var(--accent-green)" : "var(--accent-red)",
                            }}>
                              {trade.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* IMPORT PAGE */}
        {activePage === "import" && (
          <>
            <div style={{ marginBottom: "32px" }}>
              <h2 style={{ fontSize: "26px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
                Import Trades
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                Upload your Fidelity CSV export to automatically import your trades.
              </p>
            </div>
            <ImportCSV onImport={handleImport} />
          </>
        )}

        {/* CALENDAR PAGE */}
        {activePage === "calendar" && (
          <PnLCalendar
            trades={trades}
            onSelectTrade={(trade) => setSelectedTrade(trade)}
          />
        )}

        {/* ANALYTICS PAGE */}
        {activePage === "analytics" && (
          <Analytics trades={trades} />
        )}

        {/* COMING SOON PAGES */}
        {["journal"].includes(activePage) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "12px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>
              {navItems.find(n => n.id === activePage)?.label}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Coming soon — we're building this next! 🚀</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "48px", color: "var(--text-muted)", fontSize: "12px" }}>
          Made with ❤️ by The Quantum Dev
        </div>
      </main>
      <TradePanel
        trade={selectedTrade}
        onClose={() => setSelectedTrade(null)}
        onSave={(updated) => {
          setTrades((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
          );
          setSelectedTrade(updated);
        }}
      />
    </div>
  );
}