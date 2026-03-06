"use client";
import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";
import { Trade, Account } from "../lib/types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a2e",
    backgroundColor: "#ffffff",
    padding: 48,
  },

  // Cover
  coverHeader: {
    marginBottom: 48,
    borderBottom: "2px solid #00e57a",
    paddingBottom: 24,
  },
  brand: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#00e57a",
    letterSpacing: 1,
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 11,
    color: "#666688",
  },
  coverMeta: {
    marginTop: 32,
  },
  coverMetaRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  coverMetaLabel: {
    fontSize: 10,
    color: "#888",
    width: 120,
  },
  coverMetaValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
  },

  // Section headings
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
    marginBottom: 12,
    marginTop: 24,
    paddingBottom: 6,
    borderBottom: "1px solid #e0e0f0",
  },

  // Stat cards row
  statRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    border: "1px solid #e0e0f0",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#f8f8fd",
  },
  statLabel: {
    fontSize: 8,
    color: "#888",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
  },
  statValueGreen: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#00b85e",
  },
  statValueRed: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#cc3355",
  },
  statSub: {
    fontSize: 8,
    color: "#aaa",
    marginTop: 2,
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f8",
    borderRadius: 4,
    padding: "6 8",
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "7 8",
    borderBottom: "1px solid #f0f0f0",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "7 8",
    borderBottom: "1px solid #f0f0f0",
    backgroundColor: "#fafafa",
  },
  colDate: { width: "13%", fontSize: 9, color: "#555" },
  colSymbol: { width: "14%", fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
  colType: { width: "10%", fontSize: 9, color: "#555" },
  colStrike: { width: "10%", fontSize: 9, color: "#555" },
  colExpiry: { width: "13%", fontSize: 9, color: "#555" },
  colQty: { width: "8%", fontSize: 9, color: "#555", textAlign: "right" },
  colEntry: { width: "10%", fontSize: 9, color: "#555", textAlign: "right" },
  colExit: { width: "10%", fontSize: 9, color: "#555", textAlign: "right" },
  colPnl: { width: "12%", fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "right" },
  colStatus: { width: "10%", fontSize: 8, textAlign: "center" },

  colHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Daily breakdown
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "8 10",
    borderBottom: "1px solid #f0f0f0",
  },
  dayDate: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
  dayTrades: { fontSize: 9, color: "#888" },
  dayPnl: { fontSize: 9, fontFamily: "Helvetica-Bold" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1px solid #e0e0f0",
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: "#aaa" },
});

interface Props {
  trades: Trade[];
  account: Account | null;
  dateRange?: { from: string; to: string };
}

function fmt(n: number) {
  return `${n >= 0 ? "+" : ""}$${Math.abs(n).toFixed(2)}`;
}

