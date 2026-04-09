"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown, Calendar, BarChart2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Trade } from "../lib/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const WIN_COLOR   = "#00e57a";
const LOSS_COLOR  = "#ff4d6a";
const WIN_BG      = "rgba(0,229,122,0.07)";
const LOSS_BG     = "rgba(255,77,106,0.07)";
const WIN_BORDER  = "rgba(0,229,122,0.25)";
const LOSS_BORDER = "rgba(255,77,106,0.25)";

function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [mm, dd, yyyy] = dateStr.split("/");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return dateStr.split("T")[0];
}

export default function CalendarPage() {
  const { trades, setSelectedTrade } = useApp();
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
  const [selectedDay,  setSelectedDay]  = useState<string | null>(null);

  // Use a ref to track whether we've snapped yet — avoids stale state issues
  const hasSnapped = useRef(false);

  useEffect(() => {
    if (hasSnapped.current || trades.length === 0) return;

    // Find the most recent trade date and snap the calendar to that month/year
    const mostRecent = trades
      .map((t) => normalizeDate(t.date))
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0];

    if (!mostRecent) return;

    // Parse YYYY-MM-DD manually to avoid timezone offset shifting the date
    const [yyyy, mm] = mostRecent.split("-").map(Number);
    if (!isNaN(yyyy) && !isNaN(mm)) {
      setCurrentYear(yyyy);
      setCurrentMonth(mm - 1); // months are 0-indexed
    }

    hasSnapped.current = true;
  }, [trades]);

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

  const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const formatDate = (day: number): string =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const monthTrades = trades.filter((t) => {
    const normalized = normalizeDate(t.date);
    const [yyyy, mm] = normalized.split("-").map(Number);
    return mm - 1 === currentMonth && yyyy === currentYear;
  });

  const monthPnl    = monthTrades.reduce((sum, t) => sum + t.pnl, 0);
  const monthWins   = monthTrades.filter((t) => t.pnl > 0);
  const monthLosses = monthTrades.filter((t) => t.pnl < 0);

  const dailyPnlEntries = Object.entries(pnlByDate).filter(([date]) => {
    const [yyyy, mm] = date.split("-").map(Number);
    return mm - 1 === currentMonth && yyyy === currentYear;
  });

  const tradingDaysCount = dailyPnlEntries.length;
  const avgDailyPnl      = tradingDaysCount > 0 ? monthPnl / tradingDaysCount : 0;

  const bestDay  = dailyPnlEntries.reduce<[string, number] | null>(
    (best, entry)  => (!best || entry[1] > best[1] ? entry : best), null
  );
  const worstDay = dailyPnlEntries.reduce<[string, number] | null>(
    (worst, entry) => (!worst || entry[1] < worst[1] ? entry : worst), null
  );

  const selectedTrades = selectedDay ? (tradesByDate[selectedDay] || []) : [];

  const formatDisplayDate = (dateStr: string) => {
    const [yyyy, mm, dd] = dateStr.split("-").map(Number);
    return new Date(yyyy, mm - 1, dd).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleTradeClick = (trade: Trade) => {
    setSelectedDay(null);
    setSelectedTrade(trade);
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
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "10px", padding: "10px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Month P&L</div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: monthPnl >= 0 ? WIN_COLOR : LOSS_COLOR }}>
                {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
              </div>
            </div>
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "10px", padding: "10px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Days</div>
              <div style={{ fontSize: "14px", fontWeight: "700" }}>
                <span style={{ color: WIN_COLOR }}>{monthWins.length}W</span>
                <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>/</span>
                <span style={{ color: LOSS_COLOR }}>{monthLosses.length}L</span>
              </div>
            </div>
          </div>

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
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={{
              minHeight: "90px",
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              background: "rgba(0,0,0,0.15)",
            }} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day       = i + 1;
            const dateStr   = formatDate(day);
            const dayTrades = tradesByDate[dateStr] || [];
            const dayPnl    = pnlByDate[dateStr];
            const hasTrades = dayTrades.length > 0;
            const isToday   =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();
            const isSelected = selectedDay === dateStr;
            const isWin      = dayPnl > 0;

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
                    : hasTrades ? (isWin ? WIN_BG : LOSS_BG) : "transparent",
                  transition: "background 0.15s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (hasTrades && !isSelected)
                    e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (hasTrades && !isSelected)
                    e.currentTarget.style.background = isWin ? WIN_BG : LOSS_BG;
                }}
              >
                {hasTrades && (
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
                    background: isWin ? WIN_COLOR : LOSS_COLOR,
                  }} />
                )}

                <div style={{ fontSize: "13px", fontWeight: isToday ? "800" : "500", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  {isToday ? (
                    <span style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: WIN_COLOR, color: "#000",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: "800",
                    }}>
                      {day}
                    </span>
                  ) : (
                    <span>{day}</span>
                  )}
                </div>

                {hasTrades && (
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: isWin ? WIN_COLOR : LOSS_COLOR, marginBottom: "3px" }}>
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

      {/* Monthly breakdown */}
      {tradingDaysCount > 0 ? (
        <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={14} color="var(--text-muted)" />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>TRADING DAYS</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-1px" }}>{tradingDaysCount}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{monthWins.length}W &nbsp;·&nbsp; {monthLosses.length}L</div>
          </div>

          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart2 size={14} color="var(--text-muted)" />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>AVG DAILY P&L</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", color: avgDailyPnl >= 0 ? WIN_COLOR : LOSS_COLOR }}>
              {avgDailyPnl >= 0 ? "+" : ""}${avgDailyPnl.toFixed(2)}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>per trading day</div>
          </div>

          <div style={{
            background: "var(--bg-card)", border: `1px solid ${WIN_BORDER}`,
            borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={14} color={WIN_COLOR} />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>BEST DAY</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: WIN_COLOR, letterSpacing: "-1px" }}>
              {bestDay ? `+$${bestDay[1].toFixed(2)}` : "—"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {bestDay ? formatDisplayDate(bestDay[0]) : "No data"}
            </div>
          </div>

          <div style={{
            background: "var(--bg-card)", border: `1px solid ${LOSS_BORDER}`,
            borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingDown size={14} color={LOSS_COLOR} />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>WORST DAY</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: LOSS_COLOR, letterSpacing: "-1px" }}>
              {worstDay ? `$${worstDay[1].toFixed(2)}` : "—"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {worstDay ? formatDisplayDate(worstDay[0]) : "No data"}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          marginTop: "24px", background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "14px", padding: "32px", textAlign: "center",
        }}>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            No trades recorded in {MONTHS[currentMonth]} {currentYear}
          </div>
        </div>
      )}

      {/* Day Detail Panel */}
      {selectedDay && selectedTrades.length > 0 && (
        <>
          <div onClick={() => setSelectedDay(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
          <div style={{
            position: "fixed", top: 0, right: 0, width: "480px", height: "100vh",
            background: "var(--bg-secondary)", borderLeft: "1px solid var(--border)",
            zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)" }}>
                  {(() => {
                    const [yyyy, mm, dd] = selectedDay.split("-").map(Number);
                    return new Date(yyyy, mm - 1, dd).toLocaleDateString("en-US", {
                      weekday: "long", month: "long", day: "numeric",
                    });
                  })()}
                </h3>
                <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {selectedTrades.length} trade{selectedTrades.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{
                    fontSize: "13px", fontWeight: "700",
                    color: selectedTrades.reduce((s, t) => s + t.pnl, 0) >= 0 ? WIN_COLOR : LOSS_COLOR,
                  }}>
                    {selectedTrades.reduce((s, t) => s + t.pnl, 0) >= 0 ? "+" : ""}
                    ${selectedTrades.reduce((s, t) => s + t.pnl, 0).toFixed(2)} day P&L
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Click any trade to open the journal panel
              </p>
              {selectedTrades.map((trade) => (
                <div
                  key={trade.id}
                  onClick={() => handleTradeClick(trade)}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: "12px", padding: "16px", marginBottom: "12px",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = WIN_COLOR;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)" }}>{trade.underlying}</span>
                      <span style={{
                        padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "600",
                        background: trade.optionType === "call" ? "rgba(77,159,255,0.15)" : "rgba(255,77,106,0.15)",
                        color: trade.optionType === "call" ? "var(--accent-blue)" : LOSS_COLOR,
                      }}>
                        {trade.optionType ? `${trade.optionType.toUpperCase()} $${trade.strike}` : trade.type.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: trade.pnl >= 0 ? WIN_COLOR : LOSS_COLOR }}>
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
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as const, overflow: "hidden",
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
