"use client";
import { useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import { useApp } from "../context/AppContext";
import {
  Palette, Sliders, Database, Info,
  ExternalLink, Check, AlertTriangle, FileDown,
} from "lucide-react";

const CURRENT_VERSION = "2.0.0";
const GITHUB_REPO = "TheQuantum-Dev/tradello";

const ACCENT_COLORS = [
  { label: "Green", value: "#00e57a", dim: "rgba(0,229,122,0.12)" },
  { label: "Blue", value: "#4d9fff", dim: "rgba(77,159,255,0.12)" },
  { label: "Purple", value: "#a78bfa", dim: "rgba(167,139,250,0.12)" },
  { label: "Orange", value: "#fb923c", dim: "rgba(251,146,60,0.12)" },
  { label: "Pink", value: "#f472b6", dim: "rgba(244,114,182,0.12)" },
];

export function applyAccentColor(value: string) {
  const color = ACCENT_COLORS.find((c) => c.value === value);
  if (!color) return;
  const root = document.documentElement;
  root.style.setProperty("--accent-green", color.value);
  root.style.setProperty("--accent-dim", color.dim);
  root.style.setProperty("--accent-green-dim", color.dim);
}

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
        <div style={{ fontSize: "13px", fontWeight: "600", color: "#f0f0ff" }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: "11px", color: "#8888aa", marginTop: "2px" }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { trades, accounts, setActivePage } = useApp();

  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);

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

  const isUpToDate = latestVersion === CURRENT_VERSION;
  const updateAvailable = latestVersion && latestVersion !== CURRENT_VERSION;

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
    a.download = `tradello-export-${new Date().toISOString().split("T")[0]}.csv`;
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
        .dot-blink {
          animation: blink 0.9s ease-in-out infinite;
        }
      `}</style>

      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "700", color: "#f0f0ff", letterSpacing: "-0.5px" }}>
          Settings
        </h2>
        <p style={{ color: "#8888aa", fontSize: "14px", marginTop: "4px" }}>
          Preferences are saved locally to your device
        </p>
      </div>

      {updateAvailable && (
        <div style={{
          background: "rgba(251,146,60,0.1)", border: "1px solid #fb923c",
          borderRadius: "12px", padding: "14px 18px", marginBottom: "20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={16} color="#fb923c" />
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#f0f0ff" }}>
                Update available — v{latestVersion}
              </div>
              <div style={{ fontSize: "11px", color: "#8888aa" }}>
                You are on v{CURRENT_VERSION}
              </div>
            </div>
          </div>
          <a
            href={`https://github.com/${GITHUB_REPO}/releases/latest`}
            target="_blank" rel="noreferrer"
            style={{
              padding: "7px 14px", borderRadius: "8px",
              background: "#fb923c", color: "#000", fontSize: "12px",
              fontWeight: "600", textDecoration: "none",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            View release
          </a>
        </div>
      )}

      {isUpToDate && (
        <div style={{
          background: "rgba(0,229,122,0.08)", border: "1px solid rgba(0,229,122,0.3)",
          borderRadius: "12px", padding: "12px 18px", marginBottom: "20px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <Check size={14} color="#00e57a" />
          <span style={{ fontSize: "13px", color: "#00e57a", fontWeight: "600" }}>
            Tradello is up to date — v{CURRENT_VERSION}
          </span>
        </div>
      )}

      {updateError && !checkingUpdate && (
        <div style={{
          background: "rgba(136,136,170,0.08)", border: "1px solid var(--border)",
          borderRadius: "12px", padding: "12px 18px", marginBottom: "20px",
          fontSize: "12px", color: "#8888aa",
        }}>
          Could not check for updates. Make sure you are connected to the internet.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
        {/* Left column */}
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

        {/* Right column */}
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
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "#f0f0ff",
                  fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
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
                  disabled={checkingUpdate}
                  title="Check for updates"
                  style={{
                    background: "none", border: "none",
                    cursor: checkingUpdate ? "default" : "pointer",
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "4px 8px", borderRadius: "6px",
                    transition: "opacity 0.2s ease",
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
                  <span style={{
                    fontSize: "11px", color: "#8888aa",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
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
            <Row label="Contributing" description="Help improve Tradello">
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