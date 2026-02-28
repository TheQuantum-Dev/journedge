"use client";
import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Target, Zap, Upload, Search, X, ChevronDown } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Trade } from "../lib/types";

function StatCard({ label, value, sub, positive, icon: Icon }: {
  label: string; value: string; sub: string;
  positive: boolean; icon: any;
}) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "12px", padding: "20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>{label}</span>
        <Icon size={16} color={positive ? "#00e57a" : "#ff4d6a"} />
      </div>
      <div style={{
        fontSize: "24px", fontWeight: "700", fontFamily: "'Syne', sans-serif",
        color: positive ? "#00e57a" : "#ff4d6a", marginBottom: "4px",
      }}>
        {value}
      </div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "8px 30px 8px 12px", borderRadius: "8px",
  border: "1px solid var(--border)", background: "var(--bg-card)",
  color: "#f0f0ff", fontSize: "12px", fontFamily: "'DM Sans', sans-serif",
  cursor: "pointer", appearance: "none", WebkitAppearance: "none",
  outline: "none",
};

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      {children}
      <ChevronDown size={12} color="#8888aa" style={{
        position: "absolute", right: "10px", top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none",
      }} />
    </div>
  );
}

export default function Dashboard() {
  const { trades, setActivePage, setSelectedTrade } = useApp();

  // Filter state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSymbol, setFilterSymbol] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Unique symbols and tags for dropdowns
  const symbols = useMemo(() => {
    const set = new Set(trades.map((t) => t.underlying));
    return Array.from(set).sort();
  }, [trades]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of trades) {
      const tags = Array.isArray(t.tags) ? t.tags : [];
      tags.forEach((tag: string) => set.add(tag));
    }
    return Array.from(set).sort();
  }, [trades]);

  // Active filter count
  const activeFilterCount = [
    search, filterStatus !== "all" ? filterStatus : "",
    filterSymbol, filterTag, filterFrom, filterTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterSymbol("");
    setFilterTag("");
    setFilterFrom("");
    setFilterTo("");
  };

  // Apply filters
  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterSymbol && t.underlying !== filterSymbol) return false;
      if (filterTag && !(Array.isArray(t.tags) ? t.tags : []).includes(filterTag)) return false;
      if (filterFrom) {
        const from = new Date(filterFrom).getTime();
        const tradeDate = new Date(t.date).getTime();
        if (tradeDate < from) return false;
      }
      if (filterTo) {
        const to = new Date(filterTo).getTime();
        const tradeDate = new Date(t.date).getTime();
        if (tradeDate > to) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!t.underlying.toLowerCase().includes(q) &&
            !t.symbol.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [trades, search, filterStatus, filterSymbol, filterTag, filterFrom, filterTo]);

  // Stats from filtered trades
  const totalPnl = filtered.reduce((sum, t) => sum + t.pnl, 0);
  const wins = filtered.filter((t) => t.status === "win");
  const losses = filtered.filter((t) => t.status === "loss");
  const winRate = filtered.length > 0 ? Math.round((wins.length / filtered.length) * 100) : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "—";

  const stats = [
    {
      label: activeFilterCount > 0 ? "Filtered P&L" : "Net P&L",
      value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`,
      sub: `${filtered.length} trade${filtered.length !== 1 ? "s" : ""}${activeFilterCount > 0 ? " (filtered)" : ""}`,
      positive: totalPnl >= 0, icon: TrendingUp,
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      sub: `${wins.length}W / ${losses.length}L`,
      positive: winRate >= 50, icon: Target,
    },
    {
      label: "Profit Factor",
      value: String(profitFactor),
      sub: "Avg win / avg loss",
      positive: Number(profitFactor) >= 1, icon: Zap,
    },
    {
      label: "Avg Loss",
      value: `$${avgLoss.toFixed(2)}`,
      sub: "Per losing trade",
      positive: false, icon: TrendingDown,
    },
  ];

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontSize: "26px", fontWeight: "700",
          color: "var(--text-primary)", letterSpacing: "-0.5px",
        }}>
          Dashboard
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
          Welcome back. Here's how you're performing.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px", marginBottom: "32px",
      }}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Empty State */}
      {trades.length === 0 ? (
        <div style={{
          background: "var(--bg-card)", border: "1px dashed var(--border)",
          borderRadius: "16px", padding: "60px", textAlign: "center",
        }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "12px",
            background: "var(--accent-green-dim)", display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
          }}>
            <Upload size={20} color="#00e57a" />
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
                background: "#00e57a", color: "#000", fontSize: "13px",
                fontWeight: "600", fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
              }}
            >
              Import CSV
            </button>
            <button style={{
              padding: "10px 20px", borderRadius: "8px",
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-primary)", fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
            }}>
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "16px", overflow: "hidden",
        }}>
          {/* Table Header */}
          <div style={{
            padding: "20px 24px 0",
            borderBottom: "1px solid var(--border)",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
                  Trade History
                </h3>
                {activeFilterCount > 0 && (
                  <span style={{
                    background: "rgba(0,229,122,0.15)", color: "#00e57a",
                    fontSize: "11px", fontWeight: "700", padding: "2px 8px",
                    borderRadius: "20px",
                  }}>
                    {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
                  </span>
                )}
                {filtered.length !== trades.length && (
                  <span style={{ fontSize: "12px", color: "#8888aa" }}>
                    Showing {filtered.length} of {trades.length}
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#ff4d6a", fontSize: "12px", fontFamily: "'DM Sans', sans-serif",
                    fontWeight: "600",
                  }}
                >
                  <X size={12} />
                  Clear filters
                </button>
              )}
            </div>

            {/* Filter Bar */}
            <div style={{
              display: "flex", gap: "10px", flexWrap: "wrap",
              paddingBottom: "16px",
            }}>
              {/* Search */}
              <div style={{ position: "relative", flex: "1", minWidth: "160px" }}>
                <Search size={13} color="#8888aa" style={{
                  position: "absolute", left: "10px", top: "50%",
                  transform: "translateY(-50%)",
                }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search symbol..."
                  style={{
                    width: "100%", padding: "8px 12px 8px 30px",
                    borderRadius: "8px", border: "1px solid var(--border)",
                    background: "var(--bg-secondary)", color: "#f0f0ff",
                    fontSize: "12px", fontFamily: "'DM Sans', sans-serif",
                    boxSizing: "border-box" as const, outline: "none",
                  }}
                />
              </div>

              {/* Status */}
              <SelectWrap>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
                  <option value="all">All Status</option>
                  <option value="win">Wins</option>
                  <option value="loss">Losses</option>
                  <option value="breakeven">Breakeven</option>
                </select>
              </SelectWrap>

              {/* Symbol */}
              {symbols.length > 0 && (
                <SelectWrap>
                  <select value={filterSymbol} onChange={(e) => setFilterSymbol(e.target.value)} style={selectStyle}>
                    <option value="">All Symbols</option>
                    {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </SelectWrap>
              )}

              {/* Tag */}
              {allTags.length > 0 && (
                <SelectWrap>
                  <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={selectStyle}>
                    <option value="">All Tags</option>
                    {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                  </select>
                </SelectWrap>
              )}

              {/* Date From */}
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                style={{
                  ...selectStyle,
                  padding: "8px 12px",
                  colorScheme: "dark",
                }}
              />

              {/* Date To */}
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                style={{
                  ...selectStyle,
                  padding: "8px 12px",
                  colorScheme: "dark",
                }}
              />
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#8888aa", fontSize: "14px" }}>
              No trades match your filters.{" "}
              <button onClick={clearFilters} style={{
                background: "none", border: "none", color: "#00e57a",
                cursor: "pointer", fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
              }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                    {["Date", "Symbol", "Type", "Strike", "Expiry", "Qty", "Entry", "Exit", "P&L", "Status"].map((h) => (
                      <th key={h} style={{
                        padding: "10px 16px", textAlign: "left",
                        color: "var(--text-muted)", fontWeight: "600", whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((trade: Trade) => (
                    <tr
                      key={trade.id}
                      onClick={() => setSelectedTrade(trade)}
                      style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{trade.date}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: "700" }}>{trade.underlying}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                          background: trade.optionType === "call" ? "rgba(77,159,255,0.15)" : "rgba(255,77,106,0.15)",
                          color: trade.optionType === "call" ? "#4d9fff" : "#ff4d6a",
                        }}>
                          {trade.optionType ? trade.optionType.toUpperCase() : trade.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{trade.strike ? `$${trade.strike}` : "—"}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{trade.expiry || "—"}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{trade.quantity}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>${trade.entryPrice}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>${trade.exitPrice}</td>
                      <td style={{
                        padding: "12px 16px", fontWeight: "700",
                        color: trade.pnl >= 0 ? "#00e57a" : "#ff4d6a",
                      }}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                          background: trade.status === "win" ? "var(--accent-green-dim)" : "var(--accent-red-dim)",
                          color: trade.status === "win" ? "#00e57a" : "#ff4d6a",
                        }}>
                          {trade.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}