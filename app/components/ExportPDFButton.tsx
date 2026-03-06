"use client";
import dynamic from "next/dynamic";
import { useApp } from "../context/AppContext";

// Wrap the entire PDF button logic in a single dynamic import
// so react-pdf only ever loads on the client, fully resolved
const PDFExportInner = dynamic(() => import("./PDFExportInner"), {
  ssr: false,
  loading: () => (
    <button
      disabled
      style={{
        padding: "8px 16px", borderRadius: "8px",
        border: "1px solid var(--border)", background: "transparent",
        color: "#8888aa", fontSize: "12px", fontWeight: "600",
        fontFamily: "'DM Sans', sans-serif", opacity: 0.5, cursor: "default",
      }}
    >
      Loading...
    </button>
  ),
});

export default function ExportPDFButton() {
  const { trades, activeAccount } = useApp();

  return <PDFExportInner trades={trades} account={activeAccount} />;
}
