"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useApp } from "../context/AppContext";
import { FileDown, Filter, Layout, Eye, ChevronDown } from "lucide-react";

// Single dynamic import wrapping both PDFDownloadLink and TradingReportPDF
// They must live in the same module boundary — splitting them causes the 'su is not a function' crash
const ExportPDFInner = dynamic(() => import("../components/ExportPDFInner"), {
  ssr: false,
  loading: () => (
    <button disabled style={{
      width: "100%", padding: "12px", borderRadius: "10px",
      border: "none", background: "var(--border)",
      color: "var(--text-muted)", fontSize: "14px", fontWeight: "600",
      cursor: "not-allowed", display: "flex", alignItems: "center",
      justifyContent: "center", gap: "8px",
    }}>
      <FileDown size={16} />
      Loading...
    </button>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportOptions {
  // Filters
  dateFrom: string;
  dateTo: string;
  tickers: string[];
  tags: string[];
  status: "all" | "win" | "loss" | "breakeven";

  // Sections
  includeCover: boolean;
  includeStats: boolean;
  includeDailyBreakdown: boolean;
  includeTradeHistory: boolean;
  includeJournal: boolean;

  // Layout
  journalLayout: "1" | "2" | "4";
}

// ─── Subcomponents ────────────────────────────────────────────────────────────
function SectionHeading({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      marginBottom: "16px", marginTop: "8px",
    }}>
      <Icon size={14} color="var(--accent-green)" />
      <span style={{
        fontSize: "11px", fontWeight: "700", letterSpacing: "0.8px",
        textTransform: "uppercase", color: "var(--text-muted)",
      }}>
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid var(--border)", margin: "20px 0" }} />;
}

function Toggle({
  label, sub, checked, onChange,
}: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0",
    }}>
      <div>
        <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            {sub}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: "40px", height: "22px", borderRadius: "11px", border: "none",
          background: checked ? "var(--accent-green)" : "var(--border)",
          cursor: "pointer", position: "relative", flexShrink: 0,
          transition: "background 0.2s ease",
        }}
      >
        <div style={{
          position: "absolute", top: "3px",
          left: checked ? "21px" : "3px",
          width: "16px", height: "16px", borderRadius: "50%",
          background: "white", transition: "left 0.2s ease",
        }} />
      </button>
    </div>
  );
}

