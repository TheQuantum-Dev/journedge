"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown, Calendar, BarChart2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Trade } from "../lib/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Normalize any date string to YYYY-MM-DD for consistent key lookups
function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  // Handle MM/DD/YYYY → YYYY-MM-DD
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [mm, dd, yyyy] = dateStr.split("/");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  // Already YYYY-MM-DD or ISO format — strip time portion if present
  return dateStr.split("T")[0];
}

export default function CalendarPage() {
  const { trades } = useApp();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Normalize all trade dates so lookups always work regardless of import source
  const tradesByDate: Record<string, Trade[]> = {};
  for (const trade of trades) {
    const key = normalizeDate(trade.date);
    if (!tradesByDate[key]) tradesByDate[key] = [];
    tradesByDate[key].push(trade);
  }

  const pnlByDate: Record<string, number> = {};
  for (const date in tradesByDate) {
    pnlByDate[date] = tradesByDate[date].reduce((sum, t) => sum + t.pnl, 0);
  }

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  // Always produce YYYY-MM-DD to match normalized trade keys
  const formatDate = (day: number): string => {
    const yyyy = String(currentYear);
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Monthly stats
  const monthTrades = trades.filter((t) => {
    const normalized = normalizeDate(t.date);
    const d = new Date(normalized);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthPnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0);
  const monthWins = monthTrades.filter((t) => t.pnl > 0);
  const monthLosses = monthTrades.filter((t) => t.pnl < 0);

  // Best / worst trading DAYS this month
  const dailyPnlEntries = Object.entries(pnlByDate).filter(([date]) => {
    const d = new Date(date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const tradingDaysCount = dailyPnlEntries.length;
  const avgDailyPnl = tradingDaysCount > 0 ? monthPnl / tradingDaysCount : 0;
  const bestDay = dailyPnlEntries.reduce<[string, number] | null>(
    (best, entry) => (!best || entry[1] > best[1] ? entry : best), null
  );
  const worstDay = dailyPnlEntries.reduce<[string, number] | null>(
    (worst, entry) => (!worst || entry[1] < worst[1] ? entry : worst), null
  );

  const selectedTrades = selectedDay ? (tradesByDate[selectedDay] || []) : [];

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            Calendar
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Your trading performance at a glance
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Monthly Stats Pills */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "10px", padding: "10px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Month P&L</div>
              <div style={{
                fontSize: "16px", fontWeight: "700",
                color: monthPnl >= 0 ? "var(--accent-green)" : "var(--accent-red)",
              }}>
                {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
              </div>
            </div>
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "10px", padding: "10px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Days</div>
              <div style={{ fontSize: "14px", fontWeight: "700" }}>
                <span style={{ color: "var(--accent-green)" }}>{monthWins.length}W</span>
                <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>/</span>
                <span style={{ color: "var(--accent-red)" }}>{monthLosses.length}L</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={prevMonth} style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "8px", cursor: "pointer", color: "var(--text-primary)",
              display: "flex", alignItems: "center",
            }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", minWidth: "160px", textAlign: "center" }}>
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button onClick={nextMonth} style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "8px", cursor: "pointer", color: "var(--text-primary)",
              display: "flex", alignItems: "center",
            }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "16px", overflow: "hidden",
      }}>
        {/* Day Headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border)" }}>
          {DAYS.map((day) => (
            <div key={day} style={{
              padding: "12px", textAlign: "center",
              fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px",
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {/* Empty offset cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={{
              minHeight: "90px",
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              background: "rgba(0,0,0,0.15)",
            }} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDate(day);
            const dayTrades = tradesByDate[dateStr] || [];
            const dayPnl = pnlByDate[dateStr];
            const hasTrades = dayTrades.length > 0;
            const isToday =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();
            const isSelected = selectedDay === dateStr;
            const isWin = dayPnl > 0;

            return (
              <div
                key={day}
                onClick={() => hasTrades && setSelectedDay(isSelected ? null : dateStr)}
                style={{
                  minHeight: "90px",
                  borderRight: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                  padding: "10px",
                  cursor: hasTrades ? "pointer" : "default",
                  background: isSelected
                    ? "var(--bg-hover)"
                    : hasTrades
                    ? isWin
                      ? "rgba(0,229,122,0.07)"
                      : "rgba(255,77,106,0.07)"
                    : "transparent",
                  transition: "background 0.15s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (hasTrades && !isSelected)
                    e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (hasTrades && !isSelected)
                    e.currentTarget.style.background = isWin
                      ? "rgba(0,229,122,0.07)"
                      : "rgba(255,77,106,0.07)";
                }}
              >
                {/* Left accent bar for trade days */}
                {hasTrades && (
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
                    background: isWin ? "var(--accent-green)" : "var(--accent-red)",
                    borderRadius: "0",
                  }} />
                )}

                {/* Day number */}
                <div style={{
                  fontSize: "13px",
                  fontWeight: isToday ? "800" : "500",
                  color: isToday ? "#000" : "var(--text-secondary)",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}>
                  {isToday ? (
                    <span style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: "var(--accent-green)", color: "#000",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: "800",
                    }}>
                      {day}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-secondary)" }}>{day}</span>
                  )}
                </div>

                {/* P&L display */}
                {hasTrades && (
                  <div>
                    <div style={{
                      fontSize: "13px", fontWeight: "700",
                      color: isWin ? "var(--accent-green)" : "var(--accent-red)",
                      marginBottom: "3px",
                    }}>
                      {isWin ? "+" : ""}${dayPnl.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      {dayTrades.length} trade{dayTrades.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Monthly Breakdown ── fills the dead space below the calendar */}
      {tradingDaysCount > 0 ? (
        <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {/* Trading Days */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "14px", padding: "20px",
            display: "flex", flexDirection: "column", gap: "6px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={14} color="var(--text-muted)" />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                TRADING DAYS
              </span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-1px" }}>
              {tradingDaysCount}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {monthWins.length}W &nbsp;·&nbsp; {monthLosses.length}L
            </div>
          </div>

          {/* Avg Daily P&L */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "14px", padding: "20px",
            display: "flex", flexDirection: "column", gap: "6px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart2 size={14} color="var(--text-muted)" />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                AVG DAILY P&L
              </span>
            </div>
            <div style={{
              fontSize: "28px", fontWeight: "800", letterSpacing: "-1px",
              color: avgDailyPnl >= 0 ? "var(--accent-green)" : "var(--accent-red)",
            }}>
              {avgDailyPnl >= 0 ? "+" : ""}${avgDailyPnl.toFixed(2)}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              per trading day
            </div>
          </div>

          {/* Best Day */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid rgba(0,229,122,0.25)",
            borderRadius: "14px", padding: "20px",
            display: "flex", flexDirection: "column", gap: "6px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={14} color="var(--accent-green)" />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                BEST DAY
              </span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--accent-green)", letterSpacing: "-1px" }}>
              {bestDay ? `+$${bestDay[1].toFixed(2)}` : "—"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {bestDay ? formatDisplayDate(bestDay[0]) : "No data"}
            </div>
          </div>

          {/* Worst Day */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid rgba(255,77,106,0.25)",
            borderRadius: "14px", padding: "20px",
            display: "flex", flexDirection: "column", gap: "6px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingDown size={14} color="var(--accent-red)" />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                WORST DAY
              </span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--accent-red)", letterSpacing: "-1px" }}>
              {worstDay ? `$${worstDay[1].toFixed(2)}` : "—"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {worstDay ? formatDisplayDate(worstDay[0]) : "No data"}
            </div>
          </div>
        </div>
      ) : (
        /* Empty state when no trades in this month */
        <div style={{
          marginTop: "24px", background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "14px", padding: "32px", textAlign: "center",
        }}>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            No trades recorded in {MONTHS[currentMonth]} {currentYear}
          </div>
        </div>
      )}

      {/* Day Detail Slide Panel */}
      {selectedDay && selectedTrades.length > 0 && (
        <>
          <div
            onClick={() => setSelectedDay(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
          />
          <div style={{
            position: "fixed", top: 0, right: 0, width: "480px", height: "100vh",
            background: "var(--bg-secondary)", borderLeft: "1px solid var(--border)",
            zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Panel Header */}
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)" }}>
                  {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric",
                  })}
                </h3>
                <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {selectedTrades.length} trade{selectedTrades.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{
                    fontSize: "13px", fontWeight: "700",
                    color: selectedTrades.reduce((s, t) => s + t.pnl, 0) >= 0
                      ? "var(--accent-green)"
                      : "var(--accent-red)",
                  }}>
                    {selectedTrades.reduce((s, t) => s + t.pnl, 0) >= 0 ? "+" : ""}
                    ${selectedTrades.reduce((s, t) => s + t.pnl, 0).toFixed(2)} day P&L
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Trade Cards */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {selectedTrades.map((trade) => (
                <div
                  key={trade.id}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: "12px", padding: "16px", marginBottom: "12px",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-green)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)" }}>
                        {trade.underlying}
                      </span>
                      <span style={{
                        padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "600",
                        background: trade.optionType === "call" ? "rgba(77,159,255,0.15)" : "rgba(255,77,106,0.15)",
                        color: trade.optionType === "call" ? "var(--accent-blue)" : "var(--accent-red)",
                      }}>
                        {trade.optionType
                          ? `${trade.optionType.toUpperCase()} $${trade.strike}`
                          : trade.type.toUpperCase()}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "15px", fontWeight: "700",
                      color: trade.pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)",
                    }}>
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Entry: ${trade.entryPrice}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Exit: ${trade.exitPrice}</span>
                    {trade.rr && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>R:R {trade.rr}</span>}
                    {trade.entryTime && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{trade.entryTime}</span>}
                  </div>

                  {(() => {
                    const tags: string[] = Array.isArray(trade.tags)
                      ? trade.tags as string[]
                      : typeof trade.tags === "string"
                      ? JSON.parse((trade.tags as string) || "[]")
                      : [];
                    return tags.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                        {tags.map((tag) => (
                          <span key={tag} style={{
                            padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "600",
                            background: "var(--accent-green-dim)", color: "var(--accent-green)",
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  {trade.journalEntry && (
                    <p style={{
                      fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5",
                      borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "4px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {trade.journalEntry}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}