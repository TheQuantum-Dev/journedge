import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET() {
  try {
    const templates = await prisma.journalTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const template = await prisma.journalTemplate.create({
      data: {
        id: `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: body.name,
        content: body.content,
        scope: body.scope ?? "all",
      },
    });
    return NextResponse.json(template);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const template = await prisma.journalTemplate.update({
      where: { id },
      data,
    });
    return NextResponse.json(template);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await prisma.journalTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
