import { Trade } from "./types";

// thinkorswim (Schwab) "Account Statement" export contains many sections —
// Cash Balance, Account Order History, Account Trade History, Futures, etc.
// We only care about Account Trade History: executed fills with exact times.
const TRADE_HISTORY_TITLE = "Account Trade History";
const TOS_HEADER_COLS = [
  "Exec Time", "Spread", "Side", "Qty", "Pos Effect",
  "Symbol", "Exp", "Strike", "Type", "Price", "Net Price", "Order Type",
];

export function isThinkorswimCSV(csvText: string): boolean {
  const lines = csvText.split("\n");
  return lines.some((line) => {
    const clean = line.replace(/"/g, "");
    return TOS_HEADER_COLS.every((col) => clean.includes(col));
  });
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

const MONTHS: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
  JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
};

// Options: "1 JUN 26" (day month year) -> "2026-06-01"
// Futures: "DEC 26" (month year only, no day) -> "2026-12-01" (day defaults
// to the 1st since thinkorswim doesn't give an exact expiry day for futures)
function parseTosExpiry(raw: string): string | undefined {
  if (!raw) return undefined;
  const parts = raw.trim().split(/\s+/);
  if (parts.length === 3) {
    const [day, monAbbr, yy] = parts;
    const mm = MONTHS[monAbbr.toUpperCase()];
    if (!mm) return undefined;
    const yyyy = yy.length === 2 ? `20${yy}` : yy;
    return `${yyyy}-${mm}-${day.padStart(2, "0")}`;
  }
  if (parts.length === 2) {
    const [monAbbr, yy] = parts;
    const mm = MONTHS[monAbbr.toUpperCase()];
    if (!mm) return undefined;
    const yyyy = yy.length === 2 ? `20${yy}` : yy;
    return `${yyyy}-${mm}-01`;
  }
  return undefined;
}

// "6/12/26 11:50:28" -> date "2026-06-12", display time "11:50",
// plus a zero-padded sortKey since rows in this export are newest-first.
function splitExecTime(raw: string): { date: string; time: string; sortKey: string } {
  const [datePart, timePart] = raw.trim().split(/\s+/);
  let date = datePart || "";
  const dparts = date.split("/");
  if (dparts.length === 3) {
    let [mm, dd, yy] = dparts;
    if (yy.length === 2) yy = `20${yy}`;
    date = `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  const tparts = (timePart || "00:00:00").split(":");
  const hh = (tparts[0] || "00").padStart(2, "0");
  const mi = (tparts[1] || "00").padStart(2, "0");
  const ss = (tparts[2] || "00").padStart(2, "0");
  return { date, time: `${hh}:${mi}`, sortKey: `${date} ${hh}:${mi}:${ss}` };
}

interface TosRow {
  date: string;
  time: string;
  sortKey: string;
  side: string;       // BUY / SELL
  qty: number;
  posEffect: string;  // "TO OPEN" / "TO CLOSE"
  symbol: string;
  exp: string;
  strike: string;
  typeField: string;   // STOCK / ETF / FUND / FUTURE / CALL / PUT
  price: number;
  isOption: boolean;
  isFuture: boolean;
  isBuy: boolean;
  isOpen: boolean;
}

function contractKey(r: TosRow): string {
  // Futures contract months are already embedded in the symbol (e.g.
  // /ZTU26 = Sep 2026), so bare symbol is enough to distinguish contracts.
  return r.isOption ? `${r.symbol}|${r.exp}|${r.strike}|${r.typeField}` : r.symbol;
}

export function parseThinkorswimCSV(csvText: string): Trade[] {
  const lines = csvText.split("\n").map((l) => l.trim());

  const titleIndex = lines.findIndex((l) => l === TRADE_HISTORY_TITLE);
  if (titleIndex === -1) throw new Error("Invalid thinkorswim CSV: Account Trade History section not found");

  const headerIndex = lines.slice(titleIndex + 1).findIndex((l) => l.length > 0) + titleIndex + 1;
  const col = buildColMap(parseCSVLine(lines[headerIndex]));

  const rows: TosRow[] = [];
  // Multi-leg orders (verticals, iron condors, etc.) print the first leg with
  // a full Exec Time, then each additional leg on its own row with a BLANK
  // Exec Time — those continuation rows inherit the parent leg's timestamp.
  let lastTime: { date: string; time: string; sortKey: string } | null = null;
  let skippedFractionalTicks = 0;

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) break; // section ends at the first blank line

    const c = parseCSVLine(line);
    const symbol = (c[col["Symbol"]] ?? "").trim();
    if (!symbol) continue; // blank separator row

    const execRaw = c[col["Exec Time"]] ?? "";
    let timeInfo: { date: string; time: string; sortKey: string };
    if (execRaw) {
      timeInfo = splitExecTime(execRaw);
      lastTime = timeInfo;
    } else if (lastTime) {
      timeInfo = lastTime; // continuation leg of a multi-leg order
    } else {
      continue; // no time context to anchor this row to — skip
    }

    const side      = (c[col["Side"]] ?? "").toUpperCase();
    const qty       = Math.abs(parseFloat(c[col["Qty"]]) || 0);
    const posEffect = (c[col["Pos Effect"]] ?? "").toUpperCase();
    const exp       = (c[col["Exp"]] ?? "").trim();
    const strike    = (c[col["Strike"]] ?? "").trim();
    const typeField = (c[col["Type"]] ?? "").toUpperCase().trim();
    const priceRaw  = c[col["Price"]] ?? "";

    if (qty === 0) continue;
    if (typeField === "FUND") continue; // money-market sweep, not a trade

    // Treasury/interest-rate futures (2/5/10-Year Notes, Bonds, Ultra Bonds)
    // quote in fractional 32nds, e.g. "102'310". Decoding that correctly
    // depends on the specific contract's tick convention, and getting it
    // wrong would silently produce incorrect P&L — so these are skipped
    // rather than guessed at. Decimal-quoted futures are unaffected.
    if (priceRaw.includes("'")) {
      skippedFractionalTicks++;
      continue;
    }
    const price = Math.abs(parseFloat(priceRaw) || 0);
    if (price === 0) continue;

    rows.push({
      ...timeInfo, side, qty, posEffect, symbol, exp, strike, typeField, price,
      isOption: typeField === "CALL" || typeField === "PUT",
      isFuture: symbol.startsWith("/"),
      isBuy:    side.includes("BUY"),
      isOpen:   posEffect.includes("OPEN"),
    });
  }

  if (skippedFractionalTicks > 0) {
    console.warn(
      `thinkorswim import: skipped ${skippedFractionalTicks} fractional-tick-priced futures row(s) ` +
      `(e.g. Treasury Notes/Bonds quoted like "102'310"). Enter these manually if needed.`
    );
  }

  const grouped: Record<string, TosRow[]> = {};
  for (const row of rows) {
    const key = contractKey(row);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }

  const trades: Trade[] = [];

  for (const key in grouped) {
    // Export lists rows newest-first — sort oldest-first per contract so
    // FIFO open/close pairing lines up correctly.
    const group = [...grouped[key]].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    const longOpens   = group.filter((r) =>  r.isBuy &&  r.isOpen);
    const longCloses  = group.filter((r) => !r.isBuy && !r.isOpen);
    const shortOpens  = group.filter((r) => !r.isBuy &&  r.isOpen);
    const shortCloses = group.filter((r) =>  r.isBuy && !r.isOpen);

    const isOption = group[0].isOption;
    const isFuture = group[0].isFuture;
    const type: "option" | "stock" | "future" =
      isOption ? "option" : isFuture ? "future" : "stock";
    const multiplier = isOption ? 100 : 1;

    const process = (opens: TosRow[], closes: TosRow[], direction: "long" | "short") => {
      const pairs = Math.min(opens.length, closes.length);
      for (let i = 0; i < pairs; i++) {
        const open  = opens[i];
        const close = closes[i];

        const qty        = Math.min(open.qty, close.qty);
        const entryPrice = open.price;
        const exitPrice  = close.price;

        const gross = direction === "long"
          ? (exitPrice - entryPrice) * qty * multiplier
          : (entryPrice - exitPrice) * qty * multiplier;
        const pnl = parseFloat(gross.toFixed(2)); // commissions aren't in this section

        const strikeNum = open.strike ? parseFloat(open.strike) : undefined;
        const expiryStr = parseTosExpiry(open.exp);

        const trade: Trade = {
          id: `tos-${open.symbol}-${open.date}-${entryPrice}-${exitPrice}-${Math.random().toString(36).slice(2, 7)}`,
          date:       close.date || open.date,
          symbol:     open.symbol,
          underlying: open.symbol,
          type,
          direction,
          quantity:   qty,
          entryPrice,
          exitPrice,
          commission: 0,
          fees:       0,
          pnl,
          status: pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven",
          entryTime: open.time || undefined,
          exitTime:  close.time || undefined,
          ...(expiryStr && { expiry: expiryStr }),
          ...(isOption && {
            optionType: open.typeField === "CALL" ? "call" : "put",
            ...(strikeNum !== undefined && { strike: strikeNum }),
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
