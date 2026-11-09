import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Heading, ListItem, Root, RootContent } from "mdast";
import { toString } from "mdast-util-to-string";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

// Everything here runs at build time only (static export), never in the browser.

const CONTENT_DIR = path.join(process.cwd(), "content");

export type Page = {
  /** URL path segments, e.g. ["blog", "first-post"]; [] is the home page */
  slug: string[];
  title: string;
  date?: string;
  description?: string;
  meta: Record<string, string>;
  /** Markdown body with frontmatter removed */
  body: string;
};

const parser = unified().use(remarkParse).use(remarkGfm);
const toHtmlProcessor = unified().use(remarkRehype).use(rehypeStringify);

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

function slugFor(file: string): string[] {
  const rel = path.relative(CONTENT_DIR, file).replace(/\.md$/, "");
  return rel === "index" ? [] : rel.split(path.sep);
}

function firstHeading(tree: Root): string | undefined {
  const h1 = tree.children.find((n): n is Heading => n.type === "heading" && n.depth === 1);
  return h1 ? toString(h1) : undefined;
}

function firstParagraph(tree: Root): string | undefined {
  const p = tree.children.find((n) => n.type === "paragraph");
  return p ? toString(p) : undefined;
}

function asString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

let cache: Page[] | null = null;

export function allPages(): Page[] {
  if (cache) return cache;
  cache = walk(CONTENT_DIR).map((file) => {
    const { data, content } = matter(fs.readFileSync(file, "utf8"));
    const tree = parser.parse(content) as Root;
    const meta: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      const s = asString(v);
      if (s) meta[k] = s;
    }
    return {
      slug: slugFor(file),
      title: meta.title ?? firstHeading(tree) ?? "Untitled",
      date: meta.date,
      description: meta.description ?? firstParagraph(tree),
      meta,
      body: content,
    };
  });
  return cache;
}

export function getPage(slug: string[]): Page | undefined {
  const key = slug.join("/");
  return allPages().find((p) => p.slug.join("/") === key);
}

/** Pages one level below a section (e.g. blog posts under "blog"), newest first. */
export function childrenOf(section: string): Page[] {
  return allPages()
    .filter((p) => p.slug.length === 2 && p.slug[0] === section)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

function nodesToHtml(nodes: RootContent[]): string {
  const root: Root = { type: "root", children: nodes };
  return toHtmlProcessor.stringify(toHtmlProcessor.runSync(root));
}

/** Render a page body to HTML, dropping the leading H1 (the layout shows the title). */
export function renderBody(body: string): string {
  const tree = parser.parse(body) as Root;
  const children = tree.children.filter((n, i) => !(i === 0 && n.type === "heading" && n.depth === 1));
  return nodesToHtml(children);
}

// ---------------------------------------------------------------- recipes

export type IngredientGroup = { name?: string; items: string[] };
export type RecipeStep = { number: number; header: string; html: string };
export type Recipe = Page & {
  intro: string;
  ingredients: IngredientGroup[];
  steps: RecipeStep[];
  notesHtml: string;
};

const STEP_RE = /^(?:Step\s+)?(\d+)\s*[:.]\s*(.+?):\s*([\s\S]*)$/;

/**
 * Recipes are plain Markdown with "## Ingredients" (optionally grouped by ### headings)
 * and "## Instructions". Each instruction is a numbered item written as
 * "Step 1: Header: first sentence", followed by any bullets or paragraphs that belong to it.
 */
export function parseRecipe(page: Page): Recipe {
  const tree = parser.parse(page.body) as Root;
  const intro: RootContent[] = [];
  const notes: RootContent[] = [];
  const ingredients: IngredientGroup[] = [];
  const steps: { header: string; nodes: RootContent[] }[] = [];

  let section: "intro" | "ingredients" | "instructions" | "skip" | "notes" = "intro";

  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 1) continue;

    if (node.type === "heading" && node.depth === 2) {
      const text = toString(node).toLowerCase();
      if (text.includes("ingredient")) section = "ingredients";
      else if (text.includes("instruction")) section = "instructions";
      // Time and servings already live in the frontmatter, so skip those sections.
      else if (text === "time" || text === "servings") section = "skip";
      else {
        section = "notes";
        notes.push(node);
      }
      continue;
    }

    switch (section) {
      case "intro":
        intro.push(node);
        break;
      case "notes":
        notes.push(node);
        break;
      case "ingredients":
        if (node.type === "heading") ingredients.push({ name: toString(node), items: [] });
        else if (node.type === "list") {
          if (ingredients.length === 0) ingredients.push({ items: [] });
          ingredients[ingredients.length - 1].items.push(...node.children.map((li) => toString(li)));
        }
        break;
      case "instructions":
        if (node.type === "list" && node.ordered) {
          for (const item of node.children) steps.push(stepFromItem(item, steps.length + 1));
        } else if (steps.length > 0) {
          steps[steps.length - 1].nodes.push(node);
        }
        break;
    }
  }

  return {
    ...page,
    intro: nodesToHtml(intro),
    notesHtml: nodesToHtml(notes),
    ingredients,
    steps: steps.map((s, i) => ({ number: i + 1, header: s.header, html: nodesToHtml(s.nodes) })),
  };
}

function stepFromItem(item: ListItem, n: number): { header: string; nodes: RootContent[] } {
  const [first, ...rest] = item.children;
  const text = first ? toString(first) : "";
  const match = text.match(STEP_RE);
  const nodes: RootContent[] = [];
  let header = `Step ${n}`;
  if (match) {
    header = match[2].trim();
    if (match[3].trim()) nodes.push({ type: "paragraph", children: [{ type: "text", value: match[3].trim() }] });
  } else if (first) {
    nodes.push(first);
  }
  nodes.push(...(rest as RootContent[]));
  return { header, nodes };
}

export function allRecipes(): Recipe[] {
  return childrenOf("recipes").map(parseRecipe);
}

export function getRecipe(slug: string): Recipe | undefined {
  const page = getPage(["recipes", slug]);
  return page ? parseRecipe(page) : undefined;
}
