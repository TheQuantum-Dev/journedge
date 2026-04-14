import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeTrade(trade: Record<string, unknown>): any {
  return {
    ...trade,
    tags: Array.isArray(trade.tags)
      ? JSON.stringify(trade.tags)
      : (trade.tags ?? "[]"),
    imageUrls: Array.isArray(trade.imageUrls)
      ? JSON.stringify(trade.imageUrls)
      : (trade.imageUrls ?? "[]"),
  };
}

// Extract 0-23 hour from a time string like "9:32 AM", "14:05", "09:32"
function extractHour(entryTime: unknown): number | null {
  if (typeof entryTime !== "string" || !entryTime.trim()) return null;
  const t = entryTime.trim();

  // "9:32 AM" / "11:45 PM"
  const ampm = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const period = ampm[3].toUpperCase();
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h !== 12) h += 12;
    return h;
  }

  // "14:05" / "09:32"
  const h24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const h = parseInt(h24[1], 10);
    return h >= 0 && h <= 23 ? h : null;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const trades = await prisma.trade.findMany({
      where: accountId ? { accountId } : undefined,
      orderBy: { date: "desc" },
    });
    return NextResponse.json(trades);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    for (const trade of body.trades) {
      const data = serializeTrade({
        ...trade,
        accountId: body.accountId || null,
        hourOfDay: extractHour(trade.entryTime),
      });
      await prisma.trade.upsert({
        where: { id: data.id },
        update: data,
        create: data,
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save trades" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    const data = serializeTrade({
      ...rest,
      // Re-extract hourOfDay if entryTime is being patched
      ...(rest.entryTime !== undefined
        ? { hourOfDay: extractHour(rest.entryTime) }
        : {}),
    });
    const trade = await prisma.trade.update({ where: { id }, data });
    return NextResponse.json(trade);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update trade" }, { status: 500 });
  }
}