function SelectPill({
  options, value, onChange,
}: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "5px 12px", borderRadius: "20px", border: "1px solid",
            borderColor: value === opt.value ? "var(--accent-green)" : "var(--border)",
            background: value === opt.value ? "var(--accent-green-dim)" : "transparent",
            color: value === opt.value ? "var(--accent-green)" : "var(--text-muted)",
            fontSize: "12px", fontWeight: "500", cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MultiSelect({
  label, options, selected, onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (val: string) => {
    onChange(selected.includes(val)
      ? selected.filter((s) => s !== val)
      : [...selected, val]);
  };

  return (
    <div style={{ position: "relative", marginBottom: "12px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "8px 12px", borderRadius: "8px",
          border: "1px solid var(--border)", background: "var(--bg-card)",
          color: selected.length > 0 ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: "12px", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <span>
          {selected.length === 0
            ? `All ${label}`
            : selected.length === 1
            ? selected[0]
            : `${selected.length} ${label} selected`}
        </span>
        <ChevronDown
          size={12}
          color="var(--text-muted)"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
        />
      </button>

      {open && options.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "8px", zIndex: 50, maxHeight: "180px", overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              style={{
                width: "100%", padding: "8px 12px", border: "none",
                background: selected.includes(opt) ? "var(--accent-green-dim)" : "transparent",
                color: selected.includes(opt) ? "var(--accent-green)" : "var(--text-primary)",
                fontSize: "12px", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: "8px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div style={{
                width: "14px", height: "14px", borderRadius: "4px",
                border: `1.5px solid ${selected.includes(opt) ? "var(--accent-green)" : "var(--border)"}`,
                background: selected.includes(opt) ? "var(--accent-green)" : "transparent",
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {selected.includes(opt) && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────
// A scaled-down visual mock of what the PDF pages will look like.
// We can't actually render react-pdf to canvas here without a worker,
// so we build a CSS replica that mirrors the real document layout.
function LivePreview({
  tradeCount, winCount, lossCount, totalPnl, options,
}: {
  tradeCount: number;
  winCount: number;
  lossCount: number;
  totalPnl: number;
  options: ReportOptions;
}) {
  const winRate = tradeCount > 0 ? Math.round((winCount / tradeCount) * 100) : 0;

  const pageStyle: React.CSSProperties = {
    background: "white", borderRadius: "4px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    padding: "20px", marginBottom: "12px",
    width: "100%", color: "#1a1a2e",
  };

  return (
    <div style={{ transform: "scale(1)", transformOrigin: "top center" }}>
      {/* Page 1 */}
      <div style={pageStyle}>

        {/* Cover */}
        {options.includeCover && (
          <div style={{ borderBottom: "2px solid #00c464", paddingBottom: "12px", marginBottom: "12px" }}>
            {/* Mini logo replica */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "4px",
                background: "linear-gradient(135deg, #111122, #111122)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "9px", fontWeight: "800", color: "#00e57a",
              }}>T</div>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#0a0a1a", letterSpacing: "-0.3px" }}>
                journedge
              </span>
            </div>
            <div style={{ fontSize: "8px", color: "#888" }}>Trading Performance Report</div>
          </div>
        )}

        {/* Stats */}
        {options.includeStats && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "7px", fontWeight: "700", color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Performance Summary
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {[
                { label: "Net P&L", value: `${totalPnl >= 0 ? "+" : ""}$${Math.abs(totalPnl).toFixed(0)}`, color: totalPnl >= 0 ? "#00b85e" : "#cc3355" },
                { label: "Win Rate", value: `${winRate}%`, color: winRate >= 50 ? "#00b85e" : "#cc3355" },
                { label: "Trades", value: tradeCount, color: "#1a1a2e" },
                { label: "Wins", value: winCount, color: "#00b85e" },
                { label: "Losses", value: lossCount, color: "#cc3355" },
              ].map((s) => (
                <div key={s.label} style={{
                  flex: 1, border: "1px solid #e0e0f0", borderRadius: "3px",
                  padding: "4px", background: "#f8f8fd",
                }}>
                  <div style={{ fontSize: "5px", color: "#aaa", marginBottom: "2px" }}>{s.label}</div>
                  <div style={{ fontSize: "7px", fontWeight: "800", color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily breakdown */}
        {options.includeDailyBreakdown && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "7px", fontWeight: "700", color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Daily Breakdown
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "3px 0", borderBottom: "1px solid #f0f0f8",
              }}>
                <div style={{ width: "40px", height: "5px", background: "#e0e0f0", borderRadius: "2px" }} />
                <div style={{ width: "30px", height: "5px", background: "#e0e0f0", borderRadius: "2px" }} />
                <div style={{ width: "20px", height: "5px", background: "#00b85e33", borderRadius: "2px" }} />
              </div>
            ))}
          </div>
        )}

        {/* Trade history */}
        {options.includeTradeHistory && (
          <div>
            <div style={{ fontSize: "7px", fontWeight: "700", color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Trade History
            </div>
            <div style={{ background: "#f0f0f8", borderRadius: "2px", padding: "3px 4px", marginBottom: "3px", display: "flex", gap: "4px" }}>
              {["Date", "Symbol", "P&L"].map((h) => (
                <div key={h} style={{ flex: 1, fontSize: "5px", fontWeight: "700", color: "#888" }}>{h}</div>
              ))}
            </div>
            {[...Array(Math.min(tradeCount, 5))].map((_, i) => (
              <div key={i} style={{
                display: "flex", gap: "4px", padding: "2px 4px",
                background: i % 2 === 0 ? "transparent" : "#fafaff",
              }}>
                <div style={{ flex: 1, height: "4px", background: "#e0e0f0", borderRadius: "1px" }} />
                <div style={{ flex: 1, height: "4px", background: "#e0e0f0", borderRadius: "1px" }} />
                <div style={{ flex: 1, height: "4px", background: i % 3 === 0 ? "#cc335533" : "#00b85e33", borderRadius: "1px" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* No sections selected */}
      {!options.includeCover && !options.includeStats && !options.includeDailyBreakdown && !options.includeTradeHistory && (
        <div style={{ ...pageStyle, textAlign: "center", padding: "32px", color: "#aaa", fontSize: "11px" }}>
          No sections selected
        </div>
      )}
    </div>
  );
}

// ─── Main Export Page ─────────────────────────────────────────────────────────
export default function ExportPage() {
  const { trades, activeAccount } = useApp();

  const [options, setOptions] = useState<ReportOptions>({
    dateFrom: "", dateTo: "",
    tickers: [], tags: [],
    status: "all",
    includeCover: true,
    includeStats: true,
    includeDailyBreakdown: true,
    includeTradeHistory: true,
    includeJournal: false,
    journalLayout: "2",
  });

  // Derive available filter options from actual trade data
  const availableTickers = useMemo(() =>
    [...new Set(trades.map((t) => t.underlying))].sort(), [trades]);

  const availableTags = useMemo(() =>
    [...new Set(trades.flatMap((t) => t.tags || []))].sort(), [trades]);

  // Apply filters to get the trades that will go in the report
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (options.dateFrom && t.date < options.dateFrom) return false;
      if (options.dateTo   && t.date > options.dateTo)   return false;
      if (options.tickers.length > 0 && !options.tickers.includes(t.underlying)) return false;
      if (options.tags.length > 0 && !options.tags.some((tag) => (t.tags || []).includes(tag))) return false;
      if (options.status !== "all" && t.status !== options.status) return false;
      return true;
    });
  }, [trades, options]);

  const wins   = filteredTrades.filter((t) => t.status === "win");
  const losses = filteredTrades.filter((t) => t.status === "loss");
  const totalPnl = filteredTrades.reduce((s, t) => s + t.pnl, 0);

  const set = <K extends keyof ReportOptions>(key: K, val: ReportOptions[K]) =>
    setOptions((prev) => ({ ...prev, [key]: val }));

  const filename = `journedge-report-${
    activeAccount?.name?.toLowerCase().replace(/\s+/g, "-") || "account"
  }-${new Date().toISOString().split("T")[0]}.pdf`;

  // ── Render ──
  return (
    <div style={{ display: "flex", gap: "24px", height: "calc(100vh - 64px)", overflow: "hidden" }}>

      {/* ── Left Panel: Report Builder ── */}
      <div style={{
        width: "340px", minWidth: "340px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)", borderRadius: "12px",
        padding: "24px", overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>

        <h2 style={{
          fontSize: "16px", fontWeight: "700", color: "var(--text-primary)",
          marginBottom: "4px",
        }}>
          Report Builder
        </h2>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
          {filteredTrades.length} trade{filteredTrades.length !== 1 ? "s" : ""} match your filters
        </p>

        {/* ── Filters ── */}
        <SectionHeading icon={Filter} label="Filters" />

        {/* Date range */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              From
            </label>
            <input
              type="date"
              value={options.dateFrom}
              onChange={(e) => set("dateFrom", e.target.value)}
              style={{
                width: "100%", padding: "7px 10px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "var(--bg-card)",
                color: "var(--text-primary)", fontSize: "12px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              To
            </label>
            <input
              type="date"
              value={options.dateTo}
              onChange={(e) => set("dateTo", e.target.value)}
              style={{
                width: "100%", padding: "7px 10px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "var(--bg-card)",
                color: "var(--text-primary)", fontSize: "12px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>
        </div>

        {/* Tickers */}
        <MultiSelect
          label="Tickers"
          options={availableTickers}
          selected={options.tickers}
          onChange={(v) => set("tickers", v)}
        />

        {/* Tags */}
        <MultiSelect
          label="Tags"
          options={availableTags}
          selected={options.tags}
          onChange={(v) => set("tags", v)}
        />

        {/* Status */}
        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
            Status
          </label>
          <SelectPill
            value={options.status}
            onChange={(v) => set("status", v as ReportOptions["status"])}
            options={[
              { label: "All", value: "all" },
              { label: "Wins", value: "win" },
              { label: "Losses", value: "loss" },
              { label: "Breakeven", value: "breakeven" },
            ]}
          />
        </div>

        <Divider />

        {/* ── Sections ── */}
        <SectionHeading icon={Layout} label="Report Sections" />

        <Toggle label="Cover Page"         checked={options.includeCover}         onChange={(v) => set("includeCover", v)} />
        <Toggle label="Performance Summary" checked={options.includeStats}         onChange={(v) => set("includeStats", v)} />
        <Toggle label="Daily Breakdown"     checked={options.includeDailyBreakdown} onChange={(v) => set("includeDailyBreakdown", v)} />
        <Toggle label="Trade History"       checked={options.includeTradeHistory}  onChange={(v) => set("includeTradeHistory", v)} />
        <Toggle
          label="Journal Entries"
          sub="Requires journal entries to be written"
          checked={options.includeJournal}
          onChange={(v) => set("includeJournal", v)}
        />

        {/* Journal layout options */}
        {options.includeJournal && (
          <div style={{ marginTop: "8px", marginBottom: "4px", paddingLeft: "12px", borderLeft: "2px solid var(--accent-green-dim)" }}>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
              Entries per page
            </label>
            <SelectPill
              value={options.journalLayout}
              onChange={(v) => set("journalLayout", v as ReportOptions["journalLayout"])}
              options={[
                { label: "1", value: "1" },
                { label: "2", value: "2" },
                { label: "4", value: "4" },
              ]}
            />
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        <Divider />

        {/* ── Export Button ── */}
        <ExportPDFInner
          trades={filteredTrades}
          account={activeAccount}
          options={options}
          filename={filename}
        />
      </div>

      {/* ── Right Panel: Live Preview ── */}
      <div style={{
        flex: 1, background: "var(--bg-secondary)",
        border: "1px solid var(--border)", borderRadius: "12px",
        padding: "24px", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <Eye size={14} color="var(--accent-green)" />
          <span style={{
            fontSize: "11px", fontWeight: "700", letterSpacing: "0.8px",
            textTransform: "uppercase", color: "var(--text-muted)",
          }}>
            Live Preview
          </span>
        </div>

        <LivePreview
          tradeCount={filteredTrades.length}
          winCount={wins.length}
          lossCount={losses.length}
          totalPnl={totalPnl}
          options={options}
        />

        <p style={{
          fontSize: "11px", color: "var(--text-muted)", textAlign: "center",
          marginTop: "16px",
        }}>
          Preview is approximate — the exported PDF will be full resolution
        </p>
      </div>
    </div>
  );
}