import { Trade } from "./types";

const JOURNEDGE_HEADER = "Date,Symbol,Underlying,Type,Direction,Option Type,Strike,Expiry,Quantity,Entry Price,Exit Price,Commission,Fees,P&L,Status,Entry Time,Exit Time,R:R,Tags,Journal,Account ID";

export function isJournedgeCSV(csvText: string): boolean {
  const firstLine = csvText.split("\n")[0].replace(/"/g, "").trim();
  return firstLine === JOURNEDGE_HEADER;
}

function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === "," && !inQuotes) {
      cols.push(current.trim());
      current = "";
    } else {
      current += line[i];
    }
  }
  cols.push(current.trim());
  return cols;
}

function normalizeDate(raw: string): string {
  const parts = raw.trim().split("/");
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return raw;
}

export function parseJournedgeCSV(csvText: string): Trade[] {
  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("Empty Journedge CSV");

  const trades: Trade[] = [];

  for (const line of lines.slice(1)) {
    const cols = parseCSVLine(line);
    if (cols.length < 14) continue;

    const date        = cols[0];
    const symbol      = cols[1];
    const underlying  = cols[2];
    const type        = cols[3];
    const direction   = cols[4];
    const optionType  = cols[5];
    const strike      = cols[6];
    const expiry      = cols[7];
    const quantity    = cols[8];
    const entryPrice  = cols[9];
    const exitPrice   = cols[10];
    const commission  = cols[11];
    const fees        = cols[12];
    const pnl         = cols[13];
    const status      = cols[14] || "";
    const entryTime   = cols[15] || "";
    const exitTime    = cols[16] || "";
    const rr          = cols[17] || "";
    const tags        = cols[18] || "";
    const journal     = cols[19] || "";
    const accountId   = cols[20] || "";

    const parsedPnl        = parseFloat(pnl) || 0;
    const parsedQty        = parseFloat(quantity) || 0;
    const parsedEntry      = parseFloat(entryPrice) || 0;
    const parsedExit       = parseFloat(exitPrice) || 0;
    const parsedStrike     = strike ? parseFloat(strike) : undefined;
    const parsedCommission = parseFloat(commission) || 0;
    const parsedFees       = parseFloat(fees) || 0;
    const normalizedDate   = normalizeDate(date);

    const derivedStatus: "win" | "loss" | "breakeven" =
      status === "win" || status === "loss" || status === "breakeven"
        ? (status as "win" | "loss" | "breakeven")
        : parsedPnl > 0 ? "win" : parsedPnl < 0 ? "loss" : "breakeven";

    const trade: Trade = {
      id: `journedge-${symbol}-${normalizedDate}-${parsedEntry}-${parsedExit}-${Math.random().toString(36).slice(2, 7)}`,
      date: normalizedDate,
      symbol,
      underlying,
      type: (["option", "stock", "future"].includes(type) ? type : "option") as "option" | "stock" | "future",
      direction: (["long", "short"].includes(direction) ? direction : "long") as "long" | "short",
      ...(optionType && { optionType: optionType as "call" | "put" }),
      ...(parsedStrike !== undefined && { strike: parsedStrike }),
      ...(expiry && { expiry }),
      quantity: parsedQty,
      entryPrice: parsedEntry,
      exitPrice: parsedExit,
      commission: parsedCommission,
      fees: parsedFees,
      pnl: parsedPnl,
      status: derivedStatus,
      ...(entryTime && { entryTime }),
      ...(exitTime && { exitTime }),
      ...(rr && { rr }),
      tags: tags ? tags.split("|").filter(Boolean) : [],
      journalEntry: journal || "",
      ...(accountId && { accountId }),
    };

    trades.push(trade);
  }

  return trades.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
