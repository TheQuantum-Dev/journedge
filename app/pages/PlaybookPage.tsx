"use client";
import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { Playbook } from "../lib/types";
import {
  Plus, X, ChevronDown, Library, TrendingUp,
  TrendingDown, Target, Edit2, Trash2, BookOpen,
  Clock, Layers,
} from "lucide-react";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "1px solid var(--border)", background: "var(--bg-secondary)",
  color: "var(--text-primary)", fontSize: "13px",
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box" as const, outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px", fontWeight: "600", color: "var(--text-muted)",
  display: "block", marginBottom: "6px", letterSpacing: "0.4px",
};

// Dynamic list editor — for rules and entry triggers
function ListEditor({
  label, placeholder, items, onChange,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...items, v]);
    setInput("");
  };

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          style={{
            padding: "10px 14px", borderRadius: "8px", border: "none",
            background: input.trim() ? "var(--accent-green)" : "var(--border)",
            color: input.trim() ? "#000" : "var(--text-muted)",
            cursor: input.trim() ? "pointer" : "not-allowed",
            fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: "600",
            flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {items.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--bg-secondary)", borderRadius: "6px",
              padding: "8px 12px", fontSize: "13px", color: "var(--text-primary)",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: "var(--accent-green-dim)", color: "var(--accent-green)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", fontWeight: "700", flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                {item}
              </span>
              <button
                onClick={() => remove(i)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", padding: "2px", display: "flex",
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface PlaybookFormProps {
  initial?: Partial<Playbook>;
  onSave: (data: Partial<Playbook>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function PlaybookForm({ initial = {}, onSave, onCancel, saving }: PlaybookFormProps) {
  const [name, setName]               = useState(initial.name || "");
  const [description, setDescription] = useState(initial.description || "");
  const [timeframes, setTimeframes]   = useState(initial.timeframes || "");
  const [instruments, setInstruments] = useState(initial.instruments || "");
  const [rules, setRules]             = useState<string[]>(
    Array.isArray(initial.rules) ? initial.rules as string[] : []
  );
  const [entryTriggers, setEntryTriggers] = useState<string[]>(
    Array.isArray(initial.entryTriggers) ? initial.entryTriggers as string[] : []
  );
  const [exitRules, setExitRules]     = useState(initial.exitRules || "");
  const [notes, setNotes]             = useState(initial.notes || "");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      description: description || undefined,
      timeframes: timeframes || undefined,
      instruments: instruments || undefined,
      rules,
      entryTriggers,
      exitRules: exitRules || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={labelStyle}>SETUP NAME</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. VWAP Reclaim, Opening Range Breakout"
          style={inputStyle}
          autoFocus
        />
      </div>

      <div>
        <label style={labelStyle}>DESCRIPTION</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this setup? What market condition does it work best in?"
          rows={3}
          style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div>
          <label style={labelStyle}>TIMEFRAMES</label>
          <input
            value={timeframes}
            onChange={(e) => setTimeframes(e.target.value)}
            placeholder="e.g. 1m, 5m, daily"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>INSTRUMENTS</label>
          <input
            value={instruments}
            onChange={(e) => setInstruments(e.target.value)}
            placeholder="e.g. SPY options, /ES, AAPL"
            style={inputStyle}
          />
        </div>
      </div>

      <ListEditor
        label="SETUP RULES"
        placeholder="Add a rule — press Enter or click Add"
        items={rules}
        onChange={setRules}
      />

      <ListEditor
        label="ENTRY TRIGGERS"
        placeholder="What must happen before you enter?"
        items={entryTriggers}
        onChange={setEntryTriggers}
      />

      <div>
        <label style={labelStyle}>EXIT RULES</label>
        <textarea
          value={exitRules}
          onChange={(e) => setExitRules(e.target.value)}
          placeholder="How do you manage and exit this trade? Targets, stops, time-based exits..."
          rows={3}
          style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
        />
      </div>

      <div>
        <label style={labelStyle}>NOTES</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else — edge cases, market conditions to avoid, lessons learned"
          rows={2}
          style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
        />
      </div>

      <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
        <button
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
          style={{
            flex: 1, padding: "12px", borderRadius: "8px", border: "none",
            background: name.trim() ? "var(--accent-green)" : "var(--border)",
            color: name.trim() ? "#000" : "var(--text-muted)",
            fontSize: "14px", fontWeight: "700",
            cursor: saving || !name.trim() ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {saving ? "Saving..." : initial.id ? "Update Setup" : "Save Setup"}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "12px 20px", borderRadius: "8px",
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--text-primary)", fontSize: "14px",
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Detail view for a single playbook entry
function PlaybookDetail({
  entry, tradeCount, wins, totalPnl, winRate, avgWin, avgLoss,
  onEdit, onClose,
}: {
  entry: Playbook;
  tradeCount: number;
  wins: number;
  totalPnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  onEdit: () => void;
  onClose: () => void;
}) {
  const rules         = Array.isArray(entry.rules) ? entry.rules as string[] : [];
  const entryTriggers = Array.isArray(entry.entryTriggers) ? entry.entryTriggers as string[] : [];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, width: "520px", height: "100vh",
        background: "var(--bg-secondary)", borderLeft: "1px solid var(--border)",
        zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
                {entry.name}
              </h2>
              {entry.timeframes && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {entry.timeframes}
                  {entry.instruments && ` · ${entry.instruments}`}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={onEdit}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "7px 12px", borderRadius: "7px",
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text-muted)", fontSize: "12px", fontWeight: "600",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-green)";
                  e.currentTarget.style.color = "var(--accent-green)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <Edit2 size={12} /> Edit
              </button>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Performance strip */}
          {tradeCount > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {[
                { label: "Trades",  value: String(tradeCount),                  color: "var(--text-primary)" },
                { label: "Win Rate", value: `${winRate}%`,                      color: winRate >= 50 ? "#00e57a" : "#ff4d6a" },
                { label: "Net P&L", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(0)}`, color: totalPnl >= 0 ? "#00e57a" : "#ff4d6a" },
                { label: "Avg Win", value: `+$${avgWin.toFixed(0)}`,            color: "#00e57a" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: "var(--bg-card)", borderRadius: "8px", padding: "8px 10px",
                }}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {entry.description && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: "8px" }}>
                DESCRIPTION
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.7", margin: 0 }}>
                {entry.description}
              </p>
            </div>
          )}

          {rules.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: "10px" }}>
                SETUP RULES
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {rules.map((rule, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: "10px",
                    padding: "10px 12px", background: "var(--bg-card)",
                    borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)",
                    lineHeight: "1.5",
                  }}>
                    <span style={{
                      width: "20px", height: "20px", borderRadius: "50%",
                      background: "var(--accent-green-dim)", color: "var(--accent-green)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: "700", flexShrink: 0, marginTop: "1px",
                    }}>
                      {i + 1}
                    </span>
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          )}

          {entryTriggers.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: "10px" }}>
                ENTRY TRIGGERS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {entryTriggers.map((trigger, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: "10px",
                    padding: "10px 12px",
                    background: "rgba(0,229,122,0.06)",
                    border: "1px solid rgba(0,229,122,0.15)",
                    borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)",
                    lineHeight: "1.5",
                  }}>
                    <span style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "var(--accent-green)", flexShrink: 0, marginTop: "5px",
                    }} />
                    {trigger}
                  </div>
                ))}
              </div>
            </div>
          )}

          {entry.exitRules && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: "8px" }}>
                EXIT RULES
              </div>
              <p style={{
                fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.7",
                margin: 0, padding: "12px", background: "var(--bg-card)", borderRadius: "8px",
              }}>
                {entry.exitRules}
              </p>
            </div>
          )}

          {entry.notes && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: "8px" }}>
                NOTES
              </div>
              <p style={{
                fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.7",
                margin: 0, padding: "12px",
                background: "var(--bg-card)",
                borderLeft: "3px solid var(--accent-green)",
                borderRadius: "8px",
              }}>
                {entry.notes}
              </p>
            </div>
          )}

          {tradeCount === 0 && (
            <div style={{
              textAlign: "center", padding: "32px",
              color: "var(--text-muted)", fontSize: "13px",
            }}>
              No trades tagged with this setup yet. Link trades by setting their playbook ID in the Trade Panel.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PlaybookCard({
  entry, tradeCount, wins, totalPnl, winRate,
  onClick, onEdit, onDelete,
}: {
  entry: Playbook;
  tradeCount: number;
  wins: number;
  totalPnl: number;
  winRate: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const rules         = Array.isArray(entry.rules) ? entry.rules as string[] : [];
  const entryTriggers = Array.isArray(entry.entryTriggers) ? entry.entryTriggers as string[] : [];

  return (
    <div
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "14px", overflow: "hidden", cursor: "pointer",
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent-green)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        height: "3px",
        background: "linear-gradient(90deg, var(--accent-green), #4d9fff)",
      }} />

      <div style={{ padding: "16px 18px" }}>
        {/* Name + actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
            {entry.name}
          </h3>
          <div
            style={{ display: "flex", gap: "6px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onEdit}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", padding: "4px", display: "flex",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent-green)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={onDelete}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", padding: "4px", display: "flex",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ff4d6a"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
          {entry.timeframes && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
              <Clock size={10} /> {entry.timeframes}
            </span>
          )}
          {entry.instruments && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
              <Layers size={10} /> {entry.instruments}
            </span>
          )}
        </div>

        {entry.description && (
          <p style={{
            fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.6",
            marginBottom: "12px",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const, overflow: "hidden",
          }}>
            {entry.description}
          </p>
        )}

        {/* Rules preview */}
        {rules.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.4px", marginBottom: "6px" }}>
              {rules.length} RULE{rules.length !== 1 ? "S" : ""}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              {rules[0]}
              {rules.length > 1 && <span style={{ color: "var(--text-muted)" }}> +{rules.length - 1} more</span>}
            </div>
          </div>
        )}

        {/* Performance */}
        {tradeCount > 0 ? (
          <div style={{
            display: "flex", gap: "8px", paddingTop: "12px",
            borderTop: "1px solid var(--border)",
          }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>TRADES</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>{tradeCount}</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>WIN RATE</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: winRate >= 50 ? "#00e57a" : "#ff4d6a" }}>{winRate}%</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>NET P&L</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: totalPnl >= 0 ? "#00e57a" : "#ff4d6a" }}>
                {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            paddingTop: "12px", borderTop: "1px solid var(--border)",
            fontSize: "11px", color: "var(--text-muted)", textAlign: "center",
          }}>
            No trades linked yet
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlaybookPage() {
  const { playbook, reloadPlaybook, trades } = useApp();
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Playbook | null>(null);
  const [viewing, setViewing]       = useState<Playbook | null>(null);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");

  // Per-entry trade stats
  const statsById = useMemo(() => {
    const map: Record<string, { count: number; wins: number; totalPnl: number; avgWin: number; avgLoss: number }> = {};
    for (const entry of playbook) {
      const tagged = trades.filter((t) => t.playbookId === entry.id);
      const wins   = tagged.filter((t) => t.status === "win");
      const losses = tagged.filter((t) => t.status === "loss");
      map[entry.id] = {
        count:    tagged.length,
        wins:     wins.length,
        totalPnl: parseFloat(tagged.reduce((s, t) => s + t.pnl, 0).toFixed(2)),
        avgWin:   wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0,
        avgLoss:  losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0,
      };
    }
    return map;
  }, [playbook, trades]);

  const filtered = useMemo(() => {
    if (!search.trim()) return playbook;
    const q = search.toLowerCase();
    return playbook.filter((e) =>
      e.name.toLowerCase().includes(q) ||
      (e.description || "").toLowerCase().includes(q) ||
      (e.instruments || "").toLowerCase().includes(q)
    );
  }, [playbook, search]);

  const handleSave = async (data: Partial<Playbook>) => {
    setSaving(true);
    try {
      if (editing) {
        await fetch("/api/playbook", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...data }),
        });
      } else {
        await fetch("/api/playbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: `pb-${Date.now()}`,
            ...data,
          }),
        });
      }
      await reloadPlaybook();
      setShowForm(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this playbook entry? Trades linked to it will not be deleted.")) return;
    await fetch("/api/playbook", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await reloadPlaybook();
    if (viewing?.id === id) setViewing(null);
  };

  const totalSetups  = playbook.length;
  const totalTagged  = trades.filter((t) => t.playbookId).length;
  const bestSetup    = playbook.reduce<Playbook | null>((best, e) => {
    const s = statsById[e.id];
    if (!best) return s.count > 0 ? e : null;
    return (s.totalPnl > (statsById[best.id]?.totalPnl || -Infinity)) ? e : best;
  }, null);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            Playbook
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Document your setups. Know which ones actually work.
          </p>
        </div>
        {!showForm && !editing && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 16px", borderRadius: "8px", border: "none",
              background: "var(--accent-green)", color: "#000",
              fontSize: "13px", fontWeight: "600", cursor: "pointer",
            }}
          >
            <Plus size={15} />
            New Setup
          </button>
        )}
      </div>

      {/* Stats strip */}
      {playbook.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 18px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: "8px" }}>
              TOTAL SETUPS
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)" }}>{totalSetups}</div>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 18px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: "8px" }}>
              TRADES TAGGED
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--accent-green)" }}>{totalTagged}</div>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 18px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: "8px" }}>
              BEST SETUP
            </div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
              {bestSetup ? bestSetup.name : "—"}
            </div>
            {bestSetup && statsById[bestSetup.id]?.count > 0 && (
              <div style={{ fontSize: "11px", color: "#00e57a", marginTop: "2px" }}>
                +${statsById[bestSetup.id].totalPnl.toFixed(0)} · {statsById[bestSetup.id].count} trades
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      {(showForm || editing) && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "24px", marginBottom: "24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
              {editing ? "Edit Setup" : "New Setup"}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>
          </div>
          <PlaybookForm
            initial={editing || {}}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            saving={saving}
          />
        </div>
      )}

      {/* Empty state */}
      {playbook.length === 0 ? (
        <div style={{
          background: "var(--bg-card)", border: "1px dashed var(--border)",
          borderRadius: "16px", padding: "60px", textAlign: "center",
        }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "14px",
            background: "var(--accent-green-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <Library size={24} color="var(--accent-green)" />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>
            No setups yet
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px", maxWidth: "380px", margin: "0 auto 24px" }}>
            Document your trading strategies here. Define the rules, entry triggers, and exit criteria for each setup you trade.
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "10px 24px", borderRadius: "8px", border: "none",
              background: "var(--accent-green)", color: "#000",
              fontSize: "13px", fontWeight: "700",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Add your first setup
          </button>
        </div>
      ) : (
        <>
          {/* Search */}
          <div style={{ marginBottom: "20px" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search setups..."
              style={{ ...inputStyle, maxWidth: "320px" }}
            />
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "14px" }}>
              No setups match "{search}"
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
              {filtered.map((entry) => {
                const s = statsById[entry.id] || { count: 0, wins: 0, totalPnl: 0, avgWin: 0, avgLoss: 0 };
                const wr = s.count > 0 ? Math.round((s.wins / s.count) * 100) : 0;
                return (
                  <PlaybookCard
                    key={entry.id}
                    entry={entry}
                    tradeCount={s.count}
                    wins={s.wins}
                    totalPnl={s.totalPnl}
                    winRate={wr}
                    onClick={() => setViewing(entry)}
                    onEdit={() => { setEditing(entry); setShowForm(false); setViewing(null); }}
                    onDelete={() => handleDelete(entry.id)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Detail panel */}
      {viewing && (
        <PlaybookDetail
          entry={viewing}
          tradeCount={statsById[viewing.id]?.count || 0}
          wins={statsById[viewing.id]?.wins || 0}
          totalPnl={statsById[viewing.id]?.totalPnl || 0}
          winRate={statsById[viewing.id]?.count > 0
            ? Math.round((statsById[viewing.id].wins / statsById[viewing.id].count) * 100)
            : 0}
          avgWin={statsById[viewing.id]?.avgWin || 0}
          avgLoss={statsById[viewing.id]?.avgLoss || 0}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
