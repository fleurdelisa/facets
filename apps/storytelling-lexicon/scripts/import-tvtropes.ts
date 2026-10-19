// Imports descriptions for glossary entries that have a `tvtropes` path.
//
//   pnpm import:tvtropes                     every linked entry
//   pnpm import:tvtropes --only chekhovs-gun,foil
//   pnpm import:tvtropes --dry-run           print what would be written
//
// Pages are fetched politely (one at a time, CRAWL_DELAY apart, honouring
// robots.txt) and cached in .cache/tvtropes so re-runs don't refetch.
// Content is CC BY-NC-SA; attribution is stored with each description.
import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedEntries } from "../src/data/glossary";
import { TVTROPES_LICENSE } from "../src/lib/types";
import { extractDescription } from "./tvtropes-extract";

const BASE = "https://tvtropes.org/pmwiki/pmwiki.php/";
const USER_AGENT = "storytelling-lexicon-importer (+https://github.com/fleurdelisa/facets)";
const CACHE_DIR = path.join(process.cwd(), ".cache", "tvtropes");
let crawlDelayMs = 3000;

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const onlyArg = argv[argv.indexOf("--only") + 1];
const only = argv.includes("--only") && onlyArg ? new Set(onlyArg.split(",")) : null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function robotsDisallows(): Promise<string[]> {
  const res = await fetch("https://tvtropes.org/robots.txt", { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return [];
  const disallow: string[] = [];
  let applies = false;
  for (const raw of (await res.text()).split("\n")) {
    const line = raw.split("#")[0].trim();
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (/^user-agent$/i.test(key)) applies = value === "*";
    else if (applies && /^disallow$/i.test(key) && value) disallow.push(value);
    else if (applies && /^crawl-delay$/i.test(key)) crawlDelayMs = Math.max(crawlDelayMs, Number(value) * 1000);
  }
  return disallow;
}

async function fetchPage(page: string): Promise<{ html: string; url: string } | { status: number }> {
  const file = path.join(CACHE_DIR, `${page.replace(/\//g, "__")}.json`);
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {}
  await sleep(crawlDelayMs);
  const res = await fetch(BASE + page, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return { status: res.status };
  const result = { html: await res.text(), url: res.url };
  await writeFile(file, JSON.stringify(result));
  return result;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dryRun && (!url || !key)) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or pass --dry-run.");
    process.exit(1);
  }
  const db = dryRun ? null : createClient(url!, key!);

  await mkdir(CACHE_DIR, { recursive: true });
  const disallow = await robotsDisallows();
  const targets = seedEntries.filter((e) => e.tvtropes && (!only || only.has(e.slug)));
  const report = { imported: [] as string[], missing: [] as string[], empty: [] as string[], blocked: [] as string[] };

  for (const entry of targets) {
    const pagePath = "/pmwiki/pmwiki.php/" + entry.tvtropes;
    if (disallow.some((d) => pagePath.startsWith(d))) {
      report.blocked.push(entry.slug);
      continue;
    }
    const page = await fetchPage(entry.tvtropes!);
    if ("status" in page) {
      console.warn(`✗ ${entry.slug}: ${entry.tvtropes} returned ${page.status}`);
      report.missing.push(entry.slug);
      continue;
    }
    const description = extractDescription(page.html);
    if (!description) {
      console.warn(`✗ ${entry.slug}: no description found on ${page.url}`);
      report.empty.push(entry.slug);
      continue;
    }

    if (dryRun) {
      console.log(`\n── ${entry.name} (${page.url})\n${description}`);
    } else {
      const { error } = await db!
        .from("entries")
        .update({
          description,
          description_source: "TV Tropes",
          description_url: page.url,
          description_license: TVTROPES_LICENSE,
        })
        .eq("slug", entry.slug)
        .is("owner_id", null);
      if (error) throw error;
      console.log(`✓ ${entry.slug}`);
    }
    report.imported.push(entry.slug);
  }

  console.log(
    `\nImported ${report.imported.length}/${targets.length}.` +
      (report.missing.length ? `\nNot found (fix the tvtropes path): ${report.missing.join(", ")}` : "") +
      (report.empty.length ? `\nNothing extracted: ${report.empty.join(", ")}` : "") +
      (report.blocked.length ? `\nDisallowed by robots.txt: ${report.blocked.join(", ")}` : ""),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
