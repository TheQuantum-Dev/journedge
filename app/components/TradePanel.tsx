"use client";
import { useState, useEffect } from "react";
import { X, Clock, TrendingUp, Tag, Link, FileText, Save, Plus, Image, Trash2 } from "lucide-react";
import { Trade } from "../lib/types";

interface Props {
  trade: Trade | null;
  onClose: () => void;
  onSave: (updated: Trade) => void;
}

const PRESET_TAGS = [
  "A+ Setup", "B Setup", "FOMO", "Revenge Trade",
  "Followed Plan", "Broke Rules", "News Play",
  "Trend Follow", "Reversal", "Overtraded"
];

export default function TradePanel({ trade, onClose, onSave }: Props) {
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [rr, setRr] = useState("");
  const [journal, setJournal] = useState("");
  const [link, setLink] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (trade) {
      setEntryTime(trade.entryTime || "");
      setExitTime(trade.exitTime || "");
      setRr(trade.rr || "");
      setJournal(trade.journalEntry || "");
      setLink(trade.link || "");
      setTags(Array.isArray(trade.tags) ? trade.tags : []);
      setImages(
        typeof trade.imageUrls === "string"
          ? JSON.parse(trade.imageUrls || "[]")
          : trade.imageUrls || []
      );
    }
  }, [trade]);

  if (!trade) return null;

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags((prev) => [...prev, customTag.trim()]);
      setCustomTag("");
    }
  };

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
    const updated = {
      ...trade,
      entryTime,
      exitTime,
      rr,
      journalEntry: journal,
      link,
      tags,
      imageUrls: images,
    };

    const res = await fetch("/api/trades", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: trade.id,
        entryTime,
        exitTime,
        rr,
        journalEntry: journal,
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

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "480px",
          height: "100vh",
          background: "var(--bg-secondary)",
          borderLeft: "1px solid var(--border)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
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
                color: trade.pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)",
              }}>
                {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

          {/* Trade Stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px", marginBottom: "24px",
          }}>
            {[
              { label: "Entry", value: `$${trade.entryPrice}` },
              { label: "Exit", value: `$${trade.exitPrice}` },
              { label: "Qty", value: trade.quantity },
              { label: "Commission", value: `$${trade.commission}` },
              { label: "Fees", value: `$${trade.fees}` },
              { label: "Expiry", value: trade.expiry || "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "var(--bg-card)", borderRadius: "8px",
                padding: "12px", border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{String(value)}</div>
              </div>
            ))}
          </div>

          {/* Times */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              <Clock size={12} style={{ display: "inline", marginRight: "6px" }} />
              ENTRY & EXIT TIME
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="time"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                style={{
                  flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)",
                  fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <input
                type="time"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                style={{
                  flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)",
                  fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
          </div>

          {/* R:R */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              <TrendingUp size={12} style={{ display: "inline", marginRight: "6px" }} />
              R:R RATIO
            </label>
            <input
              type="text"
              value={rr}
              onChange={(e) => setRr(e.target.value)}
              placeholder="e.g. 1:2.5"
              style={{
                width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)",
                fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              <Tag size={12} style={{ display: "inline", marginRight: "6px" }} />
              TAGS
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: "4px 10px", borderRadius: "20px", fontSize: "11px",
                    fontWeight: "600", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    border: tags.includes(tag) ? "1px solid var(--accent-green)" : "1px solid var(--border)",
                    background: tags.includes(tag) ? "var(--accent-green-dim)" : "transparent",
                    color: tags.includes(tag) ? "var(--accent-green)" : "var(--text-muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                placeholder="Add custom tag..."
                style={{
                  flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "8px", padding: "8px 12px", color: "var(--text-primary)",
                  fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button
                onClick={addCustomTag}
                style={{
                  padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)",
                  background: "var(--bg-card)", color: "var(--text-primary)", cursor: "pointer",
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Chart Link */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              <Link size={12} style={{ display: "inline", marginRight: "6px" }} />
              CHART LINK
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://tradingview.com/..."
              style={{
                width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)",
                fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Screenshots */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              <Image size={12} style={{ display: "inline", marginRight: "6px" }} />
              SCREENSHOTS
            </label>
            {images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                {images.map((url) => (
                  <div key={url} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
                    <img src={url} alt="Trade screenshot" style={{ width: "100%", height: "120px", objectFit: "cover", display: "block" }} />
                    <button
                      onClick={() => removeImage(url)}
                      style={{
                        position: "absolute", top: "6px", right: "6px",
                        background: "rgba(0,0,0,0.7)", border: "none",
                        borderRadius: "4px", padding: "4px", cursor: "pointer",
                        color: "white", display: "flex", alignItems: "center",
                      }}
                    >
                      <Trash2 size={12} />
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
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              {uploading ? "Uploading..." : "📎 Attach screenshots"}
            </label>
          </div>

          {/* Journal */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              <FileText size={12} style={{ display: "inline", marginRight: "6px" }} />
              JOURNAL
            </label>
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Why did you take this trade? What was your thesis? How did it play out? What did you learn?"
              rows={6}
              style={{
                width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "8px", padding: "12px", color: "var(--text-primary)",
                fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                resize: "vertical", lineHeight: "1.6",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Save Button */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", padding: "12px", borderRadius: "8px",
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              background: "var(--accent-green)",
              color: "#000", fontSize: "14px", fontWeight: "700",
              fontFamily: "'DM Sans', sans-serif",
              opacity: saving ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            <Save size={16} />
            {saving ? "Saving..." : saved ? "Saved! ✓" : "Save Journal"}
          </button>
        </div>
      </div>
    </>
  );
}