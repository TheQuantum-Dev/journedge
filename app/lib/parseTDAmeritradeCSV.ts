import { Trade } from "./types";

export function isTDAmeritradeCSV(csvText: string): boolean {
  const firstLine = csvText.split("\n")[0].replace(/"/g, "").trim();
  return firstLine.startsWith("DATE,TRANSACTION ID,DESCRIPTION,QUANTITY,SYMBOL,PRICE,COMMISSION");
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

// TDA option symbols: .AAPL240115C185 — dot prefix, OCC format underneath
function parseTDAOptionSymbol(
  raw: string
): { underlying: string; expiry: string; optionType: "call" | "put"; strike: number } | null {
  const clean = raw.replace(/^\./, "").trim();
  const match = clean.match(/^([A-Z]+)(\d{2})(\d{2})(\d{2})([CP])(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const [, underlying, yy, mm, dd, cp, strikeStr] = match;
  return {
    underlying,
    expiry: `20${yy}-${mm}-${dd}`,
    optionType: cp === "C" ? "call" : "put",
    strike: parseFloat(strikeStr),
  };
}

function detectType(symbol: string): "option" | "stock" | "future" {
  if (symbol.startsWith(".")) return "option";
  if (symbol.startsWith("/")) return "future";
  if (/^[A-Z]+\d{6}[CP]\d/.test(symbol)) return "option";
  return "stock";
}

function normalizeDate(raw: string): string {
  const parts = raw.trim().split("/");
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return raw;
}

interface TDARawRow {
  date:        string;
  description: string;
  quantity:    number;
  symbol:      string;
  price:       number;
  commission:  number;
  amount:      number;
  isBuy:       boolean;
}

export function parseTDAmeritradeCSV(csvText: string): Trade[] {
  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);

  const headerIndex = lines.findIndex((l) =>
    l.replace(/"/g, "").startsWith("DATE,TRANSACTION ID,DESCRIPTION,QUANTITY,SYMBOL,PRICE,COMMISSION")
  );
  if (headerIndex === -1) throw new Error("Invalid TD Ameritrade CSV format");

  const rows: TDARawRow[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.replace(/"/g, "").startsWith("***")) break;

    const cols = parseCSVLine(line);
    if (cols.length < 8) continue;

    const description = cols[2];
    const quantity    = Math.abs(parseFloat(cols[3]) || 0);
    const symbol      = cols[4].trim();
    const price       = Math.abs(parseFloat(cols[5]) || 0);
    const commission  = Math.abs(parseFloat(cols[6]) || 0);
    const amount      = parseFloat(cols[7]) || 0;

    if (!symbol || !cols[0] || quantity === 0 || price === 0) continue;

    const desc = description.toUpperCase();
    const isTrade =
      desc.includes("BOT") || desc.includes("SLD") ||
      desc.includes("BOUGHT") || desc.includes("SOLD") ||
      desc.includes("BUY") || desc.includes("SELL");
    if (!isTrade) continue;

    // negative amount = money left the account = buy
    rows.push({
      date: cols[0],
      description,
      quantity,
      symbol,
      price,
      commission,
      amount,
      isBuy: amount < 0,
    });
  }

  const grouped: Record<string, TDARawRow[]> = {};
  for (const row of rows) {
    if (!grouped[row.symbol]) grouped[row.symbol] = [];
    grouped[row.symbol].push(row);
  }

  const trades: Trade[] = [];

  for (const symbol in grouped) {
    const group      = grouped[symbol];
    const buys       = group.filter((r) => r.isBuy);
    const sells      = group.filter((r) => !r.isBuy);
    const type       = detectType(symbol);
    const optDet     = type === "option" ? parseTDAOptionSymbol(symbol) : null;
    const underlying = optDet?.underlying ?? symbol.replace(/^[./]/, "").replace(/\d.*$/, "").toUpperCase();
    const multiplier = type === "option" ? 100 : 1;

    const pairs = Math.min(buys.length, sells.length);
    for (let i = 0; i < pairs; i++) {
      const buy  = buys[i];
      const sell = sells[i];

      const quantity        = Math.min(buy.quantity, sell.quantity);
      const entryPrice      = buy.price;
      const exitPrice       = sell.price;
      const totalCommission = buy.commission + sell.commission;
      const pnl = parseFloat(
        ((exitPrice - entryPrice) * quantity * multiplier - totalCommission).toFixed(2)
      );

      const trade: Trade = {
        id: `tda-${symbol}-${normalizeDate(buy.date)}-${entryPrice}-${exitPrice}-${Math.random().toString(36).slice(2, 7)}`,
        date:       normalizeDate(sell.date || buy.date),
        symbol:     symbol.replace(/^\./, ""),
        underlying,
        type,
        direction:  "long",
        quantity,
        entryPrice,
        exitPrice,
        commission: totalCommission,
        fees:       0,
        pnl,
        status: pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven",
        ...(optDet && {
          optionType: optDet.optionType,
          strike:     optDet.strike,
          expiry:     optDet.expiry,
        }),
        tags:         [],
        journalEntry: "",
      };

      trades.push(trade);
    }
  }

  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
