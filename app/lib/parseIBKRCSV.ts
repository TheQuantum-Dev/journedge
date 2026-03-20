import { Trade } from "./types";

export function isIBKRCSV(csvText: string): boolean {
  return (
    csvText.includes("Trades,Header,") &&
    csvText.includes("Trades,Data,")
  );
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

// IBKR OSI format: "SPY   240119C00475000" (space-padded, 8-digit strike /1000)
function parseIBKROptionSymbol(
  raw: string
): { underlying: string; expiry: string; optionType: "call" | "put"; strike: number } | null {
  const clean = raw.replace(/\s+/g, " ").trim();
  const match = clean.match(/^([A-Z]+)\s+(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/);
  if (!match) return null;
  const [, underlying, yy, mm, dd, cp, strikeRaw] = match;
  return {
    underlying,
    expiry:     `20${yy}-${mm}-${dd}`,
    optionType: cp === "C" ? "call" : "put",
    strike:     parseInt(strikeRaw, 10) / 1000,
  };
}

// Date/Time field comes as "2024-01-15, 09:32:05" — we only need the date part
function extractDate(raw: string): string {
  const match = raw.replace(/"/g, "").match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : raw;
}

interface IBKRRow {
  assetCategory: string;
  symbol:        string;
  date:          string;
  quantity:      number;
  price:         number;
  proceeds:      number;
  commission:    number;
  realizedPnl:   number;
  isBuy:         boolean;
}

export function parseIBKRCSV(csvText: string): Trade[] {
  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);

  const headerLine = lines.find((l) => l.startsWith("Trades,Header,"));
  if (!headerLine) throw new Error("Invalid IBKR CSV: Trades header row not found");

  const headerCols = parseCSVLine(headerLine);
  const col: Record<string, number> = {};
  for (let i = 3; i < headerCols.length; i++) {
    col[headerCols[i].trim()] = i;
  }

  const rows: IBKRRow[] = [];

  for (const line of lines) {
    if (!line.startsWith("Trades,Data,Order,")) continue;

    const c   = parseCSVLine(line);
    const get = (name: string): string => (col[name] !== undefined ? c[col[name]] : "") ?? "";

    const quantityRaw = parseFloat(get("Quantity")) || 0;
    const price       = Math.abs(parseFloat(get("T. Price")) || 0);
    const symbol      = get("Symbol");

    if (quantityRaw === 0 || price === 0 || !symbol) continue;

    rows.push({
      assetCategory: get("Asset Category"),
      symbol,
      date:          extractDate(get("Date/Time")),
      quantity:      quantityRaw,
      price,
      proceeds:      parseFloat(get("Proceeds")) || 0,
      commission:    Math.abs(parseFloat(get("Comm/Fee")) || 0),
      realizedPnl:   parseFloat(get("Realized P/L")) || 0,
      isBuy:         quantityRaw > 0,
    });
  }

  if (rows.length === 0) {
    throw new Error("No trade rows found in IBKR CSV. Make sure you are exporting an Activity Statement with executed trades.");
  }

  const grouped: Record<string, IBKRRow[]> = {};
  for (const row of rows) {
    if (!grouped[row.symbol]) grouped[row.symbol] = [];
    grouped[row.symbol].push(row);
  }

  const trades: Trade[] = [];

  for (const symbol in grouped) {
    const group = grouped[symbol];
    const buys  = group.filter((r) =>  r.isBuy);
    const sells = group.filter((r) => !r.isBuy);

    const firstRow   = group[0];
    const cat        = (firstRow.assetCategory ?? "").toLowerCase();
    const isOption   = cat.includes("option");
    const isFuture   = cat.includes("future");
    const type: "option" | "stock" | "future" =
      isOption ? "option" : isFuture ? "future" : "stock";

    const optDet     = isOption ? parseIBKROptionSymbol(symbol) : null;
    const underlying = optDet?.underlying ?? symbol.trim().replace(/\s+.*$/, "");
    const multiplier = isOption ? 100 : 1;

    const pairs = Math.min(buys.length, sells.length);
    for (let i = 0; i < pairs; i++) {
      const buy  = buys[i];
      const sell = sells[i];

      const quantity   = Math.min(Math.abs(buy.quantity), Math.abs(sell.quantity));
      const entryPrice = buy.price;
      const exitPrice  = sell.price;
      const commission = buy.commission + sell.commission;

      // Use exchange-reported Realized P/L on the closing leg when available —
      // it handles FIFO matching correctly. Fall back to price arithmetic.
      const closePnl = sell.realizedPnl !== 0 ? sell.realizedPnl : null;
      const calcPnl  = (exitPrice - entryPrice) * quantity * multiplier - commission;
      const pnl      = parseFloat((closePnl ?? calcPnl).toFixed(2));

      trades.push({
        id: `ibkr-${symbol.trim()}-${sell.date}-${entryPrice}-${exitPrice}-${Math.random().toString(36).slice(2, 7)}`,
        date:       sell.date || buy.date,
        symbol:     symbol.trim(),
        underlying,
        type,
        direction:  "long",
        quantity,
        entryPrice,
        exitPrice,
        commission,
        fees:       0,
        pnl,
        status:     pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven",
        ...(optDet && {
          optionType: optDet.optionType,
          strike:     optDet.strike,
          expiry:     optDet.expiry,
        }),
        tags:         [],
        journalEntry: "",
      });
    }
  }

  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
