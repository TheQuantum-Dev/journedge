"use client";
import { useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import { useApp } from "../context/AppContext";
import {
  Palette, Sliders, Database, Info,
  ExternalLink, Check, AlertTriangle, FileDown,
  Download, RefreshCw, Terminal, Loader, X,
  CheckCircle2, Circle, AlertCircle, MinusCircle,
} from "lucide-react";

const CURRENT_VERSION = "3.2.0";
const GITHUB_REPO = "TheQuantum-Dev/journedge";

const ACCENT_COLORS = [
  { label: "Green",  value: "#00e57a", dim: "rgba(0,229,122,0.12)" },
  { label: "Blue",   value: "#4d9fff", dim: "rgba(77,159,255,0.12)" },
  { label: "Purple", value: "#a78bfa", dim: "rgba(167,139,250,0.12)" },
  { label: "Orange", value: "#fb923c", dim: "rgba(251,146,60,0.12)" },
  { label: "Pink",   value: "#f472b6", dim: "rgba(244,114,182,0.12)" },
];

export function applyAccentColor(value: string) {
  const color = ACCENT_COLORS.find((c) => c.value === value);
  if (!color) return;
  const root = document.documentElement;
  root.style.setProperty("--accent-green", color.value);
  root.style.setProperty("--accent-dim", color.dim);
  root.style.setProperty("--accent-green-dim", color.dim);
}

type StepStatus = "pending" | "running" | "complete" | "error" | "skipped";

interface UpdateStep {
  id: string;
  label: string;
  status: StepStatus;
  message: string;
}

type UpdatePhase = "idle" | "running" | "restart_required" | "error";

const STEP_DEFS = [
  { id: "preflight", label: "Environment check" },
  { id: "backup",    label: "Database backup"   },
  { id: "stash",     label: "Local changes"     },
  { id: "pull",      label: "Download update"   },
  { id: "install",   label: "Dependencies"      },
  { id: "migrate",   label: "Database"          },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "1px solid var(--border)", background: "var(--bg-secondary)",
  color: "#f0f0ff", fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box", outline: "none",
};

const linkStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "6px",
  color: "#8888aa", fontSize: "12px", textDecoration: "none",
  fontFamily: "'DM Sans', sans-serif",
};

