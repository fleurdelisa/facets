// Shared by the add-recipe page (browser) and the parse-recipe Cloudflare Function.
// No Node or browser-only APIs here.

export type ImportedRecipe = {
  name: string;
  author: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  ingredients: string[];
  /** body may contain "- " bullet lines; an empty header shows as "Step N" */
  instructions: { header: string; body: string }[];
  source?: string;
};

type JsonLd = Record<string, unknown>;

function isRecipe(node: unknown): node is JsonLd {
  if (!node || typeof node !== "object") return false;
  const type = (node as JsonLd)["@type"];
  return type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"));
}

function findRecipe(data: unknown): JsonLd | undefined {
  const items = Array.isArray(data) ? data : [data];
  for (const item of items) {
    if (isRecipe(item)) return item;
    const graph = (item as JsonLd | null)?.["@graph"];
    if (Array.isArray(graph)) {
      const found = graph.find(isRecipe);
      if (found) return found;
    }
  }
  return undefined;
}

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return decodeEntities(value).trim();
  if (Array.isArray(value)) return text(value[0]);
  if (typeof value === "object" && "name" in value) return text((value as JsonLd).name);
  return String(value);
}

function list(value: unknown): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map(text).filter(Boolean);
}

function steps(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return [decodeEntities(value)];
  if (!Array.isArray(value)) value = [value];
  return (value as unknown[]).flatMap((step) => {
    if (typeof step === "string") return [decodeEntities(step)];
    const s = step as JsonLd;
    // HowToSection groups several HowToSteps
    if (Array.isArray(s.itemListElement)) return steps(s.itemListElement);
    return [text(s.text) || text(s.name)].filter(Boolean);
  });
}

function duration(value: unknown): string {
  const v = text(value);
  const m = v.match(/^P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m || (!m[1] && !m[2])) return v;
  return [m[1] && `${m[1]} hr`, m[2] && `${m[2]} min`].filter(Boolean).join(" ");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

/** Pull a schema.org Recipe out of a page's JSON-LD. Returns null if there isn't one. */
export function extractRecipeFromHtml(html: string): ImportedRecipe | null {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(re)) {
    let data: unknown;
    try {
      data = JSON.parse(match[1]);
    } catch {
      continue;
    }
    const r = findRecipe(data);
    if (!r) continue;
    return {
      name: text(r.name),
      author: text(r.author),
      description: text(r.description),
      // Sites often give ["4", "4 servings"]; keep the most descriptive one.
      servings: list(r.recipeYield ?? r.yield).sort((a, b) => b.length - a.length)[0] ?? "",
      prepTime: duration(r.prepTime),
      cookTime: duration(r.cookTime),
      totalTime: duration(r.totalTime),
      ingredients: list(r.recipeIngredient),
      instructions: steps(r.recipeInstructions).map((body) => ({ header: "", body })),
    };
  }
  return null;
}

function yamlValue(v: string): string {
  return /[:#"'\n]|^\s|\s$/.test(v) ? JSON.stringify(v) : v;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The Markdown file to drop into content/recipes/ */
export function recipeToMarkdown(r: ImportedRecipe, today = new Date()): string {
  const front: [string, string][] = [
    ["title", r.name || "Untitled Recipe"],
    ["author", r.author],
    ["date", today.toISOString().slice(0, 10)],
    ["source", r.source ?? ""],
    ["servings", r.servings],
    ["totalTime", r.totalTime || [r.prepTime, r.cookTime].filter(Boolean).join(" + ")],
  ];

  const lines = ["---", ...front.filter(([, v]) => v).map(([k, v]) => `${k}: ${yamlValue(v)}`), "---", ""];
  lines.push(`# ${r.name || "Untitled Recipe"}`, "");
  if (r.description) lines.push(r.description, "");

  lines.push("## Ingredients", "", ...r.ingredients.map((i) => `- ${i}`), "");

  lines.push("## Instructions", "");
  r.instructions.forEach((step, i) => {
    const n = i + 1;
    const header = step.header.replace(/:/g, " -").trim() || `Step ${n}`;
    const [first = "", ...rest] = step.body.split("\n").map((l) => l.trim()).filter(Boolean);
    lines.push(`${n}. Step ${n}: ${header}: ${first}`, "");
    if (rest.length) lines.push(...rest, "");
  });

  if (r.prepTime || r.cookTime) {
    lines.push("## Time", "");
    if (r.prepTime) lines.push(`- Prep: ${r.prepTime}`);
    if (r.cookTime) lines.push(`- Cook: ${r.cookTime}`);
    lines.push("");
  }

  return lines.join("\n");
}
