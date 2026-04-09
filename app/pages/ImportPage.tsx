"use client";
import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { Trade } from "../lib/types";
import { parseFidelityCSV }                        from "../lib/parseFidelityCSV";
import { parseJournedgeCSV, isJournedgeCSV }        from "../lib/parseJournedgeCSV";
import { parseTDAmeritradeCSV, isTDAmeritradeCSV }  from "../lib/parseTDAmeritradeCSV";
import { parseTastytradeCSV, isTastytradeCSV }      from "../lib/parseTastytradeCSV";
import { parseIBKRCSV, isIBKRCSV }                 from "../lib/parseIBKRCSV";
import {
  Upload, CheckCircle, AlertCircle, FileText,
  ArrowRight, X, Database, RefreshCw,
} from "lucide-react";

type ParseStatus = "idle" | "success" | "error" | "importing";
type BrokerSource = "Journedge" | "fidelity" | "tdameritrade" | "tastytrade" | "ibkr";

interface ParseResult {
  trades: Trade[];
  source: BrokerSource;
  count:  number;
}

const BADGE_CONFIG: Record<BrokerSource, { label: string; color: string; bg: string; border: string }> = {
  Journedge:    { label: "Journedge Export",  color: "#00e57a", bg: "rgba(0,229,122,0.12)",   border: "rgba(0,229,122,0.3)"   },
  fidelity:     { label: "Fidelity CSV",      color: "#4d9fff", bg: "rgba(77,159,255,0.12)",  border: "rgba(77,159,255,0.3)"  },
  tdameritrade: { label: "TD Ameritrade CSV", color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)"  },
  tastytrade:   { label: "Tastytrade CSV",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
  ibkr:         { label: "IBKR Activity CSV", color: "#f472b6", bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.3)" },
};

function FormatBadge({ source }: { source: BrokerSource }) {
  const cfg = BADGE_CONFIG[source];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      <Database size={10} />
      {cfg.label}
    </span>
  );
}

function detectAndParse(text: string): { trades: Trade[]; source: BrokerSource } {
  if (isJournedgeCSV(text))    return { trades: parseJournedgeCSV(text),    source: "Journedge"     };
  if (isTastytradeCSV(text))   return { trades: parseTastytradeCSV(text),   source: "tastytrade"   };
  if (isTDAmeritradeCSV(text)) return { trades: parseTDAmeritradeCSV(text), source: "tdameritrade" };
  if (isIBKRCSV(text))         return { trades: parseIBKRCSV(text),         source: "ibkr"         };
  return { trades: parseFidelityCSV(text), source: "fidelity" };
}

const BROKER_CARDS = [
  {
    label: "Journedge Export",
    desc:  "Re-import a CSV you previously exported from Journedge. All journal notes, tags, and trade data are preserved.",
    color: "#00e57a", bg: "rgba(0,229,122,0.06)", border: "rgba(0,229,122,0.2)",
  },
  {
    label: "Fidelity",
    desc:  "Upload your Fidelity trade history export. Trades are automatically parsed and P&L calculated.",
    color: "#4d9fff", bg: "rgba(77,159,255,0.06)", border: "rgba(77,159,255,0.2)",
  },
  {
    label: "TD Ameritrade",
    desc:  "Upload a TD Ameritrade Transaction History CSV. Works with post-Schwab merger exports.",
    color: "#fb923c", bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.2)",
  },
  {
    label: "Tastytrade",
    desc:  "Upload a Tastytrade transaction history CSV. Options, stocks, and futures are all supported.",
    color: "#a78bfa", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.2)",
  },
  {
    label: "Interactive Brokers",
    desc:  "Upload an IBKR Activity Statement CSV. Export from Flex Query or the standard Activity Statement.",
    color: "#f472b6", bg: "rgba(244,114,182,0.06)", border: "rgba(244,114,182,0.2)",
    fullWidth: true,
  },
];

