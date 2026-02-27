import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    const trades = await prisma.trade.findMany({
      where: accountId ? { accountId: accountId } : undefined,
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
      await prisma.trade.upsert({
        where: { id: trade.id },
        update: { ...trade, accountId: body.accountId || null },
        create: { ...trade, accountId: body.accountId || null },
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
    const { id, ...data } = body;
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