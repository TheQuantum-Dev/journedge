import type { Trade } from "./types";

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

function parseMoney(raw: string | undefined): number {
  if (!raw) return 0;
  const value = raw.replace(/[$,%"]/g, "").replace(/,/g, "").trim();
  if (!value) return 0;
  if (value.startsWith("(") && value.endsWith(")")) {
    return -(parseFloat(value.slice(1, -1)) || 0);
  }
  return parseFloat(value) || 0;
}

function parseQuantity(raw: string | undefined): number {
  if (!raw) return 0;
  return Math.abs(parseFloat(raw.replace(/,/g, "").replace(/"/g, "").trim()) || 0);
}

function normalizeDate(raw: string): string {
  const parts = raw.trim().split("/");
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return raw;
}

function parseOptionDetails(symbol: string): {
  underlying: string;
  expiry: string;
  optionType: "call" | "put";
  strike: number;
} | null {
  const match = symbol.match(
    /^(.+?)\s+(\d{2})\/(\d{2})\/(\d{4})\s+(\d+(?:\.\d+)?)\s+([CP])$/
  );
  if (!match) return null;
  const [, underlying, mm, dd, yyyy, strike, cp] = match;
  return {
    underlying: underlying.trim(),
    expiry: `${yyyy}-${mm}-${dd}`,
    optionType: cp === "C" ? "call" : "put",
    strike: parseFloat(strike),
  };
}

export function isSchwabCSV(csvText: string): boolean {
  const lines = csvText.split("\n").map((l) => l.replace(/"/g, "").trim());
  return (
    lines.some((line) => line.startsWith("Realized Gain/Loss - Lot Details")) &&
    lines.some((line) =>
      line.startsWith(
        "Symbol,Name,Closed Date,Opened Date,Quantity,Proceeds Per Share,Cost Per Share"
      )
    )
  );
}

interface LotGroup {
  symbol: string;
  openDate: string;
  closeDate: string;
  seq: string;
  quantity: number;
  proceeds: number;
  costBasis: number;
  gainLoss: number;
  optionDetails: ReturnType<typeof parseOptionDetails>;
}

export function parseSchwabCSV(csvText: string): Trade[] {
  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
  const headerIndex = lines.findIndex((line) =>
    line
      .replace(/"/g, "")
      .startsWith(
        "Symbol,Name,Closed Date,Opened Date,Quantity,Proceeds Per Share,Cost Per Share"
      )
  );

  if (headerIndex === -1) {
    throw new Error("Invalid Schwab realized gain/loss CSV format");
  }

  const col = buildColMap(parseCSVLine(lines[headerIndex]));
  const required = [
    "Symbol",
    "Closed Date",
    "Opened Date",
    "Quantity",
    "Proceeds Per Share",
    "Cost Per Share",
    "Proceeds",
    "Cost Basis (CB)",
    "Gain/Loss ($)",
  ];
  for (const name of required) {
    if (col[name] === undefined) {
      throw new Error(`Schwab CSV missing column: ${name}`);
    }
  }

  const groups: Record<string, LotGroup> = {};
  let seqIndex = 0;

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const symbol = cols[col["Symbol"]]?.replace(/"/g, "").trim();
    if (!symbol) continue;

    const quantity  = parseQuantity(cols[col["Quantity"]]);
    const proceeds  = parseMoney(cols[col["Proceeds"]]);
    const costBasis = parseMoney(cols[col["Cost Basis (CB)"]]);
    const gainLoss  = parseMoney(cols[col["Gain/Loss ($)"]]);

    if (quantity === 0 || (proceeds === 0 && costBasis === 0 && gainLoss === 0)) continue;

    const hasPriceData = proceeds !== 0 && costBasis !== 0;

    const optionDetails = parseOptionDetails(symbol);
    const closeDateRaw =
      col["Transaction Closed Date"] !== undefined && cols[col["Transaction Closed Date"]]
        ? cols[col["Transaction Closed Date"]]
        : cols[col["Closed Date"]];
    const openDateRaw = cols[col["Opened Date"]] ?? "";

    const key = `${symbol}|${openDateRaw}|${closeDateRaw}`;
    if (!groups[key]) {
      groups[key] = {
        symbol,
        openDate: openDateRaw,
        closeDate: closeDateRaw,
        seq: hasPriceData ? String(seqIndex++) : `noprice-${i}`,
        quantity: 0,
        proceeds: 0,
        costBasis: 0,
        gainLoss: 0,
        optionDetails,
      };
    }

    groups[key].quantity  += quantity;
    groups[key].proceeds  += proceeds;
    groups[key].costBasis += costBasis;
    groups[key].gainLoss  += gainLoss;
  }

  const trades: Trade[] = [];

  Object.values(groups).forEach((group) => {
    const multiplier  = group.optionDetails ? 100 : 1;
    const entryPrice  = parseFloat(
      (group.costBasis / (group.quantity * multiplier)).toFixed(4)
    );
    const exitPrice   = parseFloat(
      (group.proceeds / (group.quantity * multiplier)).toFixed(4)
    );
    const pnl         = parseFloat(group.gainLoss.toFixed(2));
    const cleanSymbol = group.optionDetails
      ? `${group.optionDetails.underlying} ${group.optionDetails.expiry} ${group.optionDetails.strike} ${group.optionDetails.optionType}`
      : group.symbol;

    trades.push({
      id: `schwab-${group.symbol}-${group.openDate}-${group.closeDate}-${group.quantity}-${group.seq}`,
      date: normalizeDate(group.closeDate),
      symbol: cleanSymbol,
      underlying: group.optionDetails?.underlying ?? group.symbol,
      type: group.optionDetails ? "option" : "stock",
      direction: "long",
      quantity: group.quantity,
      entryPrice,
      exitPrice,
      commission: 0,
      fees: 0,
      pnl,
      status: pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven",
      ...(group.optionDetails && {
        optionType: group.optionDetails.optionType,
        strike:     group.optionDetails.strike,
        expiry:     group.optionDetails.expiry,
      }),
      tags:         [],
      imageUrls:    [],
      journalEntry: "",
    });
  });

  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
