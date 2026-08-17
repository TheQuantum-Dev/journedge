import type { Trade } from "./types";

const REQUIRED_HEADERS = [
  "Name",
  "Symbol",
  "Side",
  "Status",
  "Filled",
  "Total Qty",
  "Price",
  "Avg Price",
  "Time-in-Force",
  "Placed Time",
  "Filled Time",
] as const;

const EPSILON = 0.0000001;

export interface WebullParseDiagnostics {
  skippedRows: number;
  unmatchedBuyQuantity: number;
  unmatchedSellQuantity: number;
}

export interface WebullParseResult {
  trades: Trade[];
  diagnostics: WebullParseDiagnostics;
}

interface ParsedOrder {
  rowIndex: number;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  avgPrice: number;
  filledAt: number;
  date: string;
  time: string;
}

interface OpenLot {
  rowIndex: number;
  remaining: number;
  price: number;
  date: string;
  time: string;
}

function parseCSVLine(line: string): string[] {
  const columns: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      columns.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  columns.push(current.trim());
  return columns;
}

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, "").replace(/^"|"$/g, "").trim();
}

function buildColumnMap(headers: string[]): Record<string, number> {
  const columns: Record<string, number> = {};
  headers.forEach((header, index) => {
    columns[normalizeHeader(header)] = index;
  });
  return columns;
}

function parseNumber(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;

  const normalized = raw
    .trim()
    .replace(/[$,@,\s]/g, "")
    .replace(/^\((.*)\)$/, "-$1");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseFilledTime(raw: string | undefined): {
  timestamp: number;
  date: string;
  time: string;
} | null {
  if (!raw?.trim()) return null;

  const match = raw.trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})(?:\s+(?:EST|EDT))?$/i,
  );
  if (!match) return null;

  const [, monthRaw, dayRaw, yearRaw, hourRaw, minuteRaw, secondRaw] = match;
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const year = Number(yearRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const second = Number(secondRaw);
  const timestamp = Date.UTC(year, month - 1, day, hour, minute, second);
  const date = new Date(timestamp);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    return null;
  }

  return {
    timestamp,
    date: `${yearRaw}-${monthRaw.padStart(2, "0")}-${dayRaw.padStart(2, "0")}`,
    time: `${hourRaw.padStart(2, "0")}:${minuteRaw}`,
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function statusForPnl(pnl: number): "win" | "loss" | "breakeven" {
  return pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven";
}

export function isWebullCSV(csvText: string): boolean {
  const headerLine = csvText.split(/\r?\n/).find((line) => line.trim());
  if (!headerLine) return false;

  const columns = buildColumnMap(parseCSVLine(headerLine));
  return REQUIRED_HEADERS.every((header) => columns[header] !== undefined);
}

export function parseWebullCSVWithDiagnostics(csvText: string): WebullParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2 || !isWebullCSV(csvText)) {
    throw new Error("Invalid Webull Orders CSV format");
  }

  const columns = buildColumnMap(parseCSVLine(lines[0]));
  const orders: ParsedOrder[] = [];
  let skippedRows = 0;

  for (let index = 1; index < lines.length; index++) {
    const values = parseCSVLine(lines[index]);
    const status = values[columns.Status]?.trim().toLowerCase();

    if (status !== "filled") {
      skippedRows++;
      continue;
    }

    const symbol = values[columns.Symbol]?.trim().toUpperCase();
    const side = values[columns.Side]?.trim().toLowerCase();
    const quantity = parseNumber(values[columns.Filled]);
    const avgPrice = parseNumber(values[columns["Avg Price"]]);
    const filledTime = parseFilledTime(values[columns["Filled Time"]]);

    if (
      !symbol ||
      (side !== "buy" && side !== "sell") ||
      quantity === null ||
      quantity <= 0 ||
      avgPrice === null ||
      avgPrice < 0 ||
      !filledTime
    ) {
      skippedRows++;
      continue;
    }

    orders.push({
      rowIndex: index,
      symbol,
      side,
      quantity,
      avgPrice,
      filledAt: filledTime.timestamp,
      date: filledTime.date,
      time: filledTime.time,
    });
  }

  orders.sort((a, b) => a.filledAt - b.filledAt || a.rowIndex - b.rowIndex);

  const openLots = new Map<string, OpenLot[]>();
  const matchedTrades: Array<{ trade: Trade; closedAt: number; rowIndex: number }> = [];
  let unmatchedSellQuantity = 0;

  for (const order of orders) {
    const lots = openLots.get(order.symbol) ?? [];
    if (!openLots.has(order.symbol)) openLots.set(order.symbol, lots);

    if (order.side === "buy") {
      lots.push({
        rowIndex: order.rowIndex,
        remaining: order.quantity,
        price: order.avgPrice,
        date: order.date,
        time: order.time,
      });
      continue;
    }

    let remainingToSell = order.quantity;
    while (remainingToSell > EPSILON && lots.length > 0) {
      const lot = lots[0];
      const quantity = Math.min(remainingToSell, lot.remaining);
      const pnl = round((order.avgPrice - lot.price) * quantity, 2);

      matchedTrades.push({
        closedAt: order.filledAt,
        rowIndex: order.rowIndex,
        trade: {
          id: `webull-${order.symbol}-${lot.rowIndex}-${order.rowIndex}-${matchedTrades.length}`,
          date: lot.date,
          symbol: order.symbol,
          underlying: order.symbol,
          type: "stock",
          direction: "long",
          quantity: round(quantity, 4),
          entryPrice: lot.price,
          exitPrice: order.avgPrice,
          commission: 0,
          fees: 0,
          pnl,
          status: statusForPnl(pnl),
          entryTime: lot.time,
          exitTime: order.time,
          tags: [],
          journalEntry: "",
        },
      });

      lot.remaining -= quantity;
      remainingToSell -= quantity;
      if (lot.remaining <= EPSILON) lots.shift();
    }

    if (remainingToSell > EPSILON) {
      unmatchedSellQuantity += remainingToSell;
    }
  }

  const unmatchedBuyQuantity = Array.from(openLots.values())
    .flat()
    .reduce((total, lot) => total + lot.remaining, 0);

  matchedTrades.sort((a, b) => b.closedAt - a.closedAt || b.rowIndex - a.rowIndex);

  return {
    trades: matchedTrades.map(({ trade }) => trade),
    diagnostics: {
      skippedRows,
      unmatchedBuyQuantity: round(unmatchedBuyQuantity, 4),
      unmatchedSellQuantity: round(unmatchedSellQuantity, 4),
    },
  };
}

export function parseWebullCSV(csvText: string): Trade[] {
  return parseWebullCSVWithDiagnostics(csvText).trades;
}
