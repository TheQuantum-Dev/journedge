"use client";
import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import TradingReportPDF from "./TradingReportPDF";
import { FileDown } from "lucide-react";
import { Trade, Account } from "../lib/types";
import { svgToPngDataUrl } from "../lib/svgToPng";

interface Props {
  trades: Trade[];
  account: Account | null;
  options: {
    includeCover?: boolean;
    includeStats?: boolean;
    includeDailyBreakdown?: boolean;
    includeTradeHistory?: boolean;
  };
  filename: string;
}

export default function ExportPDFInner({ trades, account, options, filename }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    svgToPngDataUrl("/journedge-logo-light.svg", 210, 44)

      .then(setLogoUrl)
      .catch(() => setLogoUrl(undefined));
  }, []);

  if (trades.length === 0) {
    return (
      <button disabled style={{
        width: "100%", padding: "12px", borderRadius: "10px",
        border: "none", background: "var(--border)",
        color: "var(--text-muted)", fontSize: "14px", fontWeight: "600",
        cursor: "not-allowed", display: "flex", alignItems: "center",
        justifyContent: "center", gap: "8px",
      }}>
        <FileDown size={16} />
        No trades to export
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <TradingReportPDF
          trades={trades}
          account={account}
          options={options}
          logoUrl={logoUrl}
        />
      }
      fileName={filename}
      style={{ textDecoration: "none" }}
    >
      {({ loading }) => (
        <button style={{
          width: "100%", padding: "12px", borderRadius: "10px",
          border: "none",
          background: loading ? "var(--border)" : "var(--accent-green)",
          color: loading ? "var(--text-muted)" : "#0a0a1a",
          fontSize: "14px", fontWeight: "700",
          cursor: loading ? "default" : "pointer",
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: "8px",
          transition: "all 0.2s ease",
        }}>
          <FileDown size={16} />
          {loading ? "Preparing PDF..." : `Export ${trades.length} Trades`}
        </button>
      )}
    </PDFDownloadLink>
  );
}