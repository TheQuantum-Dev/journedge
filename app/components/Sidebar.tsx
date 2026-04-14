"use client";
import {
  LayoutDashboard, BookOpen, BarChart2, Calendar,
  Upload, PlusCircle, Settings, Wallet, ChevronDown,
  FileDown, ClipboardList, Library,
} from "lucide-react";
import Image from "next/image";
import { useApp } from "../context/AppContext";
import { PageId, Account } from "../lib/types";
import { useState } from "react";

const NAV_ITEMS: { icon: any; label: string; id: PageId }[] = [
  { icon: LayoutDashboard, label: "Dashboard",   id: "dashboard" },
  { icon: BookOpen,        label: "Journal",      id: "journal"   },
  { icon: BarChart2,       label: "Analytics",    id: "analytics" },
  { icon: Calendar,        label: "Calendar",     id: "calendar"  },
  { icon: ClipboardList,   label: "Trade Plans",  id: "plans"     },
  { icon: Library,         label: "Playbook",     id: "playbook"  },
  { icon: Wallet,          label: "Accounts",     id: "accounts"  },
  { icon: Upload,          label: "Import Trades",id: "import"    },
  { icon: FileDown,        label: "Export",       id: "export"    },
];

interface SidebarProps {
  onAddTrade: () => void;
}

export default function Sidebar({ onAddTrade }: SidebarProps) {
  const { activePage, setActivePage, accounts, activeAccount, setActiveAccount } = useApp();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  return (
    <aside style={{
      width: "220px", minWidth: "220px",
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      padding: "24px 0",
    }}>
      {/* Logo */}
      <div style={{ paddingBottom: "28px" }}>
        <Image
          src="/journedge-logo-dark.svg"
          alt="Journedge"
          width={190}
          height={46}
          priority
          style={{ display: "block", margin: "0 auto" }}
        />
      </div>

      {/* Account Switcher */}
      {accounts.length > 0 && (
        <div style={{ padding: "0 12px 20px", position: "relative" }}>
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: "10px 12px",
              borderRadius: "8px", border: "1px solid var(--border)",
              background: "var(--bg-card)", cursor: "pointer", gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              <div style={{
                width: "24px", height: "24px", borderRadius: "6px",
                background: "var(--accent-green-dim)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Wallet size={12} color="var(--accent-green)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: "12px", fontWeight: "600", color: "#f0f0ff",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {activeAccount?.name || "Select Account"}
                </div>
                <div style={{ fontSize: "10px", color: "#8888aa" }}>{activeAccount?.broker || ""}</div>
              </div>
            </div>
            <ChevronDown
              size={12} color="#8888aa"
              style={{
                transform: showAccountMenu ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease", flexShrink: 0,
              }}
            />
          </button>

          {showAccountMenu && (
            <div style={{
              position: "absolute", top: "calc(100% - 8px)", left: "12px", right: "12px",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "8px", zIndex: 100, overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}>
              {accounts.map((account: Account) => (
                <button
                  key={account.id}
                  onClick={() => { setActiveAccount(account); setShowAccountMenu(false); }}
                  style={{
                    width: "100%", padding: "10px 12px", border: "none",
                    background: activeAccount?.id === account.id ? "rgba(0,229,122,0.1)" : "transparent",
                    cursor: "pointer", textAlign: "left", display: "flex",
                    alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#f0f0ff" }}>{account.name}</div>
                    <div style={{ fontSize: "10px", color: "#8888aa" }}>
                      {account.broker} · {account.currency} {account.initialBalance.toLocaleString()}
                    </div>
                  </div>
                  {activeAccount?.id === account.id && (
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-green)", flexShrink: 0 }} />
                  )}
                </button>
              ))}
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => { setActivePage("accounts"); setShowAccountMenu(false); }}
                  style={{
                    width: "100%", padding: "10px 12px", border: "none",
                    background: "transparent", cursor: "pointer",
                    textAlign: "left", fontSize: "12px", color: "#8888aa",
                    display: "flex", alignItems: "center", gap: "6px",
                  }}
                >
                  <PlusCircle size={12} />
                  Manage Accounts
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No accounts nudge */}
      {accounts.length === 0 && (
        <div style={{ padding: "0 12px 20px" }}>
          <button
            onClick={() => setActivePage("accounts")}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: "8px",
              border: "1px dashed var(--border)", background: "transparent",
              cursor: "pointer", textAlign: "left",
              fontSize: "12px", color: "#8888aa",
              display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            <PlusCircle size={12} />
            Create an account
          </button>
        </div>
      )}

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "0 12px", overflowY: "auto" }}>
        {NAV_ITEMS.map(({ icon: Icon, label, id }) => {
          const active = activePage === id || (id === "journal" && activePage === "journal-editor");
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: "10px", padding: "10px 12px", borderRadius: "8px",
                border: "none", cursor: "pointer", marginBottom: "2px",
                background: active ? "var(--accent-green-dim)" : "transparent",
                color: active ? "var(--accent-green)" : "var(--text-secondary)",
                fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
                fontWeight: active ? "600" : "400",
                transition: "all 0.15s ease", textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Add Trade */}
      <div style={{ padding: "0 12px 16px" }}>
        <button
          onClick={onAddTrade}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px", padding: "10px",
            borderRadius: "8px", border: "1px solid var(--accent-green)",
            background: "var(--accent-green-dim)", color: "var(--accent-green)",
            fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
            fontWeight: "600", cursor: "pointer",
          }}
        >
          <PlusCircle size={15} />
          Add Trade
        </button>
      </div>

      {/* Settings */}
      <div style={{ padding: "16px 12px 0", borderTop: "1px solid var(--border)" }}>
        <button
          onClick={() => setActivePage("settings")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 12px", borderRadius: "8px", border: "none",
            background: activePage === "settings" ? "var(--accent-green-dim)" : "transparent",
            color: activePage === "settings" ? "var(--accent-green)" : "var(--text-muted)",
            fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", fontWeight: activePage === "settings" ? "600" : "400",
          }}
        >
          <Settings size={15} />
          Settings
        </button>
      </div>
    </aside>
  );
}
