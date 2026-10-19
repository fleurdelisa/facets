import { NextResponse } from "next/server";
import { quotes } from "@/lib/quotes";

export const dynamic = "force-dynamic";

/** Quote of the day: stable for a calendar day (UTC). For widgets. */
export async function GET() {
  const quote = await (await quotes()).quoteOfTheDay();
  return NextResponse.json({ quote });
}
