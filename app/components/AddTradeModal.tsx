"use client";
import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Trade } from "../lib/types";
import { X, ChevronDown } from "lucide-react";
import TagSelector from "./TagSelector";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "1px solid var(--border)", background: "var(--bg-secondary)",
  color: "#f0f0ff", fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box", outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none", WebkitAppearance: "none",
  cursor: "pointer", paddingRight: "36px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px", color: "#8888aa",
  fontWeight: "600", display: "block", marginBottom: "6px",
};

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      {children}
      <ChevronDown size={14} color="#8888aa" style={{
        position: "absolute", right: "12px", top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none",
      }} />
    </div>
  );
}

function detectType(symbol: string): string {
  const clean = symbol.trim().toUpperCase();
  if (clean.startsWith("-") || /[A-Z]+\d{6}[CP]\d+/.test(clean)) return "option";
  if (clean.startsWith("/")) return "future";
  return "stock";
}

function parseOptionSymbol(symbol: string) {
  const clean = symbol.replace(/^-/, "").trim().toUpperCase();
  const match = clean.match(/^([A-Z]+)(\d{2})(\d{2})(\d{2})([CP])(\d+\.?\d*)$/);
  if (!match) return null;
  return {
    underlying: match[1],
    expiry: `20${match[2]}-${match[3]}-${match[4]}`,
    optionType: match[5] === "C" ? "call" : "put",
    strike: parseFloat(match[6]),
  };
}

function calcPnl(
  type: string, direction: string,
  entryPrice: number, exitPrice: number,
  quantity: number, commission: number, fees: number
): number {
  const multiplier = type === "option" ? 100 : 1;
  const gross = direction === "long"
    ? (exitPrice - entryPrice) * quantity * multiplier
    : (entryPrice - exitPrice) * quantity * multiplier;
  return parseFloat((gross - commission - fees).toFixed(2));
}

interface Props {
  onClose: () => void;
}

