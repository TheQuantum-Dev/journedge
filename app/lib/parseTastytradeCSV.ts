import { Trade } from "./types";

export function isTastytradeCSV(csvText: string): boolean {
  const firstLine = csvText.split("\n")[0].replace(/"/g, "").trim();
  return (
    firstLine.includes("Instrument Type") &&
    firstLine.includes("Action") &&
    firstLine.includes("Underlying Symbol")
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

function buildColMap(header: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((name, i) => {
    map[name.replace(/"/g, "").trim()] = i;
  });
  return map;
}

// Tastytrade exports expiry as MM/DD/YYYY
function normalizeExpiry(raw: string): string {
  if (!raw) return "";
  const parts = raw.trim().split("/");
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return raw;
}

interface TastyRow {
  date:           string;
  action:         string;
  symbol:         string;
  instrumentType: string;
  quantity:       number;
  avgPrice:       number;
  commissions:    number;
  fees:           number;
  multiplier:     number;
  underlying:     string;
  expiry:         string;
  strike:         number | undefined;
  callOrPut:      string;
  isOpening:      boolean;
  isBuy:          boolean;
}

export function parseTastytradeCSV(csvText: string): Trade[] {
  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("Empty Tastytrade CSV");

  const col = buildColMap(parseCSVLine(lines[0]));

  const required = ["Date", "Type", "Action", "Symbol", "Instrument Type", "Quantity"];
  for (const name of required) {
    if (col[name] === undefined) throw new Error(`Tastytrade CSV missing column: ${name}`);
  }

  const rows: TastyRow[] = [];

  for (const line of lines.slice(1)) {
    const c = parseCSVLine(line);

    const type = c[col["Type"]] ?? "";
    if (type !== "Trade") continue;

    const action    = (c[col["Action"]] ?? "").toUpperCase();
    const isBuy     = action.includes("BUY");
    const isOpening = action.includes("OPEN");

    const quantity    = Math.abs(parseFloat(c[col["Quantity"]]      ?? "0") || 0);
    const avgPrice    = Math.abs(parseFloat(c[col["Average Price"]] ?? "0") || 0);
    const commissions = Math.abs(parseFloat(c[col["Commissions"]]   ?? "0") || 0);
    const fees        = Math.abs(parseFloat(c[col["Fees"]]          ?? "0") || 0);
    const multiplier  = parseFloat(c[col["Multiplier"]]             ?? "1") || 1;

    if (quantity === 0) continue;

    const strikeRaw = c[col["Strike Price"]] ?? "";
    const strike    = strikeRaw ? parseFloat(strikeRaw) : undefined;

    rows.push({
      date:           c[col["Date"]]              ?? "",
      action,
      symbol:         c[col["Symbol"]]            ?? "",
      instrumentType: (c[col["Instrument Type"]] ?? "").toLowerCase(),
      quantity,
      avgPrice,
      commissions,
      fees,
      multiplier,
      underlying:     c[col["Underlying Symbol"]] ?? c[col["Symbol"]] ?? "",
      expiry:         normalizeExpiry(c[col["Expiration Date"]] ?? ""),
      strike,
      callOrPut:      (c[col["Call or Put"]]      ?? "").toUpperCase(),
      isOpening,
      isBuy,
    });
  }

  const grouped: Record<string, TastyRow[]> = {};
  for (const row of rows) {
    if (!grouped[row.symbol]) grouped[row.symbol] = [];
    grouped[row.symbol].push(row);
  }

  const trades: Trade[] = [];

  for (const symbol in grouped) {
    const group = grouped[symbol];

    const longOpens   = group.filter((r) =>  r.isBuy &&  r.isOpening);
    const longCloses  = group.filter((r) => !r.isBuy && !r.isOpening);
    const shortOpens  = group.filter((r) => !r.isBuy &&  r.isOpening);
    const shortCloses = group.filter((r) =>  r.isBuy && !r.isOpening);

    const process = (opens: TastyRow[], closes: TastyRow[], direction: "long" | "short") => {
      const pairs = Math.min(opens.length, closes.length);
      for (let i = 0; i < pairs; i++) {
        const open  = opens[i];
        const close = closes[i];

        const isOption = open.instrumentType.includes("option");
        const isFuture = open.instrumentType.includes("future");
        const tradeType: "option" | "stock" | "future" =
          isOption ? "option" : isFuture ? "future" : "stock";

        const qty        = Math.min(open.quantity, close.quantity);
        const entryPrice = open.avgPrice;
        const exitPrice  = close.avgPrice;
        const multi      = open.multiplier;
        const commission = open.commissions + close.commissions;
        const feesTotal  = open.fees + close.fees;

        const gross = direction === "long"
          ? (exitPrice - entryPrice) * qty * multi
          : (entryPrice - exitPrice) * qty * multi;
        const pnl = parseFloat((gross - commission - feesTotal).toFixed(2));

        const trade: Trade = {
          id: `tasty-${symbol}-${open.date}-${entryPrice}-${exitPrice}-${Math.random().toString(36).slice(2, 7)}`,
          date:       open.date,
          symbol,
          underlying: open.underlying || symbol,
          type:       tradeType,
          direction,
          quantity:   qty,
          entryPrice,
          exitPrice,
          commission,
          fees:       feesTotal,
          pnl,
          status: pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven",
          ...(isOption && {
            optionType: open.callOrPut === "CALL" ? "call" : "put",
            ...(open.strike !== undefined && { strike: open.strike }),
            ...(open.expiry && { expiry: open.expiry }),
          }),
          tags:         [],
          journalEntry: "",
        };

        trades.push(trade);
      }
    };

    process(longOpens,  longCloses,  "long");
    process(shortOpens, shortCloses, "short");
  }

  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
