"use client";
import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { Trade } from "../lib/types";
import {
  ChevronDown, ChevronUp, Search, Tag,
  TrendingUp, TrendingDown, BookOpen,
  MessageSquare, Image as ImageIcon, ExternalLink,
} from "lucide-react";

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
      date, trades,
      totalPnl: trades.reduce((s, t) => s + t.pnl, 0),
      wins: trades.filter((t) => t.status === "win").length,
      losses: trades.filter((t) => t.status === "loss").length,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function TradeCard({
  trade,
  onOpen,
  onOpenEditor,
}: {
  trade: Trade;
  onOpen: (t: Trade) => void;
  onOpenEditor: (t: Trade) => void;
}) {
  const tags = Array.isArray(trade.tags) ? trade.tags : [];
  const images = Array.isArray(trade.imageUrls) ? trade.imageUrls : [];
  const isWin = trade.pnl >= 0;

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        overflow: "hidden",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isWin ? "rgba(0,229,122,0.4)" : "rgba(255,77,106,0.4)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = isWin
          ? "0 4px 20px rgba(0,229,122,0.08)"
          : "0 4px 20px rgba(255,77,106,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Accent bar */}
      <div style={{
        height: "3px",
        background: isWin
          ? "linear-gradient(90deg, #00e57a, #4d9fff)"
          : "linear-gradient(90deg, #ff4d6a, #ff8c69)",
      }} />

      <div style={{ padding: "14px 16px" }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
              {trade.underlying}
            </span>
            <span style={{
              padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700",
              background: trade.optionType === "call"
                ? "rgba(77,159,255,0.12)" : "rgba(255,77,106,0.12)",
              color: trade.optionType === "call" ? "#4d9fff" : "#ff4d6a",
              letterSpacing: "0.3px",
            }}>
              {trade.optionType ? trade.optionType.toUpperCase() : trade.type.toUpperCase()}
            </span>
            {trade.strike && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                ${trade.strike} · {trade.expiry}
              </span>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: "17px", fontWeight: "800",
              color: isWin ? "#00e57a" : "#ff4d6a",
            }}>
              {isWin ? "+" : ""}${trade.pnl.toFixed(2)}
            </div>
            <div style={{
              fontSize: "10px", fontWeight: "600",
              color: isWin ? "#00e57a" : "#ff4d6a",
              opacity: 0.7,
            }}>
              {trade.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "10px", flexWrap: "wrap" }}>
          {images.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
              <ImageIcon size={10} />
              {images.length} screenshot{images.length !== 1 ? "s" : ""}
            </span>
          )}
          {trade.journalEntry && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--accent-green)" }}>
              <MessageSquare size={10} />
              Note
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
            {tags.map((tag: string) => (
              <span key={tag} style={{
                padding: "3px 9px", borderRadius: "20px", fontSize: "10px", fontWeight: "600",
                background: "var(--accent-green-dim)",
                color: "var(--accent-green)",
                border: "1px solid rgba(0,229,122,0.2)",
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Journal preview */}
        {trade.journalEntry && (
          <div style={{
            background: "var(--bg-card)", borderRadius: "8px",
            padding: "10px 12px",
            borderLeft: "3px solid var(--accent-green)",
            marginBottom: "10px",
          }}>
            <p style={{
              fontSize: "12px", color: "var(--text-secondary)",
              lineHeight: "1.6", margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}>
              {(() => {
                try {
                  const doc = JSON.parse(trade.journalEntry!);
                  if (doc?.type === "doc" && Array.isArray(doc.content)) {
                    return doc.content
                      .flatMap((node: any) =>
                        Array.isArray(node.content)
                          ? node.content.filter((n: any) => n.type === "text").map((n: any) => n.text)
                          : []
                      )
                      .join(" ")
                      .trim() || "No text content";
                  }
                } catch {}
                return trade.journalEntry;
              })()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => onOpen(trade)}
            style={{
              flex: 1, padding: "7px 12px", borderRadius: "7px",
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", fontSize: "11px", fontWeight: "600",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--text-muted)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            Quick View
          </button>
          <button
            onClick={() => onOpenEditor(trade)}
            style={{
              flex: 2, padding: "7px 12px", borderRadius: "7px",
              border: "1px solid var(--accent-green)",
              background: "var(--accent-green-dim)",
              color: "var(--accent-green)", fontSize: "11px", fontWeight: "700",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-green)";
              e.currentTarget.style.color = "#000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent-green-dim)";
              e.currentTarget.style.color = "var(--accent-green)";
            }}
          >
            <ExternalLink size={11} />
            Open Journal
          </button>
        </div>
      </div>
    </div>
  );
}

function DayCard({
  group,
  onOpenTrade,
  onOpenEditor,
}: {
  group: DayGroup;
  onOpenTrade: (t: Trade) => void;
  onOpenEditor: (t: Trade) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isGreen = group.totalPnl >= 0;
  const winRate = group.trades.length > 0
    ? Math.round((group.wins / group.trades.length) * 100) : 0;

  const rawDate = group.date;
  let normalized = rawDate;
  if (rawDate.includes("/")) {
    const [mm, dd, yyyy] = rawDate.split("/");
    normalized = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  const dateLabel = new Date(normalized + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "16px", overflow: "hidden", marginBottom: "20px",
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", padding: "18px 20px", background: "transparent",
          border: "none", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          borderBottom: expanded ? "1px solid var(--border)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
              {dateLabel}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              {group.trades.length} trade{group.trades.length !== 1 ? "s" : ""} · {winRate}% win rate
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {group.wins > 0 && (
              <span style={{
                padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                background: "rgba(0,229,122,0.1)", color: "#00e57a",
                border: "1px solid rgba(0,229,122,0.2)",
              }}>
                {group.wins}W
              </span>
            )}
            {group.losses > 0 && (
              <span style={{
                padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                background: "rgba(255,77,106,0.1)", color: "#ff4d6a",
                border: "1px solid rgba(255,77,106,0.2)",
              }}>
                {group.losses}L
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            fontSize: "20px", fontWeight: "800",
            color: isGreen ? "#00e57a" : "#ff4d6a",
          }}>
            {isGreen ? "+" : ""}${group.totalPnl.toFixed(2)}
          </div>
          <div style={{
            width: "28px", height: "28px", borderRadius: "8px",
            background: "var(--bg-secondary)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            {expanded
              ? <ChevronUp size={14} color="var(--text-muted)" />
              : <ChevronDown size={14} color="var(--text-muted)" />
            }
          </div>
        </div>
      </button>

      {expanded && (
        <div style={{
          padding: "16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "10px",
        }}>
          {group.trades.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              onOpen={onOpenTrade}
              onOpenEditor={onOpenEditor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  const { trades, setSelectedTrade, setActivePage, setActiveTradeId } = useApp();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "win" | "loss">("all");
  const [filterTag, setFilterTag] = useState("");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of trades) {
      const tags = Array.isArray(t.tags) ? t.tags : [];
      tags.forEach((tag: string) => set.add(tag));
    }
    return Array.from(set);
  }, [trades]);

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

  const journalledTrades = trades.filter((t) => t.journalEntry).length;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const bestDay = groups.length > 0
    ? groups.reduce((b, g) => g.totalPnl > b ? g.totalPnl : b, -Infinity)
    : 0;
  const worstDay = groups.length > 0
    ? groups.reduce((w, g) => g.totalPnl < w ? g.totalPnl : w, Infinity)
    : 0;

  const openEditor = (trade: Trade) => {
    setActiveTradeId(trade.id);
    setActivePage("journal-editor");
  };

  if (trades.length === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "60vh", flexDirection: "column", gap: "16px",
      }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "16px",
          background: "var(--accent-green-dim)", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <BookOpen size={28} color="var(--accent-green)" />
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>
            No trades yet
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Import trades or add one manually to start your journal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{
          fontSize: "28px", fontWeight: "800", color: "var(--text-primary)",
          letterSpacing: "-0.5px", marginBottom: "4px",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Journal
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Review every trade. Build your edge.
        </p>
      </div>

      {/* Stats strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "12px", marginBottom: "24px",
      }}>
        {[
          {
            label: "Days Traded",
            value: String(groups.length),
            color: "var(--text-primary)",
            icon: BookOpen,
          },
          {
            label: "Best Day",
            value: bestDay === -Infinity || bestDay === 0
              ? "$0.00"
              : `+$${bestDay.toFixed(2)}`,
            color: "#00e57a",
            icon: TrendingUp,
          },
          {
            label: "Worst Day",
            value: worstDay === Infinity || worstDay === 0
              ? "$0.00"
              : `$${worstDay.toFixed(2)}`,
            color: "#ff4d6a",
            icon: TrendingDown,
          },
          {
            label: "Notes Written",
            value: `${journalledTrades} / ${trades.length}`,
            color: "var(--accent-green)",
            icon: MessageSquare,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "16px 18px",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "10px",
            }}>
              <span style={{
                fontSize: "11px", fontWeight: "600", color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}>
                {label}
              </span>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: "var(--accent-green-dim)", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={13} color="var(--accent-green)" />
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", gap: "10px", marginBottom: "24px",
        alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes or symbol..."
            style={{
              width: "100%", padding: "9px 12px 9px 34px", borderRadius: "8px",
              border: "1px solid var(--border)", background: "var(--bg-card)",
              color: "var(--text-primary)", fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {(["all", "win", "loss"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "1px solid",
                borderColor: filterStatus === status
                  ? status === "win" ? "#00e57a" : status === "loss" ? "#ff4d6a" : "var(--accent-green)"
                  : "var(--border)",
                background: filterStatus === status
                  ? status === "win" ? "rgba(0,229,122,0.1)" : status === "loss" ? "rgba(255,77,106,0.1)" : "var(--accent-green-dim)"
                  : "transparent",
                color: filterStatus === status
                  ? status === "win" ? "#00e57a" : status === "loss" ? "#ff4d6a" : "var(--accent-green)"
                  : "var(--text-muted)",
                fontSize: "12px", fontWeight: "600", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {status === "all" ? "All" : status === "win" ? "Wins" : "Losses"}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div style={{ position: "relative" }}>
            <Tag
              size={12}
              color="var(--text-muted)"
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
            />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              style={{
                padding: "8px 12px 8px 28px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "var(--bg-card)",
                color: filterTag ? "var(--accent-green)" : "var(--text-muted)",
                fontSize: "12px", fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer", appearance: "none" as const,
                outline: "none",
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

      {/* Day groups */}
      {groups.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px",
          color: "var(--text-muted)", fontSize: "14px",
        }}>
          No trades match your filters
        </div>
      ) : (
        groups.map((group) => (
          <DayCard
            key={group.date}
            group={group}
            onOpenTrade={(trade) => setSelectedTrade(trade)}
            onOpenEditor={openEditor}
          />
        ))
      )}
    </div>
  );
}