export default function AddTradeModal({ onClose }: Props) {
  const { activeAccount, reloadTrades } = useApp();

  const [symbol, setSymbol]         = useState("");
  const [type, setType]             = useState("option");
  const [direction, setDirection]   = useState("long");
  const [optionType, setOptionType] = useState("call");
  const [underlying, setUnderlying] = useState("");
  const [strike, setStrike]         = useState("");
  const [expiry, setExpiry]         = useState("");
  const [date, setDate]             = useState(new Date().toLocaleDateString("en-US"));
  const [entryTime, setEntryTime]   = useState("");
  const [exitTime, setExitTime]     = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice]   = useState("");
  const [quantity, setQuantity]     = useState("1");
  const [commission, setCommission] = useState("0");
  const [fees, setFees]             = useState("0");
  const [rr, setRr]                 = useState("");
  const [tags, setTags]             = useState<string[]>([]);
  const [journalEntry, setJournalEntry] = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const livePnl = entryPrice && exitPrice && quantity
    ? calcPnl(
        type, direction,
        parseFloat(entryPrice), parseFloat(exitPrice),
        parseFloat(quantity),
        parseFloat(commission || "0"), parseFloat(fees || "0")
      )
    : null;

  useEffect(() => {
    if (!symbol) return;
    const detected = detectType(symbol);
    setType(detected);
    if (detected === "option") {
      const parsed = parseOptionSymbol(symbol);
      if (parsed) {
        setUnderlying(parsed.underlying);
        setExpiry(parsed.expiry);
        setOptionType(parsed.optionType);
        setStrike(String(parsed.strike));
      }
    } else {
      setUnderlying(symbol.replace(/^\//, "").toUpperCase());
    }
  }, [symbol]);

  const handleSave = async () => {
    if (!symbol.trim()) return setError("Symbol is required");
    if (!entryPrice || isNaN(parseFloat(entryPrice))) return setError("Valid entry price is required");
    if (!exitPrice || isNaN(parseFloat(exitPrice))) return setError("Valid exit price is required");
    if (!quantity || isNaN(parseFloat(quantity))) return setError("Valid quantity is required");

    setSaving(true);
    setError("");

    const pnl = calcPnl(
      type, direction,
      parseFloat(entryPrice), parseFloat(exitPrice),
      parseFloat(quantity),
      parseFloat(commission || "0"), parseFloat(fees || "0")
    );

    const trade: Trade = {
      id: `manual-${Date.now()}`,
      date,
      symbol: symbol.replace(/^-/, "").toUpperCase(),
      underlying: underlying || symbol.toUpperCase(),
      type,
      direction,
      optionType: type === "option" ? optionType : undefined,
      strike: strike ? parseFloat(strike) : undefined,
      expiry: expiry || undefined,
      quantity: parseFloat(quantity),
      entryPrice: parseFloat(entryPrice),
      exitPrice: parseFloat(exitPrice),
      commission: parseFloat(commission || "0"),
      fees: parseFloat(fees || "0"),
      pnl,
      status: pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven",
      entryTime,
      exitTime,
      rr,
      tags,
      journalEntry,
      accountId: activeAccount?.id || undefined,
    };

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trades: [trade],
          accountId: activeAccount?.id || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save trade");
      await reloadTrades();
      onClose();
    } catch {
      setError("Failed to save trade. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200 }}
      />

      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(680px, 95vw)", maxHeight: "90vh",
        background: "var(--bg-card)", borderRadius: "20px",
        border: "1px solid var(--border)", zIndex: 201,
        overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 1,
        }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#f0f0ff" }}>
              Add Trade
            </h2>
            {activeAccount && (
              <p style={{ fontSize: "12px", color: "#8888aa", marginTop: "2px" }}>
                Adding to: {activeAccount.name}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "4px", borderRadius: "6px",
          }}>
            <X size={18} color="#8888aa" />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {error && (
            <div style={{
              background: "rgba(255,77,106,0.1)", border: "1px solid #ff4d6a",
              borderRadius: "8px", padding: "10px 14px", marginBottom: "20px",
              color: "#ff4d6a", fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          {/* Live P&L preview */}
          {livePnl !== null && (
            <div style={{
              background: livePnl >= 0 ? "rgba(0,229,122,0.08)" : "rgba(255,77,106,0.08)",
              border: `1px solid ${livePnl >= 0 ? "#00e57a" : "#ff4d6a"}`,
              borderRadius: "10px", padding: "12px 16px",
              marginBottom: "20px", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: "13px", color: "#8888aa" }}>Estimated P&L</span>
              <span style={{
                fontSize: "20px", fontWeight: "700",
                color: livePnl >= 0 ? "#00e57a" : "#ff4d6a",
              }}>
                {livePnl >= 0 ? "+" : ""}${livePnl.toFixed(2)}
              </span>
            </div>
          )}

          <p style={{ fontSize: "11px", fontWeight: "700", color: "#8888aa", marginBottom: "12px", letterSpacing: "0.5px" }}>
            TRADE DETAILS
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
            {/* Symbol */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Symbol</label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. SPXW260220C6955 or AAPL or /ES"
                style={inputStyle}
              />
              {type !== "stock" && symbol && (
                <div style={{ fontSize: "11px", color: "#00e57a", marginTop: "4px" }}>
                  Detected: {type === "option" ? `${optionType.toUpperCase()} option` : "Future"} — underlying: {underlying}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Direction</label>
              <SelectWrap>
                <select value={direction} onChange={(e) => setDirection(e.target.value)} style={selectStyle}>
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </SelectWrap>
            </div>

            <div>
              <label style={labelStyle}>Date</label>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="MM/DD/YYYY"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Entry Price</label>
              <input
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00" type="number" step="0.01"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Exit Price</label>
              <input
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="0.00" type="number" step="0.01"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Quantity</label>
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1" type="number"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Commission</label>
              <input
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="0.00" type="number" step="0.01"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Fees</label>
              <input
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                placeholder="0.00" type="number" step="0.01"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Entry Time</label>
              <input
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                placeholder="e.g. 9:32 AM"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Exit Time</label>
              <input
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                placeholder="e.g. 10:15 AM"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>R:R Ratio</label>
              <input
                value={rr}
                onChange={(e) => setRr(e.target.value)}
                placeholder="e.g. 1:2"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Option details */}
          {type === "option" && (
            <>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#8888aa", marginBottom: "12px", letterSpacing: "0.5px" }}>
                OPTION DETAILS
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <label style={labelStyle}>Option Type</label>
                  <SelectWrap>
                    <select value={optionType} onChange={(e) => setOptionType(e.target.value)} style={selectStyle}>
                      <option value="call">Call</option>
                      <option value="put">Put</option>
                    </select>
                  </SelectWrap>
                </div>
                <div>
                  <label style={labelStyle}>Strike</label>
                  <input
                    value={strike}
                    onChange={(e) => setStrike(e.target.value)}
                    placeholder="0.00" type="number"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Expiry</label>
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    style={inputStyle}
                  />
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          <p style={{ fontSize: "11px", fontWeight: "700", color: "#8888aa", marginBottom: "12px", letterSpacing: "0.5px" }}>
            TAGS
          </p>
          <div style={{ marginBottom: "20px" }}>
            <TagSelector selected={tags} onChange={setTags} maxHeight={200} />
          </div>

          {/* Journal notes */}
          <p style={{ fontSize: "11px", fontWeight: "700", color: "#8888aa", marginBottom: "12px", letterSpacing: "0.5px" }}>
            JOURNAL NOTES
          </p>
          <textarea
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            placeholder="What happened? What did you do well? What would you do differently?"
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          />

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: "12px", borderRadius: "8px", border: "none",
                background: "#00e57a", color: "#000", fontSize: "14px",
                fontWeight: "700", cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {saving ? "Saving..." : "Save Trade"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "12px 20px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "transparent",
                color: "#f0f0ff", fontSize: "14px", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
