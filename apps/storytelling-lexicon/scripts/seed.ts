// Upserts the public glossary from src/data/glossary.
//
//   pnpm seed          write to Supabase (needs SUPABASE_SERVICE_ROLE_KEY)
//   pnpm seed --sql    print SQL instead, e.g. to paste into the SQL editor
import { createClient } from "@supabase/supabase-js";
import { seedEntries, seedRelations } from "../src/data/glossary";

const args = { entries_in: seedEntries, relations_in: seedRelations };

if (process.argv.includes("--sql")) {
  const json = (v: unknown) => `$seed$${JSON.stringify(v)}$seed$::jsonb`;
  console.log(`select seed_glossary(${json(args.entries_in)}, ${json(args.relations_in)});`);
} else {
  void write();
}

async function write() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or use --sql).");
    process.exit(1);
  }
  const { error } = await createClient(url, key).rpc("seed_glossary", args);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Seeded ${seedEntries.length} entries and ${seedRelations.length} relations.`);
}
