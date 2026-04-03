"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TipTapLink from "@tiptap/extension-link";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Placeholder from "@tiptap/extension-placeholder";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import { useApp } from "../context/AppContext";
import { Trade, JournalTemplate } from "../lib/types";
import JournalToolbar from "../components/JournalToolbar";
import TagSelector from "../components/TagSelector";
import {
  ArrowLeft, FileText, Check, Loader, LayoutTemplate, X, Trash2,
} from "lucide-react";

const ExtendedTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontWeight: {
        default: null,
        parseHTML: (el) => el.style.fontWeight || null,
        renderHTML: (attrs) => {
          if (!attrs.fontWeight) return {};
          return { style: `font-weight: ${attrs.fontWeight}` };
        },
      },
    };
  },
});

function parseContent(raw: string | null | undefined): object | string {
  if (!raw || raw.trim() === "") return "";
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.type === "doc") return parsed;
    return raw;
  } catch {
    return raw;
  }
}

function buildTipTapDoc(plainText: string) {
  return {
    type: "doc",
    content: plainText.split("\n\n").filter(Boolean).map((para) => ({
      type: "paragraph",
      content: para.trim() ? [{ type: "text", text: para }] : [],
    })),
  };
}

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 2,
      padding: "10px 14px", borderRadius: 8,
      background: "var(--bg-secondary)", border: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.4px" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: color || "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

