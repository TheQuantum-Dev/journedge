"use client";
import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useSettings } from "../hooks/useSettings";
import {
  Calculator, TrendingUp, TrendingDown, DollarSign,
  Target, Zap, ChevronDown, Info,
} from "lucide-react";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: "10px",
  border: "1px solid var(--border)", background: "var(--bg-secondary)",
  color: "var(--text-primary)", fontSize: "15px", fontWeight: "600",
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box" as const, outline: "none",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px", fontWeight: "700", color: "var(--text-muted)",
  display: "block", marginBottom: "6px", letterSpacing: "0.5px",
};

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      {children}
      <ChevronDown size={13} color="var(--text-muted)" style={{
        position: "absolute", right: "14px", top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none",
      }} />
    </div>
  );
}

function ResultCard({
  label, value, sub, color, icon: Icon, large,
}: {
  label: string; value: string; sub?: string;
  color?: string; icon?: any; large?: boolean;
}) {
  return (
    <div style={{
      background: "var(--bg-card)", border: `1px solid ${color ? `${color}30` : "var(--border)"}`,
      borderRadius: "12px", padding: large ? "20px 22px" : "16px 18px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <span style={{
          fontSize: "11px", fontWeight: "700", color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.5px",
        }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: "26px", height: "26px", borderRadius: "7px",
            background: color ? `${color}18` : "var(--accent-green-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={13} color={color || "var(--accent-green)"} />
          </div>
        )}
      </div>
      <div style={{
        fontSize: large ? "28px" : "22px", fontWeight: "800",
        color: color || "var(--text-primary)", lineHeight: 1,
        letterSpacing: large ? "-0.5px" : "0",
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// Preset risk levels for quick-select
const RISK_PRESETS = [0.5, 1, 1.5, 2, 3, 5];

export default function PositionSizerPage() {
  const { activeAccount } = useApp();
  const { settings }      = useSettings();

  const [accountSize, setAccountSize]   = useState(
    activeAccount?.initialBalance ? String(activeAccount.initialBalance) : ""
  );
  const [riskPct, setRiskPct]           = useState(String(settings.defaultRiskPct || 1));
  const [entryPrice, setEntryPrice]     = useState("");
  const [stopPrice, setStopPrice]       = useState("");
  const [targetPrice, setTargetPrice]   = useState("");
  const [tradeType, setTradeType]       = useState<"stock" | "option" | "future">("stock");
  const [multiplier, setMultiplier]     = useState(
    tradeType === "option" ? String(settings.defaultMultiplier || 100) : "1"
  );
  const [direction, setDirection]       = useState<"long" | "short">("long");

  const handleTradeTypeChange = (t: "stock" | "option" | "future") => {
    setTradeType(t);
    if (t === "option")  setMultiplier(String(settings.defaultMultiplier || 100));
    else if (t === "future") setMultiplier("50");
    else setMultiplier("1");
  };

  const calc = useMemo(() => {
    const acc    = parseFloat(accountSize);
    const risk   = parseFloat(riskPct);
    const entry  = parseFloat(entryPrice);
    const stop   = parseFloat(stopPrice);
    const target = parseFloat(targetPrice);
    const mult   = parseFloat(multiplier) || 1;

    if (!acc || !risk || !entry || !stop || acc <= 0 || risk <= 0 || entry <= 0 || stop <= 0) {
      return null;
    }

    const riskDollars = (acc * risk) / 100;

    // Distance between entry and stop (per share/contract unit)
    const stopDistance = direction === "long"
      ? entry - stop
      : stop - entry;

    if (stopDistance <= 0) return null;

    // For options/futures the multiplier scales the dollar risk per contract
    const riskPerUnit = stopDistance * mult;
    if (riskPerUnit <= 0) return null;

    const units          = Math.floor(riskDollars / riskPerUnit);
    const actualRisk     = units * riskPerUnit;
    const positionValue  = units * entry * mult;
    const actualRiskPct  = (actualRisk / acc) * 100;

    // R:R — only if target is provided
    let rrRatio: number | null = null;
    let rewardDollars: number | null = null;
    if (target && target > 0) {
      const rewardDistance = direction === "long"
        ? target - entry
        : entry - target;
      if (rewardDistance > 0) {
        rrRatio       = rewardDistance / stopDistance;
        rewardDollars = units * rewardDistance * mult;
      }
    }

    // Breakeven win rate from R:R
    const breakevenWR = rrRatio != null && rrRatio > 0
      ? (1 / (1 + rrRatio)) * 100
      : null;

    return {
      riskDollars:   parseFloat(riskDollars.toFixed(2)),
      units,
      actualRisk:    parseFloat(actualRisk.toFixed(2)),
      actualRiskPct: parseFloat(actualRiskPct.toFixed(3)),
      positionValue: parseFloat(positionValue.toFixed(2)),
      stopDistance:  parseFloat(stopDistance.toFixed(4)),
      rrRatio:       rrRatio != null ? parseFloat(rrRatio.toFixed(2)) : null,
      rewardDollars: rewardDollars != null ? parseFloat(rewardDollars.toFixed(2)) : null,
      breakevenWR:   breakevenWR != null ? parseFloat(breakevenWR.toFixed(1)) : null,
    };
  }, [accountSize, riskPct, entryPrice, stopPrice, targetPrice, multiplier, direction]);

  const unitLabel = tradeType === "stock" ? "shares" : tradeType === "option" ? "contracts" : "contracts";

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none", WebkitAppearance: "none",
    paddingRight: "40px", cursor: "pointer",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
          Position Sizer
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
          Calculate exact position size from your risk parameters before entering a trade.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "24px", alignItems: "start" }}>

        {/* ── Left: Inputs ── */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "24px",
          display: "flex", flexDirection: "column", gap: "18px",
        }}>

          {/* Trade type toggle */}
          <div>
            <label style={labelStyle}>INSTRUMENT TYPE</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["stock", "option", "future"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTradeTypeChange(t)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: "8px",
                    border: `1px solid ${tradeType === t ? "var(--accent-green)" : "var(--border)"}`,
                    background: tradeType === t ? "var(--accent-green-dim)" : "transparent",
                    color: tradeType === t ? "var(--accent-green)" : "var(--text-muted)",
                    fontSize: "12px", fontWeight: "600", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Direction toggle */}
          <div>
            <label style={labelStyle}>DIRECTION</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["long", "short"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: "8px",
                    border: `1px solid ${direction === d
                      ? d === "long" ? "rgba(0,229,122,0.6)" : "rgba(255,77,106,0.6)"
                      : "var(--border)"}`,
                    background: direction === d
                      ? d === "long" ? "rgba(0,229,122,0.1)" : "rgba(255,77,106,0.1)"
                      : "transparent",
                    color: direction === d
                      ? d === "long" ? "#00e57a" : "#ff4d6a"
                      : "var(--text-muted)",
                    fontSize: "12px", fontWeight: "600", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: "capitalize",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Account size */}
          <div>
            <label style={labelStyle}>ACCOUNT SIZE</label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "14px", top: "50%",
                transform: "translateY(-50%)", fontSize: "14px",
                color: "var(--text-muted)", pointerEvents: "none",
              }}>$</span>
              <input
                type="number" min={0} step={1000}
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                placeholder="e.g. 25000"
                style={{ ...inputStyle, paddingLeft: "28px" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-green)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
              />
            </div>
            {activeAccount && !accountSize && (
              <button
                onClick={() => setAccountSize(String(activeAccount.initialBalance))}
                style={{
                  marginTop: "6px", background: "none", border: "none",
                  color: "var(--accent-green)", fontSize: "11px", fontWeight: "600",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0,
                }}
              >
                Use {activeAccount.name} balance (${activeAccount.initialBalance.toLocaleString()})
              </button>
            )}
          </div>

          {/* Risk % */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>RISK PER TRADE</label>
              <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--accent-green)" }}>
                {riskPct || "0"}%
                {accountSize && riskPct && (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", marginLeft: "6px" }}>
                    = ${((parseFloat(accountSize) || 0) * (parseFloat(riskPct) || 0) / 100).toFixed(2)}
                  </span>
                )}
              </span>
            </div>
            {/* Preset pills */}
            <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
              {RISK_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setRiskPct(String(p))}
                  style={{
                    flex: 1, padding: "5px 0", borderRadius: "6px", border: "1px solid",
                    borderColor: parseFloat(riskPct) === p ? "var(--accent-green)" : "var(--border)",
                    background: parseFloat(riskPct) === p ? "var(--accent-green-dim)" : "transparent",
                    color: parseFloat(riskPct) === p ? "var(--accent-green)" : "var(--text-muted)",
                    fontSize: "11px", fontWeight: "600", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {p}%
                </button>
              ))}
            </div>
            <input
              type="range" min={0.1} max={10} step={0.1}
              value={riskPct || 1}
              onChange={(e) => setRiskPct(e.target.value)}
              style={{ width: "100%", accentColor: "var(--accent-green)", cursor: "pointer" }}
            />
          </div>

          {/* Entry price */}
          <div>
            <label style={labelStyle}>ENTRY PRICE</label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "14px", top: "50%",
                transform: "translateY(-50%)", fontSize: "14px",
                color: "var(--text-muted)", pointerEvents: "none",
              }}>$</span>
              <input
                type="number" min={0} step={0.01}
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                style={{ ...inputStyle, paddingLeft: "28px" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-green)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
              />
            </div>
          </div>

          {/* Stop price */}
          <div>
            <label style={labelStyle}>STOP PRICE</label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "14px", top: "50%",
                transform: "translateY(-50%)", fontSize: "14px",
                color: "var(--text-muted)", pointerEvents: "none",
              }}>$</span>
              <input
                type="number" min={0} step={0.01}
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                placeholder="0.00"
                style={{ ...inputStyle, paddingLeft: "28px", borderColor: stopPrice ? "rgba(255,77,106,0.4)" : "var(--border)" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#ff4d6a"}
                onBlur={(e) => e.currentTarget.style.borderColor = stopPrice ? "rgba(255,77,106,0.4)" : "var(--border)"}
              />
            </div>
          </div>

          {/* Target price — optional */}
          <div>
            <label style={labelStyle}>TARGET PRICE <span style={{ color: "var(--text-muted)", fontWeight: "400", letterSpacing: 0 }}>(optional — for R:R)</span></label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "14px", top: "50%",
                transform: "translateY(-50%)", fontSize: "14px",
                color: "var(--text-muted)", pointerEvents: "none",
              }}>$</span>
              <input
                type="number" min={0} step={0.01}
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
                style={{ ...inputStyle, paddingLeft: "28px", borderColor: targetPrice ? "rgba(0,229,122,0.4)" : "var(--border)" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-green)"}
                onBlur={(e) => e.currentTarget.style.borderColor = targetPrice ? "rgba(0,229,122,0.4)" : "var(--border)"}
              />
            </div>
          </div>

          {/* Multiplier — options/futures only */}
          {tradeType !== "stock" && (
            <div>
              <label style={labelStyle}>CONTRACT MULTIPLIER</label>
              <input
                type="number" min={1} step={1}
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                placeholder="100"
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-green)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
              />
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>
                {tradeType === "option" ? "Standard equity options = 100" : "Varies by futures contract — e.g. /ES = 50, /MES = 5"}
              </div>
            </div>
          )}

          {/* Clear */}
          <button
            onClick={() => {
              setEntryPrice("");
              setStopPrice("");
              setTargetPrice("");
            }}
            style={{
              padding: "10px", borderRadius: "8px",
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", fontSize: "13px",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ff4d6a";
              e.currentTarget.style.color = "#ff4d6a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            Clear prices
          </button>
        </div>

        {/* ── Right: Results ── */}
        <div>
          {!calc ? (
            <div style={{
              background: "var(--bg-card)", border: "1px dashed var(--border)",
              borderRadius: "16px", padding: "60px 32px", textAlign: "center",
            }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "14px",
                background: "var(--accent-green-dim)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Calculator size={24} color="var(--accent-green)" />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>
                Fill in account size, risk %, entry, and stop
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: "1.6", maxWidth: "300px", margin: "0 auto" }}>
                Results update instantly. Stop must be below entry for long, above entry for short.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Primary result — position size */}
              <div style={{
                background: "var(--accent-green-dim)",
                border: "1px solid rgba(0,229,122,0.3)",
                borderRadius: "16px", padding: "24px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-green)", letterSpacing: "0.5px", marginBottom: "8px" }}>
                  POSITION SIZE
                </div>
                <div style={{ fontSize: "56px", fontWeight: "800", color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-1px" }}>
                  {calc.units.toLocaleString()}
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "6px" }}>
                  {unitLabel}
                </div>
                {calc.units === 0 && (
                  <div style={{ fontSize: "12px", color: "#fbbf24", marginTop: "8px" }}>
                    Risk amount is smaller than the cost of 1 unit — reduce stop distance or increase account size
                  </div>
                )}
              </div>

              {/* Key metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <ResultCard
                  label="Dollar Risk"
                  value={`$${calc.actualRisk.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sub={`${calc.actualRiskPct}% of account`}
                  color="#ff4d6a"
                  icon={TrendingDown}
                />
                <ResultCard
                  label="Position Value"
                  value={`$${calc.positionValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  sub={`${((calc.positionValue / parseFloat(accountSize)) * 100).toFixed(1)}% of account`}
                  icon={DollarSign}
                />
                <ResultCard
                  label="Stop Distance"
                  value={`$${calc.stopDistance.toFixed(2)}`}
                  sub={`${((calc.stopDistance / parseFloat(entryPrice)) * 100).toFixed(2)}% from entry`}
                  color="#fbbf24"
                  icon={Target}
                />
                <ResultCard
                  label="Risk / Unit"
                  value={`$${(calc.stopDistance * parseFloat(multiplier)).toFixed(2)}`}
                  sub={tradeType !== "stock" ? `$${calc.stopDistance.toFixed(2)} × ${multiplier} multiplier` : "per share"}
                  icon={Calculator}
                />
              </div>

              {/* R:R results — only when target is set */}
              {calc.rrRatio != null && calc.rewardDollars != null && (
                <div style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "14px", padding: "20px",
                }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: "14px" }}>
                    REWARD / RISK
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>R:R RATIO</div>
                      <div style={{
                        fontSize: "26px", fontWeight: "800",
                        color: calc.rrRatio >= 2 ? "#00e57a" : calc.rrRatio >= 1 ? "#fbbf24" : "#ff4d6a",
                      }}>
                        1 : {calc.rrRatio}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>POTENTIAL GAIN</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#00e57a" }}>
                        +${calc.rewardDollars.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>BREAKEVEN WR</div>
                      <div style={{
                        fontSize: "22px", fontWeight: "800",
                        color: (calc.breakevenWR || 0) <= 40 ? "#00e57a" : (calc.breakevenWR || 0) <= 50 ? "#fbbf24" : "#ff4d6a",
                      }}>
                        {calc.breakevenWR}%
                      </div>
                    </div>
                  </div>

                  {/* Visual risk/reward bar */}
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ display: "flex", gap: "3px", height: "10px", borderRadius: "6px", overflow: "hidden" }}>
                      <div style={{
                        width: `${100 / (1 + calc.rrRatio)}%`,
                        background: "#ff4d6a", borderRadius: "4px 0 0 4px",
                        transition: "width 0.3s ease",
                      }} />
                      <div style={{
                        flex: 1,
                        background: "#00e57a", borderRadius: "0 4px 4px 0",
                      }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                      <span style={{ fontSize: "10px", color: "#ff4d6a" }}>Risk ${calc.actualRisk.toFixed(0)}</span>
                      <span style={{ fontSize: "10px", color: "#00e57a" }}>Reward ${calc.rewardDollars.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Context note */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "12px", padding: "14px 16px",
                display: "flex", gap: "10px", alignItems: "flex-start",
              }}>
                <Info size={14} color="var(--text-muted)" style={{ marginTop: "1px", flexShrink: 0 }} />
                <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.7", margin: 0 }}>
                  Position size is calculated as: <strong style={{ color: "var(--text-secondary)" }}>floor(Dollar Risk ÷ (Stop Distance × Multiplier))</strong>.
                  Using <strong style={{ color: "var(--text-secondary)" }}>floor()</strong> ensures you never exceed your risk budget.
                  Actual dollar risk shown reflects the floored unit count — it may be slightly less than your target.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
