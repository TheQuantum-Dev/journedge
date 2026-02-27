"use client";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Account } from "../lib/types";
import { Wallet, Plus, Check, Trash2, ChevronDown } from "lucide-react";

const BROKERS = [
  "Fidelity", "TD Ameritrade", "Charles Schwab", "Interactive Brokers",
  "Webull", "Robinhood", "E*TRADE", "Tastytrade", "TradeStation", "Other",
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg-secondary)",
  color: "#f0f0ff",
  fontSize: "13px",
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
  paddingRight: "36px",
};

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      {children}
      <ChevronDown
        size={14}
        color="#8888aa"
        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      />
    </div>
  );
}

export default function AccountsPage() {
  const { accounts, activeAccount, setActiveAccount, addAccount } = useApp();
  const [showForm, setShowForm] = useState(accounts.length === 0);
  const [name, setName] = useState("");
  const [broker, setBroker] = useState(BROKERS[0]);
  const [initialBalance, setInitialBalance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return setError("Account name is required");
    if (!initialBalance || isNaN(Number(initialBalance))) return setError("Valid initial balance is required");

    setSaving(true);
    setError("");

    const account: Account = {
      id: `acc-${Date.now()}`,
      name: name.trim(),
      broker,
      initialBalance: parseFloat(initialBalance),
      currency,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account),
      });

      if (!res.ok) throw new Error("Failed to create account");

      addAccount(account);
      setShowForm(false);
      setName("");
      setInitialBalance("");
    } catch (err) {
      setError("Failed to save account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this account? This won't delete your trades.")) return;
    await fetch("/api/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    window.location.reload();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: "700", color: "#f0f0ff", letterSpacing: "-0.5px" }}>
            Accounts
          </h2>
          <p style={{ color: "#8888aa", fontSize: "14px", marginTop: "4px" }}>
            Manage your trading accounts and track equity per account
          </p>
        </div>
        {accounts.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 16px", borderRadius: "8px", border: "none",
              background: "#00e57a", color: "#000", fontSize: "13px",
              fontWeight: "600", cursor: "pointer",
            }}
          >
            <Plus size={15} />
            New Account
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "24px", marginBottom: "24px",
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f0f0ff", marginBottom: "20px" }}>
            {accounts.length === 0 ? "Create your first account" : "New Account"}
          </h3>

          {error && (
            <div style={{
              background: "rgba(255,77,106,0.1)", border: "1px solid #ff4d6a",
              borderRadius: "8px", padding: "10px 14px", marginBottom: "16px",
              color: "#ff4d6a", fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Account Name */}
            <div>
              <label style={{ fontSize: "12px", color: "#8888aa", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                Account Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Trading Account"
                style={inputStyle}
              />
            </div>

            {/* Broker */}
            <div>
              <label style={{ fontSize: "12px", color: "#8888aa", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                Broker
              </label>
              <SelectWrapper>
                <select value={broker} onChange={(e) => setBroker(e.target.value)} style={selectStyle}>
                  {BROKERS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </SelectWrapper>
            </div>

            {/* Initial Balance */}
            <div>
              <label style={{ fontSize: "12px", color: "#8888aa", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                Initial Balance
              </label>
              <input
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="e.g. 10000"
                type="number"
                style={inputStyle}
              />
            </div>

            {/* Currency */}
            <div>
              <label style={{ fontSize: "12px", color: "#8888aa", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                Currency
              </label>
              <SelectWrapper>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={selectStyle}>
                  {["USD", "EUR", "GBP", "CAD", "AUD", "JPY"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </SelectWrapper>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{
                padding: "10px 20px", borderRadius: "8px", border: "none",
                background: "#00e57a", color: "#000", fontSize: "13px",
                fontWeight: "600", cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Creating..." : "Create Account"}
            </button>
            {accounts.length > 0 && (
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: "10px 20px", borderRadius: "8px",
                  border: "1px solid var(--border)", background: "transparent",
                  color: "#f0f0ff", fontSize: "13px", cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Account Cards */}
      {accounts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {accounts.map((account: Account) => {
            const isActive = activeAccount?.id === account.id;
            return (
              <div
                key={account.id}
                onClick={() => setActiveAccount(account)}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${isActive ? "#00e57a" : "var(--border)"}`,
                  borderRadius: "16px", padding: "20px", cursor: "pointer",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                {isActive && (
                  <div style={{
                    position: "absolute", top: "12px", right: "12px",
                    background: "rgba(0,229,122,0.15)", borderRadius: "20px",
                    padding: "2px 8px", display: "flex", alignItems: "center", gap: "4px",
                  }}>
                    <Check size={10} color="#00e57a" />
                    <span style={{ fontSize: "10px", color: "#00e57a", fontWeight: "600" }}>ACTIVE</span>
                  </div>
                )}

                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: isActive ? "rgba(0,229,122,0.15)" : "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "12px",
                }}>
                  <Wallet size={18} color={isActive ? "#00e57a" : "#8888aa"} />
                </div>

                <div style={{ fontSize: "16px", fontWeight: "700", color: "#f0f0ff", marginBottom: "4px" }}>
                  {account.name}
                </div>
                <div style={{ fontSize: "12px", color: "#8888aa", marginBottom: "16px" }}>
                  {account.broker}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#8888aa", marginBottom: "2px" }}>Initial Balance</div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#00e57a" }}>
                      {account.currency} {account.initialBalance.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(account.id); }}
                    style={{
                      background: "rgba(255,77,106,0.1)", border: "none",
                      borderRadius: "6px", padding: "6px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Trash2 size={13} color="#ff4d6a" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}