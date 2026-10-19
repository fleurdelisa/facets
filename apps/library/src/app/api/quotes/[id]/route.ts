import { NextResponse, type NextRequest } from "next/server";
import { quotes } from "@/lib/quotes";
import { invalid, notFound, readJson } from "@/lib/http";
import { quotePatch } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const quote = await (await quotes()).get((await params).id);
  return quote ? NextResponse.json({ quote }) : notFound();
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const parsed = quotePatch.safeParse(await readJson(req));
  if (!parsed.success) return invalid(parsed.error);
  const quote = await (await quotes()).update((await params).id, parsed.data);
  return quote ? NextResponse.json({ quote }) : notFound();
}

export { PATCH as PUT };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const removed = await (await quotes()).remove((await params).id);
  return removed ? new NextResponse(null, { status: 204 }) : notFound();
}