export default function TradingReportPDF({ trades, account, dateRange }: Props) {
  const wins = trades.filter((t) => t.status === "win");
  const losses = trades.filter((t) => t.status === "loss");
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "—";

  // Group by day
  const byDay: Record<string, Trade[]> = {};
  for (const t of trades) {
    if (!byDay[t.date]) byDay[t.date] = [];
    byDay[t.date].push(t);
  }
  const days = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));

  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const fromLabel = dateRange?.from || (trades.length > 0
    ? [...trades].sort((a, b) => a.date.localeCompare(b.date))[0].date
    : "—");
  const toLabel = dateRange?.to || (trades.length > 0
    ? [...trades].sort((a, b) => b.date.localeCompare(a.date))[0].date
    : "—");

  return (
    <Document>
      {/* Page 1: Summary */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.coverHeader}>
          <Text style={styles.brand}>Tradello</Text>
          <Text style={styles.brandSub}>Trading Performance Report</Text>
        </View>

        {/* Meta */}
        <View style={styles.coverMeta}>
          {account && (
            <>
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>Account</Text>
                <Text style={styles.coverMetaValue}>{account.name}</Text>
              </View>
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>Broker</Text>
                <Text style={styles.coverMetaValue}>{account.broker}</Text>
              </View>
            </>
          )}
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Period</Text>
            <Text style={styles.coverMetaValue}>{fromLabel} — {toLabel}</Text>
          </View>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Generated</Text>
            <Text style={styles.coverMetaValue}>{generatedDate}</Text>
          </View>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Total Trades</Text>
            <Text style={styles.coverMetaValue}>{trades.length}</Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Performance Summary</Text>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Net P&L</Text>
            <Text style={totalPnl >= 0 ? styles.statValueGreen : styles.statValueRed}>
              {fmt(totalPnl)}
            </Text>
            <Text style={styles.statSub}>{trades.length} trades</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={winRate >= 50 ? styles.statValueGreen : styles.statValueRed}>
              {winRate}%
            </Text>
            <Text style={styles.statSub}>{wins.length}W / {losses.length}L</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Profit Factor</Text>
            <Text style={Number(profitFactor) >= 1 ? styles.statValueGreen : styles.statValueRed}>
              {profitFactor}
            </Text>
            <Text style={styles.statSub}>Avg win / avg loss</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Win</Text>
            <Text style={styles.statValueGreen}>${avgWin.toFixed(2)}</Text>
            <Text style={styles.statSub}>Per winning trade</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Loss</Text>
            <Text style={styles.statValueRed}>${avgLoss.toFixed(2)}</Text>
            <Text style={styles.statSub}>Per losing trade</Text>
          </View>
        </View>

        {/* Daily Breakdown */}
        <Text style={styles.sectionTitle}>Daily Breakdown</Text>
        {days.map(([date, dayTrades]) => {
          const dayPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
          const dayWins = dayTrades.filter((t) => t.status === "win").length;
          return (
            <View key={date} style={styles.dayRow}>
              <Text style={styles.dayDate}>{date}</Text>
              <Text style={styles.dayTrades}>{dayTrades.length} trade{dayTrades.length !== 1 ? "s" : ""} · {dayWins}W / {dayTrades.length - dayWins}L</Text>
              <Text style={[styles.dayPnl, { color: dayPnl >= 0 ? "#00b85e" : "#cc3355" }]}>
                {fmt(dayPnl)}
              </Text>
            </View>
          );
        })}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Tradello — Trading Performance Report</Text>
          <Text style={styles.footerText}>{generatedDate}</Text>
        </View>
      </Page>

      {/* Page 2+: Trade History */}
      <Page size="A4" style={{ ...styles.page, paddingTop: 36 }}>
        <Text style={styles.sectionTitle}>Trade History</Text>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colDate, styles.colHeaderText]}>Date</Text>
          <Text style={[styles.colSymbol, styles.colHeaderText]}>Symbol</Text>
          <Text style={[styles.colType, styles.colHeaderText]}>Type</Text>
          <Text style={[styles.colStrike, styles.colHeaderText]}>Strike</Text>
          <Text style={[styles.colExpiry, styles.colHeaderText]}>Expiry</Text>
          <Text style={[styles.colQty, styles.colHeaderText]}>Qty</Text>
          <Text style={[styles.colEntry, styles.colHeaderText]}>Entry</Text>
          <Text style={[styles.colExit, styles.colHeaderText]}>Exit</Text>
          <Text style={[styles.colPnl, styles.colHeaderText]}>P&L</Text>
          <Text style={[styles.colStatus, styles.colHeaderText]}>Result</Text>
        </View>

        {/* Rows */}
        {trades.map((t, i) => (
          <View key={t.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
            <Text style={styles.colDate}>{t.date}</Text>
            <Text style={styles.colSymbol}>{t.underlying}</Text>
            <Text style={styles.colType}>{t.optionType ? t.optionType.toUpperCase() : t.type.toUpperCase()}</Text>
            <Text style={styles.colStrike}>{t.strike ? `$${t.strike}` : "—"}</Text>
            <Text style={styles.colExpiry}>{t.expiry || "—"}</Text>
            <Text style={styles.colQty}>{t.quantity}</Text>
            <Text style={styles.colEntry}>${t.entryPrice}</Text>
            <Text style={styles.colExit}>${t.exitPrice}</Text>
            <Text style={[styles.colPnl, { color: t.pnl >= 0 ? "#00b85e" : "#cc3355" }]}>
              {fmt(t.pnl)}
            </Text>
            <Text style={[styles.colStatus, { color: t.status === "win" ? "#00b85e" : "#cc3355" }]}>
              {t.status.toUpperCase()}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Tradello — Trading Performance Report</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } fixed />
        </View>
      </Page>
    </Document>
  );
}
