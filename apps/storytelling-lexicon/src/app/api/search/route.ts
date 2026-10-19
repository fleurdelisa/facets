import { NextResponse, type NextRequest } from "next/server";
import { searchEntries } from "@/lib/glossary";

// Autocomplete for the quick-log form.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchEntries(q, 8);
  return NextResponse.json(
    results.map(({ id, slug, name, layer, summary }) => ({ id, slug, name, layer, summary })),
  );
}
