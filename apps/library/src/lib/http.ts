import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export const notFound = () => NextResponse.json({ error: "Quote not found" }, { status: 404 });

export const invalid = (error: ZodError) =>
  NextResponse.json({ error: "Invalid quote", issues: error.flatten().fieldErrors }, { status: 400 });

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}