function TemplatePicker({
  templates, onApply, onClose, onDelete,
}: {
  templates: JournalTemplate[];
  onApply: (t: JournalTemplate) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "min(520px, 95vw)", maxHeight: "70vh",
        background: "var(--bg-card)", borderRadius: 16,
        border: "1px solid var(--border)", zIndex: 201,
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Templates</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Apply a template to the current entry
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {templates.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No templates yet. Save one from the editor to get started.
            </div>
          ) : (
            templates.map((t) => (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", borderRadius: 10,
                border: "1px solid var(--border)", marginBottom: 8,
                background: "var(--bg-secondary)",
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {t.scope === "all" ? "All trade types" : t.scope.split(",").join(", ")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onDelete(t.id)}
                    style={{
                      padding: 6, borderRadius: 6, border: "none",
                      background: "rgba(255,77,106,0.1)", cursor: "pointer", color: "#ff4d6a",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                  <button
                    onClick={() => onApply(t)}
                    style={{
                      padding: "6px 14px", borderRadius: 6, border: "none",
                      background: "var(--accent-green)", cursor: "pointer",
                      color: "#000", fontSize: 12, fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function SaveTemplateModal({ onSave, onClose }: {
  onSave: (name: string, scope: string) => void;
  onClose: () => void;
}) {
  const [name, setName]   = useState("");
  const [scope, setScope] = useState<string[]>(["all"]);

  const SCOPE_OPTIONS = [
    { value: "all",    label: "All types" },
    { value: "option", label: "Options" },
    { value: "stock",  label: "Stocks" },
    { value: "future", label: "Futures" },
  ];

  const toggleScope = (value: string) => {
    if (value === "all") { setScope(["all"]); return; }
    const withoutAll = scope.filter((s) => s !== "all");
    if (withoutAll.includes(value)) {
      const next = withoutAll.filter((s) => s !== value);
      setScope(next.length === 0 ? ["all"] : next);
    } else {
      setScope([...withoutAll, value]);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "min(440px, 95vw)",
        background: "var(--bg-card)", borderRadius: 16,
        border: "1px solid var(--border)", zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)", padding: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Save as Template</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            Template Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Options Trade Review"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSave(name.trim(), scope.join(",")); }}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg-secondary)",
              color: "var(--text-primary)", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              boxSizing: "border-box" as const, outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
            Auto-Apply For
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SCOPE_OPTIONS.map((opt) => {
              const active = scope.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleScope(opt.value)}
                  style={{
                    padding: "6px 14px", borderRadius: 20,
                    border: `1px solid ${active ? "var(--accent-green)" : "var(--border)"}`,
                    background: active ? "var(--accent-green-dim)" : "transparent",
                    color: active ? "var(--accent-green)" : "var(--text-muted)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
            Auto-applied when opening a new journal for the selected trade types.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => { if (name.trim()) onSave(name.trim(), scope.join(",")); }}
            disabled={!name.trim()}
            style={{
              flex: 1, padding: 11, borderRadius: 8, border: "none",
              background: name.trim() ? "var(--accent-green)" : "var(--border)",
              color: name.trim() ? "#000" : "var(--text-muted)",
              fontSize: 13, fontWeight: 700,
              cursor: name.trim() ? "pointer" : "not-allowed",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Save Template
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "11px 18px", borderRadius: 8,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-primary)", fontSize: 13,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

type SaveState = "idle" | "saving" | "saved";

export default function JournalEditorPage() {
  const { trades, activeTradeId, setActivePage, updateTradeInMemory } = useApp();
  const trade: Trade | null = trades.find((t) => t.id === activeTradeId) ?? null;

  const [currentTags, setCurrentTags]           = useState<string[]>([]);
  const [saveState, setSaveState]               = useState<SaveState>("idle");
  const [showTemplates, setShowTemplates]       = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templates, setTemplates]               = useState<JournalTemplate[]>([]);

  const saveTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isMounted     = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      ExtendedTextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({ inline: false }),
      TipTapLink.configure({ openOnClick: false }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing your journal entry..." }),
    ],
    content: "",
    editorProps: {
      attributes: {
        style: [
          "outline: none",
          "min-height: 400px",
          "padding: 28px 32px",
          "font-family: 'DM Sans', sans-serif",
          "font-size: 15px",
          "line-height: 1.85",
          "color: var(--text-primary)",
          "flex: 1",
        ].join("; "),
      },
    },
    onUpdate: ({ editor }) => {
      if (!isMounted.current) return;
      triggerAutosave(editor.getJSON());
    },
  });

  useEffect(() => {
    if (!trade || !editor || editor.isDestroyed) return;
    const parsed = parseContent(trade.journalEntry);
    editor.commands.setContent(
      typeof parsed === "object"
        ? parsed
        : parsed ? buildTipTapDoc(parsed as string) : ""
    );
    setCurrentTags(Array.isArray(trade.tags) ? trade.tags as string[] : []);
    checkAutoApplyTemplate(trade);
  }, [activeTradeId, editor]);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTemplates(data); })
      .catch(() => {});
  }, []);

  const checkAutoApplyTemplate = async (t: Trade) => {
    const content = parseContent(t.journalEntry);
    const isEmpty = !content || (typeof content === "string" && content.trim() === "");
    if (!isEmpty) return;
    try {
      const res = await fetch("/api/templates");
      const all: JournalTemplate[] = await res.json();
      const matches = all.filter((tmpl) => {
        const scopes = tmpl.scope.split(",");
        return scopes.includes("all") || scopes.includes(t.type);
      });
      if (matches.length === 1 && editor && !editor.isDestroyed)
        editor.commands.setContent(JSON.parse(matches[0].content));
    } catch {}
  };

  const triggerAutosave = useCallback((content: object) => {
    if (!trade) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      if (!isMounted.current) return;
      try {
        const journalEntry = JSON.stringify(content);
        await fetch("/api/trades", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: trade.id, journalEntry }),
        });
        updateTradeInMemory(trade.id, { journalEntry });
        if (isMounted.current) {
          setSaveState("saved");
          setTimeout(() => { if (isMounted.current) setSaveState("idle"); }, 2000);
        }
      } catch {
        if (isMounted.current) setSaveState("idle");
      }
    }, 1500);
  }, [trade, updateTradeInMemory]);

  const saveTags = async (newTags: string[]) => {
    if (!trade) return;
    setCurrentTags(newTags);
    await fetch("/api/trades", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: trade.id, tags: JSON.stringify(newTags) }),
    });
    updateTradeInMemory(trade.id, { tags: newTags });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleSaveTemplate = async (name: string, scope: string) => {
    if (!editor) return;
    const content = JSON.stringify(editor.getJSON());
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content, scope }),
    });
    if (res.ok) {
      const tmpl = await res.json();
      setTemplates((prev) => [tmpl, ...prev]);
    }
    setShowSaveTemplate(false);
  };

  const handleApplyTemplate = (tmpl: JournalTemplate) => {
    if (!editor) return;
    try { editor.commands.setContent(JSON.parse(tmpl.content)); } catch {}
    setShowTemplates(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    await fetch("/api/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  if (!trade) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "60vh", flexDirection: "column", gap: 16,
      }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No trade selected.</div>
        <button
          onClick={() => setActivePage("journal")}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "none",
            background: "var(--accent-green)", color: "#000",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Back to Journal
        </button>
      </div>
    );
  }

  const isWin = trade.pnl >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexShrink: 0 }}>
        <button
          onClick={() => setActivePage("journal")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", padding: "6px 0",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
        >
          <ArrowLeft size={15} />
          Back to Journal
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12, minWidth: 70,
            color: saveState === "saved" ? "var(--accent-green)" : "var(--text-muted)",
            transition: "color 0.3s",
          }}>
            {saveState === "saving" && <Loader size={12} style={{ animation: "spin 1s linear infinite" }} />}
            {saveState === "saved"  && <Check  size={12} />}
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : ""}
          </div>

          <button
            onClick={() => setShowSaveTemplate(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-green)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <FileText size={13} />
            Save as Template
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-green)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <LayoutTemplate size={13} />
            Templates
          </button>
        </div>
      </div>

      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "20px 24px", marginBottom: 16, flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
              {trade.underlying}
            </h2>
            {trade.optionType && (
              <span style={{
                padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: trade.optionType === "call" ? "rgba(77,159,255,0.12)" : "rgba(255,77,106,0.12)",
                color: trade.optionType === "call" ? "#4d9fff" : "#ff4d6a",
              }}>
                {trade.optionType.toUpperCase()}
              </span>
            )}
            <span style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: isWin ? "var(--accent-green-dim)" : "rgba(255,77,106,0.12)",
              color: isWin ? "var(--accent-green)" : "#ff4d6a",
            }}>
              {trade.status.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: isWin ? "var(--accent-green)" : "#ff4d6a" }}>
            {isWin ? "+" : ""}${trade.pnl.toFixed(2)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <StatPill label="DATE"  value={trade.date} />
          <StatPill label="ENTRY" value={`$${trade.entryPrice}`} />
          <StatPill label="EXIT"  value={`$${trade.exitPrice}`} />
          <StatPill label="QTY"   value={String(trade.quantity)} />
          {trade.strike    && <StatPill label="STRIKE"     value={`$${trade.strike}`} />}
          {trade.expiry    && <StatPill label="EXPIRY"     value={trade.expiry} />}
          {trade.rr        && <StatPill label="R:R"        value={trade.rr} />}
          {trade.entryTime && <StatPill label="ENTRY TIME" value={trade.entryTime} color="var(--text-secondary)" />}
          {trade.exitTime  && <StatPill label="EXIT TIME"  value={trade.exitTime}  color="var(--text-secondary)" />}
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 8 }}>
            TAGS
          </div>
          <TagSelector selected={currentTags} onChange={saveTags} maxHeight={180} />
        </div>
      </div>
              
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden",
        flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      }}>
        <JournalToolbar editor={editor} onImageUpload={() => imageInputRef.current?.click()} />
        <input
          ref={imageInputRef} type="file" accept="image/*"
          style={{ display: "none" }} onChange={handleImageUpload}
        />
        <div style={{ flex: 1, overflowY: "auto" }}>
          <EditorContent editor={editor} style={{ height: "100%" }} />
        </div>
      </div>

      {showTemplates && (
        <TemplatePicker
          templates={templates}
          onApply={handleApplyTemplate}
          onClose={() => setShowTemplates(false)}
          onDelete={handleDeleteTemplate}
        />
      )}
      {showSaveTemplate && (
        <SaveTemplateModal
          onSave={handleSaveTemplate}
          onClose={() => setShowSaveTemplate(false)}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder); float: left;
          color: var(--text-muted); pointer-events: none; height: 0;
        }
        .ProseMirror h1 { font-size: 26px; font-weight: 800; color: var(--text-primary); margin: 22px 0 10px; font-family: 'Syne', sans-serif; letter-spacing: -0.5px; }
        .ProseMirror h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 18px 0 8px;  font-family: 'Syne', sans-serif; }
        .ProseMirror h3 { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 14px 0 6px;  font-family: 'Syne', sans-serif; }
        .ProseMirror p  { margin: 0 0 10px; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 22px; margin: 8px 0; }
        .ProseMirror li { margin: 4px 0; }
        .ProseMirror hr { border: none; border-top: 1px solid var(--border); margin: 22px 0; }
        .ProseMirror img { max-width: 100%; border-radius: 10px; border: 1px solid var(--border); margin: 10px 0; }
        .ProseMirror a { color: var(--accent-green); text-decoration: underline; text-underline-offset: 3px; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em    { font-style: italic; }
        .ProseMirror u     { text-decoration: underline; }
        .ProseMirror s     { text-decoration: line-through; }
        .ProseMirror mark  { padding: 1px 3px; border-radius: 3px; }
        .ProseMirror blockquote { border-left: 3px solid var(--accent-green); padding-left: 14px; margin: 12px 0; color: var(--text-secondary); }
        .ProseMirror:focus { outline: none; }
      `}</style>
    </div>
  );
}
