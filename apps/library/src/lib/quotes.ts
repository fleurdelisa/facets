import type { Client, Row } from "@libsql/client";
import { getDb } from "./db";
import { findRelated } from "./related";
import type { Quote, QuoteInput, QuotePatch, RelatedQuote, SourceType } from "./types";

function toQuote(row: Row): Quote {
  return {
    id: String(row.id),
    text: String(row.text),
    sourceType: row.source_type as SourceType,
    sourceTitle: String(row.source_title),
    author: String(row.author),
    location: String(row.location),
    notes: String(row.notes),
    tags: JSON.parse(String(row.tags)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export interface ListFilters {
  q?: string;
  tag?: string;
  sourceType?: SourceType;
}

export function quoteRepo(db: Client) {
  async function get(id: string): Promise<Quote | null> {
    const res = await db.execute({ sql: "SELECT * FROM quotes WHERE id = ?", args: [id] });
    return res.rows[0] ? toQuote(res.rows[0]) : null;
  }

  async function list(filters: ListFilters = {}): Promise<Quote[]> {
    const where: string[] = [];
    const args: string[] = [];
    if (filters.q) {
      const like = `%${filters.q.toLowerCase()}%`;
      where.push(
        "(lower(text) LIKE ? OR lower(notes) LIKE ? OR lower(author) LIKE ? OR lower(source_title) LIKE ?)",
      );
      args.push(like, like, like, like);
    }
    if (filters.tag) {
      where.push("EXISTS (SELECT 1 FROM json_each(quotes.tags) WHERE value = ?)");
      args.push(filters.tag.toLowerCase());
    }
    if (filters.sourceType) {
      where.push("source_type = ?");
      args.push(filters.sourceType);
    }
    const sql = `SELECT * FROM quotes ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC`;
    const res = await db.execute({ sql, args });
    return res.rows.map(toQuote);
  }

  async function create(input: QuoteInput): Promise<Quote> {
    const now = new Date().toISOString();
    const quote: Quote = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now };
    await db.execute({
      sql: `INSERT INTO quotes (id, text, source_type, source_title, author, location, notes, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        quote.id,
        quote.text,
        quote.sourceType,
        quote.sourceTitle,
        quote.author,
        quote.location,
        quote.notes,
        JSON.stringify(quote.tags),
        quote.createdAt,
        quote.updatedAt,
      ],
    });
    return quote;
  }

  async function update(id: string, patch: QuotePatch): Promise<Quote | null> {
    const existing = await get(id);
    if (!existing) return null;
    const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const next: Quote = { ...existing, ...defined, updatedAt: new Date().toISOString() };
    await db.execute({
      sql: `UPDATE quotes SET text = ?, source_type = ?, source_title = ?, author = ?, location = ?,
            notes = ?, tags = ?, updated_at = ? WHERE id = ?`,
      args: [
        next.text,
        next.sourceType,
        next.sourceTitle,
        next.author,
        next.location,
        next.notes,
        JSON.stringify(next.tags),
        next.updatedAt,
        id,
      ],
    });
    return next;
  }

  async function remove(id: string): Promise<boolean> {
    const res = await db.execute({ sql: "DELETE FROM quotes WHERE id = ?", args: [id] });
    return res.rowsAffected > 0;
  }

  async function related(id: string, limit = 5): Promise<RelatedQuote[] | null> {
    const target = await get(id);
    if (!target) return null;
    return findRelated(target, await list(), limit);
  }

  /** Same quote all day, changing daily; for widgets and the home page. */
  async function quoteOfTheDay(date = new Date()): Promise<Quote | null> {
    const all = await list();
    if (all.length === 0) return null;
    const day = Math.floor(date.getTime() / 86_400_000);
    return all[day % all.length];
  }

  async function allTags(): Promise<{ tag: string; count: number }[]> {
    const res = await db.execute(
      "SELECT value AS tag, count(*) AS count FROM quotes, json_each(quotes.tags) GROUP BY value ORDER BY count DESC, value",
    );
    return res.rows.map((r) => ({ tag: String(r.tag), count: Number(r.count) }));
  }

  return { get, list, create, update, remove, related, quoteOfTheDay, allTags };
}

export async function quotes() {
  return quoteRepo(await getDb());
}
