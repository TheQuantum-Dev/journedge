"use client";
import {
  Document, Page, Text, View, StyleSheet, Image,
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
  coverHeader: {
    marginBottom: 40,
    borderBottom: "2px solid #4d9fff",
    paddingBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  coverBrand: {
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  brandWordmark: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#0a0a1a",
    letterSpacing: -1,
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
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
    marginBottom: 12,
    marginTop: 24,
    paddingBottom: 6,
    borderBottom: "1px solid #e0e0f0",
  },
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
  statValueGreen: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#00b85e",
    marginBottom: 2,
  },
  statValueRed: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#cc3355",
    marginBottom: 2,
  },
  statSub: {
    fontSize: 8,
    color: "#aaa",
  },
  dayRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottom: "1px solid #f0f0f8",
    alignItems: "center",
  },
  dayDate: {
    width: 90,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
  },
  dayTrades: {
    flex: 1,
    fontSize: 9,
    color: "#888",
  },
  dayPnl: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    width: 80,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f8",
    padding: "8 6",
    borderRadius: 4,
    marginBottom: 2,
  },
  colHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    padding: "7 6",
    borderBottom: "1px solid #f4f4fc",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "7 6",
    backgroundColor: "#fafaff",
    borderBottom: "1px solid #f4f4fc",
  },
  colDate:   { width: 62, fontSize: 8, color: "#555" },
  colSymbol: { width: 48, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
  colType:   { width: 36, fontSize: 8, color: "#555" },
  colStrike: { width: 42, fontSize: 8, color: "#555" },
  colExpiry: { width: 52, fontSize: 8, color: "#555" },
  colQty:    { width: 28, fontSize: 8, color: "#555" },
  colEntry:  { width: 40, fontSize: 8, color: "#555" },
  colExit:   { width: 40, fontSize: 8, color: "#555" },
  colPnl:    { flex: 1,   fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "right" },
  colStatus: { width: 36, fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "right" },
  journalCard: {
    border: "1px solid #e0e0f0",
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fafaff",
  },
  journalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: "1px solid #e8e8f8",
  },
  journalSymbol: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
  },
  journalMeta: {
    fontSize: 8,
    color: "#888",
    marginBottom: 6,
  },
  journalPnl: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  journalTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 6,
  },
  journalTag: {
    fontSize: 7,
    color: "#4d9fff",
    backgroundColor: "#eef4ff",
    padding: "2 6",
    borderRadius: 3,
  },
  journalText: {
    fontSize: 9,
    color: "#444",
    lineHeight: 1.6,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1px solid #e0e0f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#aaa",
  },
});

function fmt(n: number) {
  return `${n >= 0 ? "+" : ""}$${Math.abs(n).toFixed(2)}`;
}

interface Props {
  trades: Trade[];
  account: Account | null;
  dateRange?: { from: string; to: string };
  logoUrl?: string;
  options?: {
    includeCover?: boolean;
    includeStats?: boolean;
    includeDailyBreakdown?: boolean;
    includeTradeHistory?: boolean;
    includeJournal?: boolean;
  };
}

