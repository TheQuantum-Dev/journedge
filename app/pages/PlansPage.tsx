"use client";
import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { TradePlan } from "../lib/types";
import {
  Plus, X, ChevronDown, Target, Clock, CheckCircle,
  XCircle, AlertCircle, BookOpen, TrendingUp, TrendingDown,
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

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      {children}
      <ChevronDown size={13} color="var(--text-muted)" style={{
        position: "absolute", right: "12px", top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none",
      }} />
    </div>
  );
}

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  icon: Clock        },
  executed:  { label: "Executed",  color: "#00e57a", bg: "rgba(0,229,122,0.1)",   icon: CheckCircle  },
  cancelled: { label: "Cancelled", color: "#8888aa", bg: "rgba(136,136,170,0.1)", icon: XCircle      },
  missed:    { label: "Missed",    color: "#ff4d6a", bg: "rgba(255,77,106,0.1)",  icon: AlertCircle  },
};

function StatusBadge({ status }: { status: TradePlan["status"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
      background: cfg.bg, color: cfg.color,
    }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

interface PlanFormProps {
  initial?: Partial<TradePlan>;
  onSave: (data: Partial<TradePlan>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function PlanForm({ initial = {}, onSave, onCancel, saving }: PlanFormProps) {
  const { playbook } = useApp();

  const [date, setDate]               = useState(initial.date || new Date().toISOString().split("T")[0]);
  const [symbol, setSymbol]           = useState(initial.symbol || "");
  const [underlying, setUnderlying]   = useState(initial.underlying || "");
  const [direction, setDirection]     = useState(initial.direction || "long");
  const [setupType, setSetupType]     = useState(initial.setupType || "");
  const [thesis, setThesis]           = useState(initial.thesis || "");
  const [entryZone, setEntryZone]     = useState(initial.entryZone || "");
  const [stopLevel, setStopLevel]     = useState(initial.stopLevel != null ? String(initial.stopLevel) : "");
  const [targetLevel, setTargetLevel] = useState(initial.targetLevel != null ? String(initial.targetLevel) : "");
  const [plannedRR, setPlannedRR]     = useState(initial.plannedRR || "");
  const [plannedSize, setPlannedSize] = useState(initial.plannedSize != null ? String(initial.plannedSize) : "");
  const [invalidation, setInvalidation] = useState(initial.invalidation || "");
  const [status, setStatus]           = useState<TradePlan["status"]>(initial.status || "pending");

  // Live R:R preview from stop and target
  const liveRR = useMemo(() => {
    if (!stopLevel || !targetLevel || !entryZone) return null;
    const entry  = parseFloat(entryZone.split("-")[0]);
    const stop   = parseFloat(stopLevel);
    const target = parseFloat(targetLevel);
    if (isNaN(entry) || isNaN(stop) || isNaN(target)) return null;
    const risk   = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    if (risk === 0) return null;
    return (reward / risk).toFixed(2);
  }, [entryZone, stopLevel, targetLevel]);

  const handleSubmit = async () => {
    if (!symbol.trim()) return;
    await onSave({
      date,
      symbol: symbol.trim().toUpperCase(),
      underlying: underlying.trim().toUpperCase() || symbol.trim().toUpperCase(),
      direction,
      setupType: setupType || undefined,
      thesis: thesis || undefined,
      entryZone: entryZone || undefined,
      stopLevel: stopLevel ? parseFloat(stopLevel) : undefined,
      targetLevel: targetLevel ? parseFloat(targetLevel) : undefined,
      plannedRR: plannedRR || (liveRR ? `1:${liveRR}` : undefined),
      plannedSize: plannedSize ? parseFloat(plannedSize) : undefined,
      invalidation: invalidation || undefined,
      status,
    });
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none", WebkitAppearance: "none",
    paddingRight: "36px", cursor: "pointer",
  };

  return (
    <div>
      {/* Live R:R preview */}
      {liveRR && (
        <div style={{
          background: "rgba(0,229,122,0.08)", border: "1px solid rgba(0,229,122,0.2)",
          borderRadius: "10px", padding: "12px 16px", marginBottom: "20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Planned R:R</span>
          <span style={{ fontSize: "18px", fontWeight: "800", color: "var(--accent-green)" }}>
            1 : {liveRR}
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>SYMBOL</label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="e.g. SPXW or AAPL or /ES"
            style={inputStyle}
            autoFocus
          />
        </div>

        <div>
          <label style={labelStyle}>DATE</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>DIRECTION</label>
          <SelectWrap>
            <select value={direction} onChange={(e) => setDirection(e.target.value)} style={selectStyle}>
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </SelectWrap>
        </div>

        <div>
          <label style={labelStyle}>SETUP TYPE</label>
          <SelectWrap>
            <select value={setupType} onChange={(e) => setSetupType(e.target.value)} style={selectStyle}>
              <option value="">Select or leave blank</option>
              {(playbook as any[]).map((p: any) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </SelectWrap>
        </div>

        <div>
          <label style={labelStyle}>STATUS</label>
          <SelectWrap>
            <select value={status} onChange={(e) => setStatus(e.target.value as TradePlan["status"])} style={selectStyle}>
              <option value="pending">Pending</option>
              <option value="executed">Executed</option>
              <option value="cancelled">Cancelled</option>
              <option value="missed">Missed</option>
            </select>
          </SelectWrap>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>THESIS</label>
          <textarea
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            placeholder="Why are you taking this trade? What does the setup tell you?"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
          />
        </div>

        <div>
          <label style={labelStyle}>ENTRY ZONE</label>
          <input
            value={entryZone}
            onChange={(e) => setEntryZone(e.target.value)}
            placeholder="e.g. 450 or 448-452"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>PLANNED SIZE</label>
          <input
            value={plannedSize}
            onChange={(e) => setPlannedSize(e.target.value)}
            placeholder="Contracts / shares"
            type="number"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>STOP LEVEL</label>
          <input
            value={stopLevel}
            onChange={(e) => setStopLevel(e.target.value)}
            placeholder="Price that invalidates the trade"
            type="number" step="0.01"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>TARGET LEVEL</label>
          <input
            value={targetLevel}
            onChange={(e) => setTargetLevel(e.target.value)}
            placeholder="Profit target"
            type="number" step="0.01"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>PLANNED R:R</label>
          <input
            value={plannedRR}
            onChange={(e) => setPlannedRR(e.target.value)}
            placeholder={liveRR ? `Calculated: 1:${liveRR}` : "e.g. 1:2"}
            style={inputStyle}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>INVALIDATION</label>
          <textarea
            value={invalidation}
            onChange={(e) => setInvalidation(e.target.value)}
            placeholder="What price action, level, or event would make you abandon this trade?"
            rows={2}
            style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={handleSubmit}
          disabled={saving || !symbol.trim()}
          style={{
            flex: 1, padding: "12px", borderRadius: "8px", border: "none",
            background: symbol.trim() ? "var(--accent-green)" : "var(--border)",
            color: symbol.trim() ? "#000" : "var(--text-muted)",
            fontSize: "14px", fontWeight: "700",
            cursor: saving || !symbol.trim() ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {saving ? "Saving..." : initial.id ? "Update Plan" : "Save Plan"}
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

function PlanCard({
  plan,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  plan: TradePlan;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TradePlan["status"]) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "14px", overflow: "hidden",
      transition: "border-color 0.15s ease",
    }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-green)"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
    >
      {/* Top accent bar */}
      <div style={{
        height: "3px",
        background: plan.direction === "long"
          ? "linear-gradient(90deg, #00e57a, #4d9fff)"
          : "linear-gradient(90deg, #ff4d6a, #fb923c)",
      }} />

      <div style={{ padding: "16px 18px" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "17px", fontWeight: "800", color: "var(--text-primary)" }}>
              {plan.symbol}
            </span>
            <span style={{
              padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700",
              background: plan.direction === "long" ? "rgba(0,229,122,0.12)" : "rgba(255,77,106,0.12)",
              color: plan.direction === "long" ? "#00e57a" : "#ff4d6a",
            }}>
              {plan.direction.toUpperCase()}
            </span>
            {plan.setupType && (
              <span style={{
                padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                background: "var(--accent-green-dim)", color: "var(--accent-green)",
              }}>
                {plan.setupType}
              </span>
            )}
          </div>

          {/* Status button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <StatusBadge status={plan.status} />
            </button>
            {showStatusMenu && (
              <>
                <div onClick={() => setShowStatusMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", right: 0,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "8px", zIndex: 20, overflow: "hidden", minWidth: "130px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                }}>
                  {(Object.keys(STATUS_CONFIG) as TradePlan["status"][]).map((s) => (
                    <button
                      key={s}
                      onClick={() => { onStatusChange(s); setShowStatusMenu(false); }}
                      style={{
                        width: "100%", padding: "9px 14px", border: "none",
                        background: plan.status === s ? "var(--bg-hover)" : "transparent",
                        cursor: "pointer", textAlign: "left",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <StatusBadge status={s} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Date */}
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>{plan.date}</div>

        {/* Thesis */}
        {plan.thesis && (
          <p style={{
            fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6",
            marginBottom: "12px",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const, overflow: "hidden",
          }}>
            {plan.thesis}
          </p>
        )}

        {/* Levels */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          {plan.entryZone && (
            <div style={{
              background: "var(--bg-secondary)", borderRadius: "6px",
              padding: "6px 10px", fontSize: "11px",
            }}>
              <span style={{ color: "var(--text-muted)" }}>Entry </span>
              <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{plan.entryZone}</span>
            </div>
          )}
          {plan.stopLevel && (
            <div style={{
              background: "var(--bg-secondary)", borderRadius: "6px",
              padding: "6px 10px", fontSize: "11px",
            }}>
              <span style={{ color: "var(--text-muted)" }}>Stop </span>
              <span style={{ fontWeight: "700", color: "#ff4d6a" }}>${plan.stopLevel}</span>
            </div>
          )}
          {plan.targetLevel && (
            <div style={{
              background: "var(--bg-secondary)", borderRadius: "6px",
              padding: "6px 10px", fontSize: "11px",
            }}>
              <span style={{ color: "var(--text-muted)" }}>Target </span>
              <span style={{ fontWeight: "700", color: "#00e57a" }}>${plan.targetLevel}</span>
            </div>
          )}
          {plan.plannedRR && (
            <div style={{
              background: "var(--bg-secondary)", borderRadius: "6px",
              padding: "6px 10px", fontSize: "11px",
            }}>
              <span style={{ color: "var(--text-muted)" }}>R:R </span>
              <span style={{ fontWeight: "700", color: "var(--accent-green)" }}>{plan.plannedRR}</span>
            </div>
          )}
        </div>

        {/* Invalidation */}
        {plan.invalidation && (
          <div style={{
            background: "rgba(255,77,106,0.06)", borderLeft: "3px solid #ff4d6a",
            borderRadius: "6px", padding: "8px 12px", marginBottom: "12px",
            fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5",
          }}>
            <span style={{ fontWeight: "600", color: "#ff4d6a" }}>Invalidation: </span>
            {plan.invalidation}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1, padding: "7px", borderRadius: "7px",
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", fontSize: "12px", fontWeight: "600",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
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
            Edit
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: "7px 12px", borderRadius: "7px",
              border: "1px solid rgba(255,77,106,0.2)",
              background: "rgba(255,77,106,0.06)",
              color: "#ff4d6a", fontSize: "12px", fontWeight: "600",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlansPage() {
  const { plans, reloadPlans, activeAccount, trades } = useApp();
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<TradePlan | null>(null);
  const [saving, setSaving]       = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Stats
  const pending   = plans.filter((p) => p.status === "pending").length;
  const executed  = plans.filter((p) => p.status === "executed").length;
  const missed    = plans.filter((p) => p.status === "missed").length;
  const cancelled = plans.filter((p) => p.status === "cancelled").length;

  // Plans that executed — cross reference with trades by planId
  const executedWithTrade = plans.filter((p) => p.status === "executed" && p.tradeId);

  const filtered = filterStatus === "all"
    ? plans
    : plans.filter((p) => p.status === filterStatus);

  const handleSave = async (data: Partial<TradePlan>) => {
    setSaving(true);
    try {
      if (editing) {
        await fetch("/api/plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...data }),
        });
      } else {
        await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: `plan-${Date.now()}`,
            accountId: activeAccount?.id || null,
            ...data,
          }),
        });
      }
      await reloadPlans();
      setShowForm(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    await fetch("/api/plans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await reloadPlans();
  };

  const handleStatusChange = async (plan: TradePlan, status: TradePlan["status"]) => {
    await fetch("/api/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: plan.id, status }),
    });
    await reloadPlans();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            Trade Plans
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Plan before you trade. Review after.
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
            New Plan
          </button>
        )}
      </div>

      {/* Stats strip */}
      {plans.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Pending",   value: pending,   color: "#fbbf24", icon: Clock        },
            { label: "Executed",  value: executed,  color: "#00e57a", icon: CheckCircle  },
            { label: "Missed",    value: missed,    color: "#ff4d6a", icon: AlertCircle  },
            { label: "Cancelled", value: cancelled, color: "#8888aa", icon: XCircle      },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              onClick={() => setFilterStatus(filterStatus === label.toLowerCase() ? "all" : label.toLowerCase())}
              style={{
                background: "var(--bg-card)", border: `1px solid ${filterStatus === label.toLowerCase() ? color : "var(--border)"}`,
                borderRadius: "12px", padding: "16px 18px", cursor: "pointer",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {label}
                </span>
                <Icon size={13} color={color} />
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* New plan / edit form */}
      {(showForm || editing) && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "24px", marginBottom: "24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
              {editing ? "Edit Plan" : "New Trade Plan"}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>
          </div>
          <PlanForm
            initial={editing || {}}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            saving={saving}
          />
        </div>
      )}

      {/* Filter pills */}
      {plans.length > 0 && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {["all", "pending", "executed", "missed", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "6px 14px", borderRadius: "20px", border: "1px solid",
                borderColor: filterStatus === s ? "var(--accent-green)" : "var(--border)",
                background: filterStatus === s ? "var(--accent-green-dim)" : "transparent",
                color: filterStatus === s ? "var(--accent-green)" : "var(--text-muted)",
                fontSize: "12px", fontWeight: "600", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize",
              }}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Plans grid */}
      {plans.length === 0 ? (
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
            <BookOpen size={24} color="var(--accent-green)" />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>
            No plans yet
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px", maxWidth: "360px", margin: "0 auto 24px" }}>
            Document your thesis before entering a trade. Compare what you planned versus what actually happened.
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
            Create your first plan
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "14px" }}>
          No {filterStatus} plans
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
          {filtered.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => { setEditing(plan); setShowForm(false); }}
              onDelete={() => handleDelete(plan.id)}
              onStatusChange={(status) => handleStatusChange(plan, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
