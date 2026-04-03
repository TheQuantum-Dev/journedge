"use client";
import { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Minus, Link, Image,
  Undo, Redo, Highlighter, Palette, ChevronDown,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Pin, X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const FONTS = [
  { label: "DM Sans",          value: "'DM Sans', sans-serif",        google: "DM+Sans:ital,opsz,wght@0,9..40,300..700" },
  { label: "Syne",             value: "'Syne', sans-serif",           google: "Syne:wght@400..800" },
  { label: "Inter",            value: "'Inter', sans-serif",          google: "Inter:wght@300..800" },
  { label: "Roboto",           value: "'Roboto', sans-serif",         google: "Roboto:wght@300;400;500;700" },
  { label: "Open Sans",        value: "'Open Sans', sans-serif",      google: "Open+Sans:wght@300..700" },
  { label: "Lato",             value: "'Lato', sans-serif",           google: "Lato:wght@300;400;700;900" },
  { label: "Poppins",          value: "'Poppins', sans-serif",        google: "Poppins:wght@300;400;500;600;700;800" },
  { label: "Raleway",          value: "'Raleway', sans-serif",        google: "Raleway:wght@300..800" },
  { label: "Nunito",           value: "'Nunito', sans-serif",         google: "Nunito:wght@300..800" },
  { label: "Montserrat",       value: "'Montserrat', sans-serif",     google: "Montserrat:wght@300;400;500;600;700;800" },
  { label: "Playfair Display", value: "'Playfair Display', serif",    google: "Playfair+Display:wght@400;700;900" },
  { label: "Georgia",          value: "Georgia, serif",               google: null },
  { label: "Times New Roman",  value: "'Times New Roman', serif",     google: null },
  { label: "Courier New",      value: "'Courier New', monospace",     google: null },
  { label: "Monospace",        value: "monospace",                    google: null },
];

const FONT_WEIGHTS = [
  { label: "Light",     value: "300" },
  { label: "Regular",   value: "400" },
  { label: "Medium",    value: "500" },
  { label: "SemiBold",  value: "600" },
  { label: "Bold",      value: "700" },
  { label: "ExtraBold", value: "800" },
];

const COLOR_PALETTE = [
  "#00e57a", "#22c55e", "#16a34a", "#15803d", "#166534",
  "#4d9fff", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af",
  "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6",
  "#ff4d6a", "#f43f5e", "#e11d48", "#f472b6", "#ec4899",
  "#fb923c", "#f97316", "#ea580c", "#fbbf24", "#f59e0b",
  "#22d3ee", "#06b6d4", "#0891b2", "#0e7490", "#155e75",
  "#8888aa", "#6b7280", "#4b5563", "#374151", "#1f2937",
  "#f0f0ff", "#e5e7eb", "#d1d5db", "#9ca3af", "#ffffff",
];

const HIGHLIGHT_PALETTE = [
  "rgba(0,229,122,0.25)",   "rgba(0,229,122,0.5)",
  "rgba(77,159,255,0.25)",  "rgba(77,159,255,0.5)",
  "rgba(167,139,250,0.25)", "rgba(167,139,250,0.5)",
  "rgba(251,146,60,0.25)",  "rgba(251,146,60,0.5)",
  "rgba(255,77,106,0.25)",  "rgba(255,77,106,0.5)",
  "rgba(251,191,36,0.25)",  "rgba(251,191,36,0.5)",
  "rgba(34,211,238,0.25)",  "rgba(34,211,238,0.5)",
  "rgba(244,114,182,0.25)", "rgba(244,114,182,0.5)",
  "rgba(255,255,255,0.15)", "rgba(255,255,255,0.3)",
  "rgba(0,0,0,0.2)",        "rgba(0,0,0,0.4)",
];

const PINNED_TEXT_KEY = "journedge_pinned_text_colors";
const PINNED_HL_KEY   = "journedge_pinned_highlight_colors";

function loadPinned(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

function savePinned(key: string, colors: string[]) {
  localStorage.setItem(key, JSON.stringify(colors));
}

const loadedFonts = new Set<string>();
function loadGoogleFont(font: typeof FONTS[0]) {
  if (!font.google || loadedFonts.has(font.google)) return;
  loadedFonts.add(font.google);
  const link = document.createElement("link");
  link.rel  = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
  document.head.appendChild(link);
}

function Btn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 30, height: 30, borderRadius: 6, border: "none",
        background: active ? "var(--accent-green-dim)" : "transparent",
        color: active ? "var(--accent-green)" : "var(--text-secondary)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.15s, color 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.background = "var(--bg-hover)";
          e.currentTarget.style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-secondary)";
        }
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div style={{
      width: 1, height: 20, background: "var(--border)",
      margin: "0 4px", flexShrink: 0,
    }} />
  );
}

