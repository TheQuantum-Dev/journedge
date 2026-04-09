"use client";
import { useState, useEffect } from "react";
import { X, Clock, TrendingUp, Link, Save, Image, Trash2, ExternalLink } from "lucide-react";
import { Trade } from "../lib/types";
import { useApp } from "../context/AppContext";
import TagSelector from "./TagSelector";

interface Props {
  trade: Trade | null;
  onClose: () => void;
  onSave: (updated: Trade) => void;
}

function renderJournalPreview(raw: string | null | undefined): string {
  if (!raw || raw.trim() === "") return "";
  try {
    const doc = JSON.parse(raw);
    if (doc?.type === "doc" && Array.isArray(doc.content)) {
      return doc.content
        .flatMap((node: any) =>
          Array.isArray(node.content)
            ? node.content.filter((n: any) => n.type === "text").map((n: any) => n.text)
            : []
        )
        .join(" ")
        .trim();
    }
  } catch {}
  return raw;
}

export default function TradePanel({ trade, onClose, onSave }: Props) {
  const { setActivePage, setActiveTradeId } = useApp();

  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime]   = useState("");
  const [rr, setRr]               = useState("");
  const [mae, setMae]             = useState("");
  const [mfe, setMfe]             = useState("");
  const [link, setLink]           = useState("");
  const [tags, setTags]           = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [images, setImages]       = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (trade) {
      setEntryTime(trade.entryTime || "");
      setExitTime(trade.exitTime || "");
      setRr(trade.rr || "");
      setMae(trade.mae != null ? String(trade.mae) : "");
      setMfe(trade.mfe != null ? String(trade.mfe) : "");
      setLink(trade.link || "");
      setTags(Array.isArray(trade.tags) ? trade.tags as string[] : []);
      setImages(
        typeof trade.imageUrls === "string"
          ? JSON.parse(trade.imageUrls || "[]")
          : trade.imageUrls || []
      );
    }
  }, [trade]);

  if (!trade) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        uploaded.push(data.url);
      }
    }
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((img) => img !== url));
  };

  const handleSave = async () => {
    setSaving(true);
    const updated: Trade = {
      ...trade,
      entryTime, exitTime, rr,
      mae: mae !== "" ? parseFloat(mae) : undefined,
      mfe: mfe !== "" ? parseFloat(mfe) : undefined,
      link, tags, imageUrls: images,
    };
    const res = await fetch("/api/trades", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: trade.id,
        entryTime, exitTime, rr,
        mae: mae !== "" ? parseFloat(mae) : null,
        mfe: mfe !== "" ? parseFloat(mfe) : null,
        link,
        tags: JSON.stringify(tags),
        imageUrls: JSON.stringify(images),
      }),
    });
    if (res.ok) {
      onSave(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const openFullJournal = () => {
    setActiveTradeId(trade.id);
    setActivePage("journal-editor");
    onClose();
  };

  const journalPreview = renderJournalPreview(trade.journalEntry);
  const isWin = trade.pnl >= 0;

  const fieldInput: React.CSSProperties = {
    flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "8px", padding: "9px 12px", color: "var(--text-primary)",
    fontSize: "13px", fontFamily: "'DM Sans', sans-serif", outline: "none",
    width: "100%", boxSizing: "border-box" as const,
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
      />

      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "480px", height: "100vh",
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border)",
        zIndex: 50, display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-primary)" }}>
                {trade.underlying}
              </h2>
              <span style={{
                padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                background: trade.optionType === "call" ? "rgba(77,159,255,0.15)" : "rgba(255,77,106,0.15)",
                color: trade.optionType === "call" ? "var(--accent-blue)" : "var(--accent-red)",
              }}>
                {trade.optionType ? `${trade.optionType.toUpperCase()} $${trade.strike}` : trade.type.toUpperCase()}
              </span>
              <span style={{
                padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                background: trade.status === "win" ? "var(--accent-green-dim)" : "var(--accent-red-dim)",
                color: trade.status === "win" ? "var(--accent-green)" : "var(--accent-red)",
              }}>
                {trade.status.toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{trade.date}</span>
              <span style={{
                fontSize: "13px", fontWeight: "700",
                color: isWin ? "var(--accent-green)" : "var(--accent-red)",
              }}>
                {isWin ? "+" : ""}${trade.pnl}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <button
            onClick={openFullJournal}
            style={{
              width: "100%", padding: "11px 16px", borderRadius: "10px",
              border: "1px solid var(--accent-green)",
              background: "var(--accent-green-dim)",
              color: "var(--accent-green)", fontSize: "13px", fontWeight: "700",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              marginBottom: "20px", transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-green)";
              e.currentTarget.style.color = "#000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent-green-dim)";
              e.currentTarget.style.color = "var(--accent-green)";
            }}
          >
            <ExternalLink size={14} />
            Open Full Journal
          </button>

          {journalPreview && (
            <div style={{
              background: "var(--bg-card)", borderRadius: "10px",
              padding: "14px 16px", marginBottom: "20px",
              borderLeft: "3px solid var(--accent-green)",
            }}>
              <div style={{
                fontSize: "10px", fontWeight: "600", color: "var(--text-muted)",
                letterSpacing: "0.5px", marginBottom: "8px",
              }}>
                JOURNAL PREVIEW
              </div>
              <p style={{
                fontSize: "13px", color: "var(--text-secondary)",
                lineHeight: "1.6", margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}>
                {journalPreview}
              </p>
            </div>
          )}

          {/* Trade stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "22px" }}>
            {[
              { label: "Entry",      value: `$${trade.entryPrice}` },
              { label: "Exit",       value: `$${trade.exitPrice}` },
              { label: "Qty",        value: String(trade.quantity) },
              { label: "Commission", value: `$${trade.commission}` },
              { label: "Fees",       value: `$${trade.fees}` },
              { label: "Expiry",     value: trade.expiry || "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "var(--bg-card)", borderRadius: "8px",
                padding: "10px 12px", border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Times */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{
              fontSize: "11px", color: "var(--text-muted)", fontWeight: "600",
              display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px",
            }}>
              <Clock size={11} />
              ENTRY & EXIT TIME
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} style={fieldInput} />
              <input type="time" value={exitTime}  onChange={(e) => setExitTime(e.target.value)}  style={fieldInput} />
            </div>
          </div>

          {/* R:R */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{
              fontSize: "11px", color: "var(--text-muted)", fontWeight: "600",
              display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px",
            }}>
              <TrendingUp size={11} />
              R:R RATIO
            </label>
            <input
              type="text" value={rr}
              onChange={(e) => setRr(e.target.value)}
              placeholder="e.g. 1:2.5"
              style={fieldInput}
            />
          </div>

          {/* MAE / MFE */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{
              fontSize: "11px", color: "var(--text-muted)", fontWeight: "600",
              display: "block", marginBottom: "8px", letterSpacing: "0.4px",
            }}>
              MAE / MFE
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>
                  MAE — worst move against you
                </div>
                <input
                  type="number" step="0.01" min="0" value={mae}
                  onChange={(e) => setMae(e.target.value)}
                  placeholder="e.g. 1.25"
                  style={fieldInput}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>
                  MFE — best move in your favor
                </div>
                <input
                  type="number" step="0.01" min="0" value={mfe}
                  onChange={(e) => setMfe(e.target.value)}
                  placeholder="e.g. 3.50"
                  style={fieldInput}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{
              fontSize: "11px", color: "var(--text-muted)", fontWeight: "600",
              display: "block", marginBottom: "8px", letterSpacing: "0.4px",
            }}>
              TAGS
            </label>
            <TagSelector selected={tags} onChange={setTags} maxHeight={200} />
          </div>

          {/* Chart link */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{
              fontSize: "11px", color: "var(--text-muted)", fontWeight: "600",
              display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px",
            }}>
              <Link size={11} />
              CHART LINK
            </label>
            <input
              type="url" value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://tradingview.com/..."
              style={fieldInput}
            />
          </div>

          {/* Screenshots */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              fontSize: "11px", color: "var(--text-muted)", fontWeight: "600",
              display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px",
            }}>
              <Image size={11} />
              SCREENSHOTS
            </label>
            {images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                {images.map((url) => (
                  <div key={url} style={{
                    position: "relative", borderRadius: "8px", overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}>
                    <img src={url} alt="screenshot" style={{ width: "100%", height: "110px", objectFit: "cover", display: "block" }} />
                    <button
                      onClick={() => removeImage(url)}
                      style={{
                        position: "absolute", top: "6px", right: "6px",
                        background: "rgba(0,0,0,0.7)", border: "none",
                        borderRadius: "4px", padding: "4px", cursor: "pointer",
                        display: "flex", alignItems: "center",
                      }}
                    >
                      <Trash2 size={11} color="white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "8px", padding: "10px", borderRadius: "8px",
              border: "1px dashed var(--border)", cursor: "pointer",
              color: "var(--text-muted)", fontSize: "13px",
              background: "var(--bg-card)",
            }}>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} />
              {uploading ? "Uploading..." : "Attach screenshots"}
            </label>
          </div>
        </div>

        {/* Save */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", padding: "12px", borderRadius: "8px",
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              background: "var(--accent-green)", color: "#000",
              fontSize: "14px", fontWeight: "700",
              fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            <Save size={15} />
            {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}
