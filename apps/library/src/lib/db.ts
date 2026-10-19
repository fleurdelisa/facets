import { createClient, type Client } from "@libsql/client";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_title TEXT NOT NULL DEFAULT '',
    author TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS quotes_created_at ON quotes (created_at DESC)`,
];

export async function migrate(client: Client) {
  for (const statement of SCHEMA) await client.execute(statement);
}

let ready: Promise<Client> | undefined;

/** Shared client, migrated once per process. */
export function getDb(): Promise<Client> {
  ready ??= (async () => {
    const client = createClient({
      url: process.env.DATABASE_URL ?? "file:./data/library.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    await migrate(client);
    return client;
  })();
  return ready;
}