function ColorPickerDropdown({
  icon, title, palette, pinnedKey, onSelect, onClear,
}: {
  icon: React.ReactNode;
  title: string;
  palette: string[];
  pinnedKey: string;
  onSelect: (color: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen]           = useState(false);
  const [pinned, setPinned]       = useState<string[]>([]);
  const [hex, setHex]             = useState("");
  const [hexPreview, setHexPreview] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPinned(loadPinned(pinnedKey)); }, [pinnedKey]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isValidHex = (h: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(h);

  const handleHexChange = (v: string) => {
    setHex(v);
    setHexPreview(isValidHex(v) ? v : "");
  };

  const applyHex = () => {
    if (!isValidHex(hex)) return;
    onSelect(hex);
    setHex("");
    setHexPreview("");
    setOpen(false);
  };

  const togglePin = (color: string) => {
    const next = pinned.includes(color)
      ? pinned.filter((c) => c !== color)
      : [color, ...pinned].slice(0, 10);
    setPinned(next);
    savePinned(pinnedKey, next);
  };

  const apply = (color: string) => {
    onSelect(color);
    setOpen(false);
  };

  return (
    <div ref={dropRef} style={{ position: "relative" }}>
      <button
        title={title}
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 30, height: 30, borderRadius: 6, border: "none",
          background: open ? "var(--bg-hover)" : "transparent",
          color: "var(--text-secondary)", cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        {icon}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 10, zIndex: 200, padding: 12,
          boxShadow: "0 12px 32px rgba(0,0,0,0.4)", width: 240,
        }}>
          <button
            onClick={() => { onClear(); setOpen(false); }}
            style={{
              width: "100%", padding: "6px 10px", borderRadius: 6,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", fontSize: 11, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <X size={11} /> Remove color
          </button>

          {pinned.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 6 }}>
                PINNED
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                {pinned.map((c) => (
                  <div key={c} style={{ position: "relative" }}>
                    <button
                      title={c}
                      onClick={() => apply(c)}
                      style={{
                        width: 22, height: 22, borderRadius: 5,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: c, cursor: "pointer",
                      }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(c); }}
                      title="Unpin"
                      style={{
                        position: "absolute", top: -4, right: -4,
                        width: 12, height: 12, borderRadius: "50%",
                        background: "var(--bg-secondary)", border: "1px solid var(--border)",
                        cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", padding: 0,
                      }}
                    >
                      <X size={7} color="var(--text-muted)" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 6 }}>
            PALETTE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 3, marginBottom: 10 }}>
            {palette.map((c) => (
              <div key={c} style={{ position: "relative" }} className="swatch-wrap">
                <button
                  title={c}
                  onClick={() => apply(c)}
                  style={{
                    width: "100%", aspectRatio: "1", borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: c, cursor: "pointer",
                    transition: "transform 0.1s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); togglePin(c); }}
                  title={pinned.includes(c) ? "Unpin" : "Pin"}
                  className="swatch-pin"
                  style={{
                    position: "absolute", top: -3, right: -3,
                    width: 11, height: 11, borderRadius: "50%",
                    background: pinned.includes(c) ? "var(--accent-green)" : "var(--bg-secondary)",
                    border: "1px solid var(--border)", cursor: "pointer",
                    alignItems: "center", justifyContent: "center", padding: 0,
                    display: "none",
                  }}
                >
                  <Pin size={6} color={pinned.includes(c) ? "#000" : "var(--text-muted)"} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 6 }}>
            CUSTOM HEX
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              background: hexPreview || "var(--bg-secondary)",
              border: "1px solid var(--border)",
            }} />
            <input
              value={hex}
              onChange={(e) => handleHexChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyHex(); }}
              placeholder="#00e57a"
              style={{
                flex: 1, padding: "6px 10px", borderRadius: 6,
                border: `1px solid ${isValidHex(hex) ? "var(--accent-green)" : "var(--border)"}`,
                background: "var(--bg-secondary)", color: "var(--text-primary)",
                fontSize: 12, fontFamily: "monospace", outline: "none",
              }}
            />
            {hexPreview && (
              <button
                onClick={() => togglePin(hex)}
                title="Pin this color"
                style={{
                  padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)",
                  background: pinned.includes(hex) ? "var(--accent-green-dim)" : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  color: pinned.includes(hex) ? "var(--accent-green)" : "var(--text-muted)",
                }}
              >
                <Pin size={11} />
              </button>
            )}
            <button
              onClick={applyHex}
              disabled={!isValidHex(hex)}
              style={{
                padding: "6px 10px", borderRadius: 6, border: "none",
                background: isValidHex(hex) ? "var(--accent-green)" : "var(--border)",
                color: isValidHex(hex) ? "#000" : "var(--text-muted)",
                fontSize: 11, fontWeight: 700,
                cursor: isValidHex(hex) ? "pointer" : "not-allowed",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      <style>{`
        .swatch-wrap:hover .swatch-pin { display: flex !important; }
      `}</style>
    </div>
  );
}

function FontPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dmSans = FONTS.find((f) => f.label === "DM Sans");
    if (dmSans) loadGoogleFont(dmSans);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = FONTS.find((f) =>
    editor.isActive("textStyle", { fontFamily: f.value })
  ) ?? FONTS[0];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        title="Font Family"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "0 8px", height: 30, borderRadius: 6,
          border: "1px solid var(--border)", background: "transparent",
          color: "var(--text-secondary)", cursor: "pointer",
          fontSize: 12, fontFamily: current.value,
          whiteSpace: "nowrap", flexShrink: 0,
          maxWidth: 140, overflow: "hidden",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current.label}
        </span>
        <ChevronDown size={11} style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 8, zIndex: 200, overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          width: 200, maxHeight: 340, overflowY: "auto",
        }}>
          {FONTS.map((font) => {
            const isActive = current.value === font.value;
            return (
              <button
                key={font.value}
                onClick={() => {
                  loadGoogleFont(font);
                  editor.chain().focus().setFontFamily(font.value).run();
                  setOpen(false);
                }}
                style={{
                  width: "100%", padding: "9px 14px", border: "none",
                  background: isActive ? "var(--accent-green-dim)" : "transparent",
                  color: isActive ? "var(--accent-green)" : "var(--text-primary)",
                  cursor: "pointer", textAlign: "left",
                  fontSize: 13, fontFamily: font.value,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {font.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FontWeightPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = FONT_WEIGHTS.find((w) =>
    editor.isActive("textStyle", { fontWeight: w.value })
  ) ?? FONT_WEIGHTS[1];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        title="Font Weight"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "0 8px", height: 30, borderRadius: 6,
          border: "1px solid var(--border)", background: "transparent",
          color: "var(--text-secondary)", cursor: "pointer",
          fontSize: 12, fontFamily: "'DM Sans', sans-serif",
          whiteSpace: "nowrap", flexShrink: 0,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        {current.label}
        <ChevronDown size={11} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 8, zIndex: 200, overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", minWidth: 130,
        }}>
          {FONT_WEIGHTS.map((w) => {
            const isActive = current.value === w.value;
            return (
              <button
                key={w.value}
                onClick={() => {
                  editor.chain().focus().setMark("textStyle", { fontWeight: w.value }).run();
                  setOpen(false);
                }}
                style={{
                  width: "100%", padding: "8px 14px", border: "none",
                  background: isActive ? "var(--accent-green-dim)" : "transparent",
                  color: isActive ? "var(--accent-green)" : "var(--text-primary)",
                  cursor: "pointer", textAlign: "left",
                  fontSize: 13, fontWeight: w.value,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface Props {
  editor: Editor | null;
  onImageUpload: () => void;
}

export default function JournalToolbar({ editor, onImageUpload }: Props) {
  if (!editor) return null;

  const chain = editor.chain().focus() as any;

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url  = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
      padding: "8px 12px", borderBottom: "1px solid var(--border)",
      background: "var(--bg-secondary)",
    }}>
      <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo size={14} />
      </Btn>

      <Divider />

      <FontPicker editor={editor} />
      <FontWeightPicker editor={editor} />

      <Divider />

      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
        <Heading1 size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
        <Heading2 size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
        <Heading3 size={14} />
      </Btn>

      <Divider />

      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
        <Underline size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough size={14} />
      </Btn>

      <Divider />

      <ColorPickerDropdown
        icon={<Palette size={14} />}
        title="Text Color"
        palette={COLOR_PALETTE}
        pinnedKey={PINNED_TEXT_KEY}
        onSelect={(color) => editor.chain().focus().setColor(color).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
      />
      <ColorPickerDropdown
        icon={<Highlighter size={14} />}
        title="Highlight"
        palette={HIGHLIGHT_PALETTE}
        pinnedKey={PINNED_HL_KEY}
        onSelect={(color) => editor.chain().focus().setHighlight({ color }).run()}
        onClear={() => editor.chain().focus().unsetHighlight().run()}
      />

      <Divider />

      <Btn onClick={() => chain.setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
        <AlignLeft size={14} />
      </Btn>
      <Btn onClick={() => chain.setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
        <AlignCenter size={14} />
      </Btn>
      <Btn onClick={() => chain.setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
        <AlignRight size={14} />
      </Btn>
      <Btn onClick={() => chain.setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
        <AlignJustify size={14} />
      </Btn>

      <Divider />

      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
        <List size={14} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
        <ListOrdered size={14} />
      </Btn>

      <Divider />

      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider Line">
        <Minus size={14} />
      </Btn>
      <Btn onClick={setLink} active={editor.isActive("link")} title="Link">
        <Link size={14} />
      </Btn>
      <Btn onClick={onImageUpload} title="Insert Image">
        <Image size={14} />
      </Btn>
    </div>
  );
}