export default function ImportPage() {
  const { activeAccount, reloadTrades, setActivePage } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [status,   setStatus]   = useState<ParseStatus>("idle");
  const [message,  setMessage]  = useState("");
  const [result,   setResult]   = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");

  const reset = () => {
    setStatus("idle");
    setMessage("");
    setResult(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setStatus("error");
      setMessage("Only .csv files are supported.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { trades, source } = detectAndParse(text);
        if (trades.length === 0) {
          setStatus("error");
          setMessage(
            "No trades found. Make sure this is a supported broker export or a Journedge CSV. " +
            "Supported: Fidelity, TD Ameritrade, Tastytrade, Interactive Brokers, Journedge."
          );
          return;
        }
        setResult({ trades, source, count: trades.length });
        setStatus("success");
        setMessage(`Found ${trades.length} trade${trades.length !== 1 ? "s" : ""} — ready to import.`);
      } catch {
        setStatus("error");
        setMessage("Could not parse this file. Check it's a valid broker or Journedge CSV.");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirm = async () => {
    if (!result) return;
    setStatus("importing");
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades: result.trades, accountId: activeAccount?.id || null }),
      });
      if (!res.ok) throw new Error("API error");
      await reloadTrades();
      setActivePage("dashboard");
    } catch {
      setStatus("error");
      setMessage("Failed to save trades. Check the server is running and try again.");
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "700", color: "#f0f0ff", letterSpacing: "-0.5px" }}>
          Import Trades
        </h2>
        <p style={{ color: "#8888aa", fontSize: "14px", marginTop: "4px" }}>
          {activeAccount
            ? `Importing into: ${activeAccount.name} (${activeAccount.broker})`
            : "No account selected — trades will be unlinked"}
        </p>
      </div>

      {/* Broker cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {BROKER_CARDS.map((card) => (
          <div
            key={card.label}
            style={{
              background: card.bg, border: `1px solid ${card.border}`,
              borderRadius: "12px", padding: "16px",
              gridColumn: card.fullWidth ? "1 / -1" : undefined,
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: "700", color: card.color, marginBottom: "6px" }}>
              {card.label}
            </div>
            <div style={{ fontSize: "12px", color: "#8888aa", lineHeight: "1.5" }}>
              {card.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => status === "idle" && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (status === "idle") setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "var(--accent-green)" : "var(--border)"}`,
          borderRadius: "16px", padding: "64px 32px", textAlign: "center",
          cursor: status === "idle" ? "pointer" : "default",
          background: dragging ? "var(--accent-green-dim)" : "var(--bg-card)",
          transition: "all 0.2s ease",
        }}
      >
        <input
          ref={fileRef} type="file" accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {status === "idle" && (
          <>
            <div style={{
              width: "56px", height: "56px", borderRadius: "14px",
              background: "var(--accent-green-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <Upload size={24} color="var(--accent-green)" />
            </div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#f0f0ff", marginBottom: "8px" }}>
              Drop your CSV here
            </div>
            <div style={{ fontSize: "14px", color: "#8888aa" }}>
              Format is auto-detected — no configuration needed
            </div>
          </>
        )}

        {status === "success" && result && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <CheckCircle size={36} color="var(--accent-green)" />
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#f0f0ff", marginBottom: "8px" }}>
                {message}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <FileText size={12} color="#8888aa" />
                <span style={{ fontSize: "12px", color: "#8888aa" }}>{fileName}</span>
                <FormatBadge source={result.source} />
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <AlertCircle size={36} color="#ff4d6a" />
            <div style={{ fontSize: "14px", color: "#ff4d6a", fontWeight: "600" }}>{message}</div>
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "transparent",
                color: "#8888aa", fontSize: "12px", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <RefreshCw size={12} />
              Try again
            </button>
          </div>
        )}

        {status === "importing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              border: "3px solid var(--accent-green-dim)",
              borderTop: "3px solid var(--accent-green)",
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: "14px", color: "#8888aa" }}>Saving trades…</div>
          </div>
        )}
      </div>

      {/* Confirm bar */}
      {status === "success" && result && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "20px", padding: "16px 20px",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "12px",
        }}>
          <div style={{ fontSize: "13px", color: "#8888aa" }}>
            <span style={{ color: "var(--accent-green)", fontWeight: "700" }}>{result.count} trades</span>
            {" "}will be added to{" "}
            <span style={{ color: "#f0f0ff", fontWeight: "600" }}>
              {activeAccount?.name || "no account"}
            </span>
            {!activeAccount && (
              <span style={{ color: "#fb923c", marginLeft: "8px", fontSize: "11px" }}>
                — create an account first to track equity
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={reset}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "9px 16px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "transparent",
                color: "#8888aa", fontSize: "13px", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <X size={13} />
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "9px 20px", borderRadius: "8px",
                border: "none", background: "var(--accent-green)",
                color: "#000", fontSize: "13px", fontWeight: "700",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Confirm Import
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Preview table */}
      {status === "success" && result && (
        <div style={{ marginTop: "24px" }}>
          <div style={{
            fontSize: "12px", color: "#8888aa", marginBottom: "10px",
            fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            Preview — first {Math.min(result.trades.length, 10)} of {result.trades.length}
          </div>
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                  {["Date", "Symbol", "Type", "Qty", "Entry", "Exit", "P&L", "Tags"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left",
                      color: "#8888aa", fontWeight: "600", whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.trades.slice(0, 10).map((trade) => (
                  <tr key={trade.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", color: "#8888aa" }}>{trade.date}</td>
                    <td style={{ padding: "10px 14px", color: "#f0f0ff", fontWeight: "700" }}>{trade.underlying}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {trade.optionType ? (
                        <span style={{
                          padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700",
                          background: trade.optionType === "call" ? "rgba(77,159,255,0.15)" : "rgba(255,77,106,0.15)",
                          color: trade.optionType === "call" ? "#4d9fff" : "#ff4d6a",
                        }}>
                          {trade.optionType.toUpperCase()} {trade.strike ? `$${trade.strike}` : ""}
                        </span>
                      ) : (
                        <span style={{
                          padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700",
                          background: "rgba(255,255,255,0.06)", color: "#8888aa",
                        }}>
                          {trade.type.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#8888aa" }}>{trade.quantity}</td>
                    <td style={{ padding: "10px 14px", color: "#8888aa" }}>${trade.entryPrice}</td>
                    <td style={{ padding: "10px 14px", color: "#8888aa" }}>${trade.exitPrice}</td>
                    <td style={{ padding: "10px 14px", fontWeight: "700", color: trade.pnl >= 0 ? "#00e57a" : "#ff4d6a" }}>
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {(Array.isArray(trade.tags) ? trade.tags : []).slice(0, 2).map((tag: string) => (
                          <span key={tag} style={{
                            padding: "1px 6px", borderRadius: "4px", fontSize: "10px",
                            background: "rgba(255,255,255,0.06)", color: "#8888aa",
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
