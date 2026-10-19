import { NextResponse, type NextRequest } from "next/server";
import { quotes } from "@/lib/quotes";
import { notFound } from "@/lib/http";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 5, 20);
  const related = await (await quotes()).related((await params).id, limit);
  return related ? NextResponse.json({ related }) : notFound();
}
