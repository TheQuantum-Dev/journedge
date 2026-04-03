import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(tags);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Tag name required" }, { status: 400 });
    }
    const tag = await prisma.tag.upsert({
      where: { name: name.trim() },
      update: {},
      create: { id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: name.trim() },
    });
    return NextResponse.json(tag);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await prisma.tag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
