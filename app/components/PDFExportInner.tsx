"use client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import TradingReportPDF from "./TradingReportPDF";
import { Trade, Account } from "../lib/types";

interface Props {
  trades: Trade[];
  account: Account | null;
}

export default function PDFExportInner({ trades, account }: Props) {
  const filename = `Journedge-report-${
    account?.name?.toLowerCase().replace(/\s+/g, "-") || "account"
  }-${new Date().toISOString().split("T")[0]}.pdf`;

  if (trades.length === 0) {
    return (
      <button
        disabled
        style={{
          padding: "8px 16px", borderRadius: "8px",
          border: "1px solid var(--border)", background: "transparent",
          color: "#8888aa", fontSize: "12px", fontWeight: "600",
          fontFamily: "'DM Sans', sans-serif", opacity: 0.5, cursor: "not-allowed",
        }}
      >
        Export PDF
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<TradingReportPDF trades={trades} account={account} />}
      fileName={filename}
      style={{ textDecoration: "none" }}
    >
      {({ loading }) => (
        <button
          style={{
            padding: "8px 16px", borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: loading ? "#8888aa" : "#f0f0ff",
            fontSize: "12px", fontWeight: "600",
            cursor: loading ? "default" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {loading ? "Preparing..." : "Export PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
