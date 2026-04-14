import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializePlaybook(data: Record<string, unknown>): any {
  return {
    ...data,
    rules: Array.isArray(data.rules)
      ? JSON.stringify(data.rules)
      : (data.rules ?? "[]"),
    entryTriggers: Array.isArray(data.entryTriggers)
      ? JSON.stringify(data.entryTriggers)
      : (data.entryTriggers ?? "[]"),
    imageUrls: Array.isArray(data.imageUrls)
      ? JSON.stringify(data.imageUrls)
      : (data.imageUrls ?? "[]"),
  };
}

export async function GET() {
  try {
    const entries = await prisma.playbook.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch playbook" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = await prisma.playbook.create({ data: serializePlaybook(body) });
    return NextResponse.json(entry);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create playbook entry" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    const entry = await prisma.playbook.update({
      where: { id },
      data: serializePlaybook(rest),
    });
    return NextResponse.json(entry);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update playbook entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await prisma.playbook.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete playbook entry" }, { status: 500 });
  }
}