function Section({ title, icon: Icon, children }: {
  title: string; icon: any; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "16px", padding: "24px", marginBottom: "16px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        marginBottom: "20px", paddingBottom: "16px",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "8px",
          background: "var(--accent-dim)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={15} color="var(--accent-green)" />
        </div>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f0f0ff" }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", marginBottom: "16px",
    }}>
      <div style={{ flex: 1, marginRight: "24px" }}>
        <div style={{ fontSize: "13px", fontWeight: "600", color: "#f0f0ff" }}>{label}</div>
        {description && (
          <div style={{ fontSize: "11px", color: "#8888aa", marginTop: "2px" }}>{description}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  const size = 15;
  if (status === "running")  return <Loader size={size} color="#4d9fff" style={{ animation: "spin 1s linear infinite" }} />;
  if (status === "complete") return <CheckCircle2 size={size} color="#00e57a" />;
  if (status === "error")    return <AlertCircle size={size} color="#ff4d6a" />;
  if (status === "skipped")  return <MinusCircle size={size} color="#8888aa" />;
  return <Circle size={size} color="#333355" />;
}

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { trades, accounts, setActivePage } = useApp();

  const [latestVersion, setLatestVersion]     = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate]   = useState(false);
  const [updateError, setUpdateError]         = useState(false);

  const [updatePhase, setUpdatePhase]         = useState<UpdatePhase>("idle");
  const [steps, setSteps]                     = useState<UpdateStep[]>(
    STEP_DEFS.map((s) => ({ ...s, status: "pending" as StepStatus, message: "" }))
  );
  const [errorDetail, setErrorDetail]         = useState("");
  const [restartLoading, setRestartLoading]   = useState(false);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);

  const [exportDone, setExportDone]           = useState(false);
  const [clearConfirm, setClearConfirm]       = useState(false);
  const [cleared, setCleared]                 = useState(false);

  useEffect(() => {
    if (settings.accentColor) applyAccentColor(settings.accentColor);
  }, [settings.accentColor]);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateError(false);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        { headers: { Accept: "application/vnd.github.v3+json" } }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const tag = data.tag_name?.replace(/^v/, "");
      setLatestVersion(tag || null);
    } catch {
      setUpdateError(true);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleAutoUpdate = () => {
    setUpdatePhase("running");
    setErrorDetail("");
    setSteps(STEP_DEFS.map((s) => ({ ...s, status: "pending" as StepStatus, message: "" })));

    const source = new EventSource("/api/update");

    source.onmessage = (e: MessageEvent) => {
      const event = JSON.parse(e.data) as {
        step: string;
        status: StepStatus;
        message: string;
        detail?: string;
      };

      if (event.step === "complete") {
        setUpdatePhase("restart_required");
        source.close();
        return;
      }

      if (event.step === "error" || event.status === "error") {
        setUpdatePhase("error");
        setErrorDetail(event.detail || event.message);
        setSteps((prev) =>
          prev.map((s) =>
            s.status === "running" ? { ...s, status: "error", message: event.message } : s
          )
        );
        source.close();
        return;
      }

      setSteps((prev) =>
        prev.map((s) =>
          s.id === event.step
            ? { ...s, status: event.status, message: event.message }
            : s
        )
      );
    };

    source.onerror = () => {
      setUpdatePhase("error");
      setErrorDetail("Connection to update server was interrupted.");
      source.close();
    };
  };

  const handleRestart = async () => {
    setRestartLoading(true);
    try {
      await fetch("/api/update/restart", { method: "POST" });
    } catch {
      // expected — server stops before responding
    }
    setRestartLoading(false);
    setShowRefreshPrompt(true);
  };

  const resetUpdateState = () => {
    setUpdatePhase("idle");
    setErrorDetail("");
    setSteps(STEP_DEFS.map((s) => ({ ...s, status: "pending" as StepStatus, message: "" })));
    setShowRefreshPrompt(false);
  };

  const isUpToDate      = latestVersion === CURRENT_VERSION;
  const updateAvailable = latestVersion && latestVersion !== CURRENT_VERSION;
  const isUpdateRunning = updatePhase === "running";

  const handleExport = () => {
    if (trades.length === 0) return;
    const headers = [
      "Date", "Symbol", "Underlying", "Type", "Direction",
      "Option Type", "Strike", "Expiry", "Quantity",
      "Entry Price", "Exit Price", "Commission", "Fees",
      "P&L", "Status", "Entry Time", "Exit Time", "R:R",
      "Tags", "Journal", "Account ID",
    ];
    const rows = trades.map((t) => [
      t.date, t.symbol, t.underlying, t.type, t.direction,
      t.optionType || "", t.strike || "", t.expiry || "",
      t.quantity, t.entryPrice, t.exitPrice, t.commission, t.fees,
      t.pnl, t.status, t.entryTime || "", t.exitTime || "", t.rr || "",
      (Array.isArray(t.tags) ? t.tags : []).join("|"),
      (t.journalEntry || "").replace(/,/g, ";"),
      t.accountId || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journedge-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  const handleClearTrades = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    try {
      await fetch("/api/trades/clear", { method: "DELETE" });
      setCleared(true);
      setClearConfirm(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setClearConfirm(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.25; transform: scale(0.5); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .dot-blink { animation: blink 0.9s ease-in-out infinite; }
      `}</style>

      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "700", color: "#f0f0ff", letterSpacing: "-0.5px" }}>
          Settings
        </h2>
        <p style={{ color: "#8888aa", fontSize: "14px", marginTop: "4px" }}>
          Preferences are saved locally to your device
        </p>
      </div>

      {updateAvailable && updatePhase === "idle" && (
        <div style={{
          background: "var(--accent-green-dim)", border: "1px solid var(--accent-green)",
          borderRadius: "14px", padding: "18px 20px", marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: "rgba(251,146,60,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Download size={16} color="var(--accent-green)" />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#f0f0ff", marginBottom: "2px" }}>
                  Journedge v{latestVersion} is available
                </div>
                <div style={{ fontSize: "12px", color: "#8888aa" }}>
                  You are on v{CURRENT_VERSION} · Updates your code, dependencies, and database automatically
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", flexShrink: 0, marginLeft: "16px" }}>
              <a
                href={`https://github.com/${GITHUB_REPO}/releases/latest`}
                target="_blank" rel="noreferrer"
                style={{
                  padding: "8px 14px", borderRadius: "8px",
                  border: "1px solid var(--accent-green)",
                  background: "transparent", color: "var(--accent-green)",
                  fontSize: "12px", fontWeight: "600",
                  textDecoration: "none", fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: "5px",
                }}
              >
                Changelog <ExternalLink size={11} />
              </a>
              <button
                onClick={handleAutoUpdate}
                style={{
                  padding: "8px 18px", borderRadius: "8px", border: "none",
                  background: "var(--accent-green)", color: "#000",
                  fontSize: "12px", fontWeight: "700",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <Download size={13} />
                Update Now
              </button>
            </div>
          </div>
        </div>
      )}

      {updatePhase !== "idle" && (
        <div style={{
          background: "var(--bg-card)", borderRadius: "14px", marginBottom: "20px",
          border: updatePhase === "error"
            ? "1px solid rgba(255,77,106,0.4)"
            : updatePhase === "restart_required"
            ? "1px solid rgba(0,229,122,0.4)"
            : "1px solid rgba(77,159,255,0.3)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: updatePhase === "error"
              ? "rgba(255,77,106,0.05)"
              : updatePhase === "restart_required"
              ? "rgba(0,229,122,0.05)"
              : "rgba(77,159,255,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {updatePhase === "running" && (
                <Loader size={16} color="#4d9fff" style={{ animation: "spin 1s linear infinite" }} />
              )}
              {updatePhase === "restart_required" && <CheckCircle2 size={16} color="#00e57a" />}
              {updatePhase === "error" && <AlertCircle size={16} color="#ff4d6a" />}
              <span style={{
                fontSize: "14px", fontWeight: "700",
                color: updatePhase === "error" ? "#ff4d6a" : updatePhase === "restart_required" ? "#00e57a" : "#4d9fff",
              }}>
                {updatePhase === "running" && `Installing Journedge v${latestVersion}...`}
                {updatePhase === "restart_required" && `Journedge v${latestVersion} installed`}
                {updatePhase === "error" && "Update failed"}
              </span>
            </div>
            {(updatePhase === "error" || updatePhase === "restart_required") && (
              <button
                onClick={resetUpdateState}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8888aa", padding: "2px" }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div style={{ padding: "16px 20px" }}>
            {steps.map((step, i) => (
              <div
                key={step.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  padding: "8px 0",
                  borderBottom: i < steps.length - 1 ? "1px solid var(--border)" : "none",
                  opacity: step.status === "pending" ? 0.35 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                <div style={{ marginTop: "1px", flexShrink: 0 }}>
                  <StepIcon status={step.status} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "13px", fontWeight: "600",
                    color: step.status === "complete" ? "#00e57a"
                      : step.status === "error"    ? "#ff4d6a"
                      : step.status === "running"  ? "#4d9fff"
                      : "#f0f0ff",
                  }}>
                    {step.label}
                  </div>
                  {step.message && (
                    <div style={{ fontSize: "11px", color: "#8888aa", marginTop: "2px" }}>
                      {step.message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {updatePhase === "error" && errorDetail && (
            <div style={{
              margin: "0 20px 16px",
              background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.2)",
              borderRadius: "8px", padding: "12px 14px",
            }}>
              <div style={{ fontSize: "11px", color: "#ff4d6a", fontFamily: "monospace", lineHeight: "1.5" }}>
                {errorDetail}
              </div>
              <button
                onClick={handleAutoUpdate}
                style={{
                  marginTop: "10px", padding: "6px 14px", borderRadius: "6px",
                  border: "1px solid rgba(255,77,106,0.3)", background: "transparent",
                  color: "#ff4d6a", fontSize: "12px", fontWeight: "600",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          )}

          {updatePhase === "restart_required" && (
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{
                background: "rgba(0,229,122,0.06)", border: "1px solid rgba(0,229,122,0.2)",
                borderRadius: "10px", padding: "16px",
              }}>
                <div style={{ fontSize: "12px", color: "#8888aa", marginBottom: "12px" }}>
                  All files updated. Restart the server to apply changes.
                </div>
                <div style={{
                  background: "#0a0a12", borderRadius: "8px",
                  padding: "12px 14px", marginBottom: "14px",
                  border: "1px solid #1e1e2e",
                  display: "flex", alignItems: "center", gap: "10px",
                }}>
                  <Terminal size={12} color="#8888aa" style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#00e57a" }}>
                    npm run dev
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText("npm run dev")}
                    style={{
                      marginLeft: "auto", background: "none", border: "none",
                      cursor: "pointer", color: "#8888aa", fontSize: "10px",
                      fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
                    }}
                  >
                    Copy
                  </button>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {!showRefreshPrompt ? (
                    <button
                      onClick={handleRestart}
                      disabled={restartLoading}
                      style={{
                        padding: "9px 18px", borderRadius: "8px", border: "none",
                        background: "var(--accent-green)", color: "#000",
                        fontSize: "13px", fontWeight: "700",
                        cursor: restartLoading ? "default" : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        display: "flex", alignItems: "center", gap: "7px",
                        opacity: restartLoading ? 0.7 : 1,
                      }}
                    >
                      {restartLoading
                        ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} />
                        : <RefreshCw size={13} />
                      }
                      {restartLoading ? "Restarting..." : "Restart Server"}
                    </button>
                  ) : (
                    <div style={{
                      padding: "9px 16px", borderRadius: "8px",
                      background: "rgba(0,229,122,0.1)", border: "1px solid rgba(0,229,122,0.3)",
                      fontSize: "12px", color: "#00e57a", fontWeight: "600",
                      display: "flex", alignItems: "center", gap: "6px",
                    }}>
                      <Check size={13} />
                      Server stopped — refresh this page in a few seconds
                    </div>
                  )}
                  <span style={{ fontSize: "11px", color: "#555577" }}>
                    or restart manually in your terminal
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isUpToDate && updatePhase === "idle" && (
        <div style={{
          background: "var(--accent-green-dim)", border: "1px solid var(--accent-green)",
          borderRadius: "12px", padding: "12px 18px", marginBottom: "20px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <Check size={14} color="var(--accent-green)" />
          <span style={{ fontSize: "13px", color: "var(--accent-green)", fontWeight: "600" }}>
            Journedge is up to date — v{CURRENT_VERSION}
          </span>
        </div>
      )}

      {updateError && !checkingUpdate && updatePhase === "idle" && (
        <div style={{
          background: "rgba(136,136,170,0.08)", border: "1px solid var(--border)",
          borderRadius: "12px", padding: "12px 18px", marginBottom: "20px",
          fontSize: "12px", color: "#8888aa",
        }}>
          Could not check for updates. Make sure you are connected to the internet.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
        <div>
          <Section title="Appearance" icon={Palette}>
            <Row label="Accent Color" description="Applied across the entire interface">
              <div style={{ display: "flex", gap: "8px" }}>
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateSettings({ accentColor: color.value })}
                    title={color.label}
                    style={{
                      width: "24px", height: "24px", borderRadius: "50%",
                      background: color.value, border: "none", cursor: "pointer",
                      outline: settings.accentColor === color.value
                        ? `2px solid ${color.value}` : "2px solid transparent",
                      outlineOffset: "2px",
                      transition: "outline 0.15s ease",
                    }}
                  />
                ))}
              </div>
            </Row>
          </Section>

          <Section title="Trading Preferences" icon={Sliders}>
            <Row label="Default Options Multiplier" description="Applied to P&L calculation for options">
              <input
                type="number"
                value={settings.defaultMultiplier}
                onChange={(e) => updateSettings({ defaultMultiplier: Number(e.target.value) })}
                style={{ ...inputStyle, width: "80px", textAlign: "center" }}
              />
            </Row>
            <Row label="Default Commission" description="Pre-fills commission on manual trade entry">
              <input
                type="number" step="0.01"
                value={settings.defaultCommission}
                onChange={(e) => updateSettings({ defaultCommission: Number(e.target.value) })}
                style={{ ...inputStyle, width: "80px", textAlign: "center" }}
              />
            </Row>
            <Row label="Default Fees" description="Pre-fills fees on manual trade entry">
              <input
                type="number" step="0.01"
                value={settings.defaultFees}
                onChange={(e) => updateSettings({ defaultFees: Number(e.target.value) })}
                style={{ ...inputStyle, width: "80px", textAlign: "center" }}
              />
            </Row>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={resetSettings}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#8888aa", fontSize: "12px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Reset to defaults
              </button>
            </div>
          </Section>
        </div>

        <div>
          <Section title="Data Management" icon={Database}>
            <Row
              label="Export Trades"
              description={`${trades.length} trade${trades.length !== 1 ? "s" : ""} across ${accounts.length} account${accounts.length !== 1 ? "s" : ""}`}
            >
              <button
                onClick={handleExport}
                disabled={trades.length === 0}
                style={{
                  padding: "8px 16px", borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: exportDone ? "rgba(0,229,122,0.1)" : "transparent",
                  color: exportDone ? "#00e57a" : "#f0f0ff",
                  fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: "6px",
                  opacity: trades.length === 0 ? 0.5 : 1,
                }}
              >
                {exportDone ? <Check size={13} /> : null}
                {exportDone ? "Exported" : "Export CSV"}
              </button>
            </Row>
            <Row
              label="Export PDF Report"
              description="Generate a full performance report with filters and layout options"
            >
              <button
                onClick={() => setActivePage("export")}
                style={{
                  padding: "8px 16px", borderRadius: "8px",
                  border: "1px solid var(--border)", background: "transparent",
                  color: "#f0f0ff", fontSize: "12px", fontWeight: "600",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <FileDown size={13} />
                Open Export
              </button>
            </Row>
            <Row
              label="Clear All Trades"
              description="Permanently deletes all trades. This cannot be undone."
            >
              <button
                onClick={handleClearTrades}
                style={{
                  padding: "8px 16px", borderRadius: "8px",
                  border: `1px solid ${clearConfirm ? "#ff4d6a" : "var(--border)"}`,
                  background: clearConfirm ? "rgba(255,77,106,0.1)" : "transparent",
                  color: clearConfirm ? "#ff4d6a" : "#8888aa",
                  fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {cleared ? "Cleared" : clearConfirm ? "Confirm — cannot be undone" : "Clear all trades"}
              </button>
            </Row>
          </Section>

          <Section title="About" icon={Info}>
            <Row label="Version" description="Current installed version">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  fontSize: "12px", fontWeight: "700", color: "var(--accent-green)",
                  background: "var(--accent-dim)", padding: "3px 10px",
                  borderRadius: "20px",
                }}>
                  v{CURRENT_VERSION}
                </span>
                <button
                  onClick={checkForUpdates}
                  disabled={checkingUpdate || isUpdateRunning}
                  title="Check for updates"
                  style={{
                    background: "none", border: "none",
                    cursor: (checkingUpdate || isUpdateRunning) ? "default" : "pointer",
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "4px 8px", borderRadius: "6px",
                    transition: "opacity 0.2s ease",
                    opacity: isUpdateRunning ? 0.4 : 1,
                  }}
                >
                  <div
                    className={checkingUpdate ? "dot-blink" : ""}
                    style={{
                      width: "7px", height: "7px", borderRadius: "50%",
                      background: checkingUpdate ? "#8888aa" : "var(--accent-green)",
                      boxShadow: checkingUpdate ? "none" : "0 0 6px var(--accent-green)",
                      flexShrink: 0,
                      transition: "background 0.3s ease, box-shadow 0.3s ease",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#8888aa", fontFamily: "'DM Sans', sans-serif" }}>
                    {checkingUpdate ? "Checking..." : "Check for updates"}
                  </span>
                </button>
              </div>
            </Row>
            <Row label="Source Code" description="View the full codebase on GitHub">
              <a href={`https://github.com/${GITHUB_REPO}`} target="_blank" rel="noreferrer" style={linkStyle}>
                GitHub <ExternalLink size={11} />
              </a>
            </Row>
            <Row label="Changelog" description="See what changed in each release">
              <a href={`https://github.com/${GITHUB_REPO}/releases`} target="_blank" rel="noreferrer" style={linkStyle}>
                Releases <ExternalLink size={11} />
              </a>
            </Row>
            <Row label="Contributing" description="Help improve Journedge">
              <a href={`https://github.com/${GITHUB_REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer" style={linkStyle}>
                CONTRIBUTING.md <ExternalLink size={11} />
              </a>
            </Row>
          </Section>
        </div>
      </div>
    </>
  );
}