export default function TradingReportPDF({ trades, account, dateRange, logoUrl, options = {} }: Props) {
  const {
    includeCover = true,
    includeStats = true,
    includeDailyBreakdown = true,
    includeTradeHistory = true,
    includeJournal = false,
  } = options;

  const wins   = trades.filter((t) => t.status === "win");
  const losses = trades.filter((t) => t.status === "loss");
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate  = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0;
  const avgWin   = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss  = losses.length > 0
    ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "—";

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
    ? [...trades].sort((a, b) => a.date.localeCompare(b.date))[0].date : "—");
  const toLabel = dateRange?.to || (trades.length > 0
    ? [...trades].sort((a, b) => b.date.localeCompare(a.date))[0].date : "—");

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {includeCover && (
          <View style={styles.coverHeader}>
            <View style={styles.coverBrand}>
              {logoUrl
                ? <Image src={logoUrl} style={{ width: 210, height: 44 }} />
                : <Text style={styles.brandWordmark}>journedge</Text>
              }
              <Text style={styles.brandSub}>Trading Performance Report</Text>
            </View>
          </View>
        )}

        {includeCover && (
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
        )}

        {includeStats && (
          <>
            <Text style={styles.sectionTitle}>Performance Summary</Text>
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Net P&L</Text>
                <Text style={totalPnl >= 0 ? styles.statValueGreen : styles.statValueRed}>{fmt(totalPnl)}</Text>
                <Text style={styles.statSub}>{trades.length} trades</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Win Rate</Text>
                <Text style={winRate >= 50 ? styles.statValueGreen : styles.statValueRed}>{winRate}%</Text>
                <Text style={styles.statSub}>{wins.length}W / {losses.length}L</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Profit Factor</Text>
                <Text style={Number(profitFactor) >= 1 ? styles.statValueGreen : styles.statValueRed}>{profitFactor}</Text>
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
          </>
        )}

        {includeDailyBreakdown && (
          <>
            <Text style={styles.sectionTitle}>Daily Breakdown</Text>
            {days.map(([date, dayTrades]) => {
              const dayPnl  = dayTrades.reduce((s, t) => s + t.pnl, 0);
              const dayWins = dayTrades.filter((t) => t.status === "win").length;
              return (
                <View key={date} style={styles.dayRow}>
                  <Text style={styles.dayDate}>{date}</Text>
                  <Text style={styles.dayTrades}>
                    {dayTrades.length} trade{dayTrades.length !== 1 ? "s" : ""} · {dayWins}W / {dayTrades.length - dayWins}L
                  </Text>
                  <Text style={[styles.dayPnl, { color: dayPnl >= 0 ? "#00b85e" : "#cc3355" }]}>
                    {fmt(dayPnl)}
                  </Text>
                </View>
              );
            })}
          </>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Journedge — Trading Performance Report</Text>
          <Text style={styles.footerText}>{generatedDate}</Text>
        </View>
      </Page>

      {includeTradeHistory && (
        <Page size="A4" style={{ ...styles.page, paddingTop: 36 }}>
          <Text style={styles.sectionTitle}>Trade History</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.colDate,   styles.colHeaderText]}>Date</Text>
            <Text style={[styles.colSymbol, styles.colHeaderText]}>Symbol</Text>
            <Text style={[styles.colType,   styles.colHeaderText]}>Type</Text>
            <Text style={[styles.colStrike, styles.colHeaderText]}>Strike</Text>
            <Text style={[styles.colExpiry, styles.colHeaderText]}>Expiry</Text>
            <Text style={[styles.colQty,    styles.colHeaderText]}>Qty</Text>
            <Text style={[styles.colEntry,  styles.colHeaderText]}>Entry</Text>
            <Text style={[styles.colExit,   styles.colHeaderText]}>Exit</Text>
            <Text style={[styles.colPnl,    styles.colHeaderText]}>P&L</Text>
            <Text style={[styles.colStatus, styles.colHeaderText]}>Result</Text>
          </View>

          {trades.map((t, i) => (
            <View
              key={t.id}
              style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              wrap={false}
            >
              <Text style={styles.colDate}>{t.date}</Text>
              <Text style={styles.colSymbol}>{t.underlying}</Text>
              <Text style={styles.colType}>
                {t.optionType ? t.optionType.toUpperCase() : t.type.toUpperCase()}
              </Text>
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

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>Journedge — Trading Performance Report</Text>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
              fixed
            />
          </View>
        </Page>
      )}

      {includeJournal && (() => {
        const journalTrades = trades.filter((t) => t.journalEntry && t.journalEntry.trim().length > 0);
        if (journalTrades.length === 0) return null;
        return (
          <Page size="A4" style={{ ...styles.page, paddingTop: 36 }}>
            <Text style={styles.sectionTitle}>Journal Entries</Text>
            <Text style={{ fontSize: 9, color: "#888", marginBottom: 16 }}>
              {journalTrades.length} trade{journalTrades.length !== 1 ? "s" : ""} with journal notes
            </Text>

            {journalTrades.map((t) => {
              const tags = Array.isArray(t.tags) ? t.tags as string[] : [];
              return (
                <View key={t.id} style={styles.journalCard} wrap={false}>
                  <View style={styles.journalCardHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.journalSymbol}>{t.underlying}</Text>
                      <Text style={{ fontSize: 8, color: "#888" }}>
                        {t.optionType ? t.optionType.toUpperCase() : t.type.toUpperCase()}
                        {t.strike ? ` · $${t.strike}` : ""}
                        {t.expiry ? ` · ${t.expiry}` : ""}
                      </Text>
                    </View>
                    <Text style={[styles.journalPnl, { color: t.pnl >= 0 ? "#00b85e" : "#cc3355" }]}>
                      {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={styles.journalMeta}>
                    {t.date}{t.entryTime ? ` · Entry ${t.entryTime}` : ""}{t.exitTime ? ` · Exit ${t.exitTime}` : ""}{t.rr ? ` · R:R ${t.rr}` : ""}
                  </Text>

                  {tags.length > 0 && (
                    <View style={styles.journalTagRow}>
                      {tags.map((tag) => (
                        <Text key={tag} style={styles.journalTag}>{tag}</Text>
                      ))}
                    </View>
                  )}

                  <Text style={styles.journalText}>{t.journalEntry}</Text>
                </View>
              );
            })}

            <View style={styles.footer} fixed>
              <Text style={styles.footerText}>Journedge — Trading Performance Report</Text>
              <Text
                style={styles.footerText}
                render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                fixed
              />
            </View>
          </Page>
        );
      })()}
    </Document>
  );
}