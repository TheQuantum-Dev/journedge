import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isWebullCSV,
  parseWebullCSV,
  parseWebullCSVWithDiagnostics,
} from "./parseWebullCSV";

const HEADER =
  "Name,Symbol,Side,Status,Filled,Total Qty,Price,Avg Price,Time-in-Force,Placed Time,Filled Time";

function row({
  symbol,
  side,
  status = "Filled",
  filled,
  price,
  time,
}: {
  symbol: string;
  side: string;
  status?: string;
  filled: number;
  price: number;
  time: string;
}) {
  return `Example,${symbol},${side},${status},${filled},${filled},${price},${price},DAY,${time},${time}`;
}

const FIFO_CSV = [
  HEADER,
  row({ symbol: "AAPL", side: "Buy", filled: 10, price: 100, time: "01/01/2026 10:00:00 EST" }),
  row({ symbol: "AAPL", side: "Buy", filled: 10, price: 110, time: "01/02/2026 10:00:00 EST" }),
  row({ symbol: "AAPL", side: "Sell", filled: 15, price: 120, time: "01/03/2026 10:00:00 EST" }),
].join("\n");

describe("Webull CSV parser", () => {
  it("detects the Webull Orders export header", () => {
    expect(isWebullCSV(`\uFEFF${HEADER}\n`)).toBe(true);
    expect(isWebullCSV("Date,Action,Symbol\n")).toBe(false);
  });

  it("matches filled buys and sells FIFO, including partial lots", () => {
    const result = parseWebullCSVWithDiagnostics(FIFO_CSV);

    expect(result.trades).toHaveLength(2);
    expect(result.trades.map((trade) => trade.quantity)).toEqual([10, 5]);
    expect(result.trades.map((trade) => trade.entryPrice)).toEqual([100, 110]);
    expect(result.trades.map((trade) => trade.pnl)).toEqual([200, 50]);
    expect(result.trades[0]).toMatchObject({
      symbol: "AAPL",
      underlying: "AAPL",
      type: "stock",
      direction: "long",
      date: "2026-01-01",
      entryTime: "10:00",
      exitTime: "10:00",
      commission: 0,
      fees: 0,
      status: "win",
    });
    expect(result.diagnostics).toEqual({
      skippedRows: 0,
      unmatchedBuyQuantity: 5,
      unmatchedSellQuantity: 0,
    });
  });

  it("ignores non-filled rows and reports unmatched sells", () => {
    const csv = [
      HEADER,
      row({ symbol: "MSFT", side: "Buy", status: "Cancelled", filled: 0, price: 100, time: "01/01/2026 10:00:00 EDT" }),
      row({ symbol: "MSFT", side: "Sell", filled: 2, price: 101, time: "01/02/2026 10:00:00 EDT" }),
    ].join("\r\n");

    const result = parseWebullCSVWithDiagnostics(csv);

    expect(result.trades).toEqual([]);
    expect(result.diagnostics).toEqual({
      skippedRows: 1,
      unmatchedBuyQuantity: 0,
      unmatchedSellQuantity: 2,
    });
  });

  it("produces stable IDs when parsing the same file twice", () => {
    const first = parseWebullCSV(FIFO_CSV);
    const second = parseWebullCSV(FIFO_CSV);

    expect(first.map((trade) => trade.id)).toEqual(second.map((trade) => trade.id));
  });

  it.skipIf(!process.env.WEBULL_CSV_PATH)("can validate the local real export without requiring it in the repository", () => {
    const fixturePath = process.env.WEBULL_CSV_PATH!;

    const result = parseWebullCSVWithDiagnostics(readFileSync(fixturePath, "utf8"));

    expect(result.trades).toHaveLength(124);
    expect(result.diagnostics).toEqual({
      skippedRows: 1,
      unmatchedBuyQuantity: 43,
      unmatchedSellQuantity: 11,
    });
  });
});
