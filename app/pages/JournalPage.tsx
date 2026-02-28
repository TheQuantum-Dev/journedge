"use client";
import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { Trade } from "../lib/types";
import { ChevronDown, ChevronUp, Search, Tag, TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface DayGroup {
  date: string;
  trades: Trade[];
  totalPnl: number;
  wins: number;
  losses: number;
}

function groupByDay(trades: Trade[]): DayGroup[] {
  const map: Record<string, Trade[]> = {};
  for (const t of trades) {
    if (!map[t.date]) map[t.date] = [];
    map[t.date].push(t);
  }
  return Object.entries(map)
    .map(([date, trades]) => ({
      date,
      trades,
      totalPnl: trades.reduce((s, t) => s + t.pnl, 0),
      wins: trades.filter((t) => t.status === "win").length,
      losses: trades.filter((t) => t.status === "loss").length,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function TradeCard({ trade, onOpen }: { trade: Trade; onOpen: (t: Trade) => void }) {
  const tags = Array.isArray(trade.tags) ? trade.tags : [];
  const images = Array.isArray(trade.imageUrls) ? trade.imageUrls : [];

  return (
    <div
      onClick={() => onOpen(trade)}
      style={{
        background: "var(--bg-secondary)", borderRadius: "10px",
        padding: "14px 16px", cursor: "pointer",
        border: "1px solid var(--border)",
        transition: "border-color 0.15s ease",
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = trade.pnl >= 0 ? "#00e57a" : "#ff4d6a"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: "700", color: "#f0f0ff" }}>
            {trade.underlying}
          </span>
          <span style={{
            padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: "600",
            background: trade.optionType === "call" ? "rgba(77,159,255,0.15)" : "rgba(255,77,106,0.15)",
            color: trade.optionType === "call" ? "#4d9fff" : "#ff4d6a",
          }}>
            {trade.optionType ? trade.optionType.toUpperCase() : trade.type.toUpperCase()}
          </span>
          {trade.strike && (
            <span style={{ fontSize: "11px", color: "#8888aa" }}>
              ${trade.strike} · {trade.expiry}
            </span>
          )}
        </div>
        <div style={{
          fontSize: "16px", fontWeight: "700",
          color: trade.pnl >= 0 ? "#00e57a" : "#ff4d6a",
        }}>
          {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", gap: "16px", marginBottom: tags.length || trade.journalEntry || images.length ? "10px" : "0" }}>
        {trade.entryTime && (
          <span style={{ fontSize: "11px", color: "#8888aa" }}>
            Entry: {trade.entryTime}
          </span>
        )}
        {trade.exitTime && (
          <span style={{ fontSize: "11px", color: "#8888aa" }}>
            Exit: {trade.exitTime}
          </span>
        )}
        {trade.rr && (
          <span style={{ fontSize: "11px", color: "#8888aa" }}>
            R:R {trade.rr}
          </span>
        )}
        <span style={{ fontSize: "11px", color: "#8888aa" }}>
          Qty: {trade.quantity}
        </span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
          {tags.map((tag: string) => (
            <span key={tag} style={{
              padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "600",
              background: "rgba(0,229,122,0.1)", color: "#00e57a",
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Journal Preview */}
      {trade.journalEntry && (
        <p style={{
          fontSize: "12px", color: "#8888aa", marginBottom: images.length ? "8px" : "0",
          lineHeight: "1.5", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}>
          {trade.journalEntry}
        </p>
      )}

      {/* Image thumbnails */}
      {images.length > 0 && (
        <div style={{ display: "flex", gap: "6px" }}>
          {images.slice(0, 3).map((url: string, i: number) => (
            <img
              key={i} src={url} alt="chart"
              style={{ width: "48px", height: "36px", borderRadius: "4px", objectFit: "cover" }}
            />
          ))}
          {images.length > 3 && (
            <div style={{
              width: "48px", height: "36px", borderRadius: "4px",
              background: "var(--bg-card)", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: "11px", color: "#8888aa",
            }}>
              +{images.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DayCard({ group, onOpenTrade }: { group: DayGroup; onOpenTrade: (t: Trade) => void }) {
  const [expanded, setExpanded] = useState(true);
  const isGreen = group.totalPnl >= 0;

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "16px", overflow: "hidden", marginBottom: "16px",
    }}>
      {/* Day Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", padding: "16px 20px", background: "transparent",
          border: "none", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Date */}
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#f0f0ff" }}>
              {new Date(group.date).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
            </div>
            <div style={{ fontSize: "11px", color: "#8888aa", marginTop: "2px" }}>
              {group.trades.length} trade{group.trades.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Win/Loss pills */}
          <div style={{ display: "flex", gap: "6px" }}>
            {group.wins > 0 && (
              <span style={{
                padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                background: "rgba(0,229,122,0.1)", color: "#00e57a",
              }}>
                {group.wins}W
              </span>
            )}
            {group.losses > 0 && (
              <span style={{
                padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                background: "rgba(255,77,106,0.1)", color: "#ff4d6a",
              }}>
                {group.losses}L
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            fontSize: "18px", fontWeight: "700",
            color: isGreen ? "#00e57a" : "#ff4d6a",
          }}>
            {isGreen ? "+" : ""}${group.totalPnl.toFixed(2)}
          </div>
          {expanded
            ? <ChevronUp size={16} color="#8888aa" />
            : <ChevronDown size={16} color="#8888aa" />
          }
        </div>
      </button>

      {/* Trade Cards */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {group.trades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} onOpen={onOpenTrade} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  const { trades, setSelectedTrade } = useApp();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "win" | "loss">("all");
  const [filterTag, setFilterTag] = useState("");

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of trades) {
      const tags = Array.isArray(t.tags) ? t.tags : [];
      tags.forEach((tag: string) => set.add(tag));
    }
    return Array.from(set);
  }, [trades]);

  // Filter trades
  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterTag && !(Array.isArray(t.tags) ? t.tags : []).includes(filterTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        const notes = (t.journalEntry || "").toLowerCase();
        const symbol = t.underlying.toLowerCase();
        if (!notes.includes(q) && !symbol.includes(q)) return false;
      }
      return true;
    });
  }, [trades, filterStatus, filterTag, search]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  // Stats strip
  const bestDay = groups.reduce((best, g) => g.totalPnl > best ? g.totalPnl : best, -Infinity);
  const worstDay = groups.reduce((worst, g) => g.totalPnl < worst ? g.totalPnl : worst, Infinity);
  const avgDay = groups.length > 0
    ? groups.reduce((s, g) => s + g.totalPnl, 0) / groups.length
    : 0;

  if (trades.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "12px" }}>
        <Calendar size={32} color="#8888aa" />
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#f0f0ff" }}>No trades yet</h2>
        <p style={{ color: "#8888aa", fontSize: "14px" }}>Import trades to start your journal</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "700", color: "#f0f0ff", letterSpacing: "-0.5px" }}>
          Journal
        </h2>
        <p style={{ color: "#8888aa", fontSize: "14px", marginTop: "4px" }}>
          Your trading diary — review every day and every trade
        </p>
      </div>

      {/* Stats Strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "12px", marginBottom: "24px",
      }}>
        {[
          { label: "Days Traded", value: String(groups.length), icon: Calendar, positive: true },
          { label: "Best Day", value: `+$${bestDay === -Infinity ? "0.00" : bestDay.toFixed(2)}`, icon: TrendingUp, positive: true },
          { label: "Worst Day", value: `$${worstDay === Infinity ? "0.00" : worstDay.toFixed(2)}`, icon: TrendingDown, positive: false },
          { label: "Avg Day", value: `${avgDay >= 0 ? "+" : ""}$${avgDay.toFixed(2)}`, icon: TrendingUp, positive: avgDay >= 0 },
        ].map(({ label, value, icon: Icon, positive }) => (
          <div key={label} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: "#8888aa", fontWeight: "600" }}>{label}</span>
              <Icon size={14} color={positive ? "#00e57a" : "#ff4d6a"} />
            </div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: positive ? "#00e57a" : "#ff4d6a" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", gap: "12px", marginBottom: "24px",
        alignItems: "center", flexWrap: "wrap",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} color="#8888aa" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes or symbol..."
            style={{
              width: "100%", padding: "9px 12px 9px 34px", borderRadius: "8px",
              border: "1px solid var(--border)", background: "var(--bg-card)",
              color: "#f0f0ff", fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
              boxSizing: "border-box" as const,
            }}
          />
        </div>

        {/* Win/Loss filter */}
        {(["all", "win", "loss"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "1px solid",
              borderColor: filterStatus === status
                ? status === "win" ? "#00e57a" : status === "loss" ? "#ff4d6a" : "#8888aa"
                : "var(--border)",
              background: filterStatus === status
                ? status === "win" ? "rgba(0,229,122,0.1)" : status === "loss" ? "rgba(255,77,106,0.1)" : "rgba(136,136,170,0.1)"
                : "transparent",
              color: filterStatus === status
                ? status === "win" ? "#00e57a" : status === "loss" ? "#ff4d6a" : "#f0f0ff"
                : "#8888aa",
              fontSize: "12px", fontWeight: "600", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {status === "all" ? "All" : status === "win" ? "Wins" : "Losses"}
          </button>
        ))}

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div style={{ position: "relative" }}>
            <Tag size={12} color="#8888aa" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              style={{
                padding: "8px 12px 8px 28px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "var(--bg-card)",
                color: filterTag ? "#00e57a" : "#8888aa",
                fontSize: "12px", fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer", appearance: "none" as const,
              }}
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Day Groups */}
      {groups.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px",
          color: "#8888aa", fontSize: "14px",
        }}>
          No trades match your filters
        </div>
      ) : (
        groups.map((group) => (
          <DayCard
            key={group.date}
            group={group}
            onOpenTrade={(trade) => setSelectedTrade(trade)}
          />
        ))
      )}
    </div>
  );
}