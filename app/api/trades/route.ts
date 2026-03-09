import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

// Prisma stores tags and imageUrls as TEXT (JSON strings) in SQLite.
// We must serialize arrays → strings before any write, and AppContext
// deserializes them back on read via parseTrades().
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
    const data = serializeTrade(rest);
    const trade = await prisma.trade.update({
      where: { id },
      data,
    });
    return NextResponse.json(trade);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update trade" }, { status: 500 });
  }
}