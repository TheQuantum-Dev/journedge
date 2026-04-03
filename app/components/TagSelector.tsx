"use client";
import { useState, useRef, useEffect } from "react";
import { X, Plus, Tag } from "lucide-react";
import { useApp } from "../context/AppContext";

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
  maxHeight?: number;
}

export default function TagSelector({ selected, onChange, maxHeight = 240 }: Props) {
  const { tags, addTag } = useApp();
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(input.toLowerCase()) &&
    !selected.includes(t.name)
  );

  const isNew = input.trim().length > 0 &&
    !tags.find((t) => t.name.toLowerCase() === input.trim().toLowerCase());

  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter((s) => s !== name));
    } else {
      onChange([...selected, name]);
    }
    setInput("");
  };

  const handleCreate = async () => {
    const name = input.trim();
    if (!name || creating) return;
    setCreating(true);
    const tag = await addTag(name);
    if (tag) {
      onChange([...selected, tag.name]);
    }
    setInput("");
    setCreating(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isNew) {
        handleCreate();
      } else if (filtered.length > 0) {
        toggle(filtered[0].name);
      }
    }
    if (e.key === "Escape") setOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ width: "100%" }} ref={dropdownRef}>
      {/* Selected tags */}
      {selected.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px",
        }}>
          {selected.map((tag) => (
            <span
              key={tag}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "3px 10px", borderRadius: "20px", fontSize: "12px",
                fontWeight: "600",
                background: "var(--accent-green-dim)",
                color: "var(--accent-green)",
                border: "1px solid rgba(0,229,122,0.2)",
              }}
            >
              {tag}
              <button
                onClick={() => onChange(selected.filter((s) => s !== tag))}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0", display: "flex", alignItems: "center",
                  color: "var(--accent-green)", opacity: 0.7,
                }}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ position: "relative" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 12px", borderRadius: "8px",
          border: `1px solid ${open ? "var(--accent-green)" : "var(--border)"}`,
          background: "var(--bg-secondary)",
          transition: "border-color 0.15s ease",
        }}>
          <Tag size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? "Add tags..." : "Add another tag..."}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: "13px", color: "var(--text-primary)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          {input && (
            <button
              onClick={() => setInput("")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", padding: "0",
                display: "flex", alignItems: "center",
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (filtered.length > 0 || isNew) && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "8px", zIndex: 100,
            maxHeight, overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}>
            {filtered.map((tag) => (
              <button
                key={tag.id}
                onClick={() => { toggle(tag.name); setOpen(false); }}
                style={{
                  width: "100%", padding: "9px 12px", border: "none",
                  background: "transparent", cursor: "pointer",
                  textAlign: "left", fontSize: "13px",
                  color: "var(--text-primary)",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: "8px",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <Tag size={12} color="var(--text-muted)" />
                {tag.name}
              </button>
            ))}

            {isNew && (
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  width: "100%", padding: "9px 12px", border: "none",
                  borderTop: filtered.length > 0 ? "1px solid var(--border)" : "none",
                  background: "transparent", cursor: creating ? "default" : "pointer",
                  textAlign: "left", fontSize: "13px",
                  color: "var(--accent-green)",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: "8px",
                  opacity: creating ? 0.6 : 1,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <Plus size={12} />
                {creating ? "Creating..." : `Create "${input.trim()}"`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* All tags as pills when input is empty and dropdown is closed */}
      {!open && tags.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px",
        }}>
          {tags
            .filter((t) => !selected.includes(t.name))
            .map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggle(tag.name)}
                style={{
                  padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
                  fontWeight: "600", cursor: "pointer",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-green)";
                  e.currentTarget.style.color = "var(--accent-green)";
                  e.currentTarget.style.background = "var(--accent-green-dim)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {tag.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
