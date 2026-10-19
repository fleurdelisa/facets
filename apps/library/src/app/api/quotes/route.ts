import { NextResponse, type NextRequest } from "next/server";
import { quotes } from "@/lib/quotes";
import { invalid, readJson } from "@/lib/http";
import { SOURCE_TYPES, quoteInput, type SourceType } from "@/lib/types";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const type = params.get("type");
  const list = await (await quotes()).list({
    q: params.get("q") ?? undefined,
    tag: params.get("tag") ?? undefined,
    sourceType: SOURCE_TYPES.includes(type as SourceType) ? (type as SourceType) : undefined,
  });
  return NextResponse.json({ quotes: list });
}

export async function POST(req: NextRequest) {
  const parsed = quoteInput.safeParse(await readJson(req));
  if (!parsed.success) return invalid(parsed.error);
  const quote = await (await quotes()).create(parsed.data);
  return NextResponse.json({ quote }, { status: 201 });
}
