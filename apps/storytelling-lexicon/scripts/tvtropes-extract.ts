import * as cheerio from "cheerio";

// Pulls the descriptive part of a TV Tropes trope page — the paragraphs before
// the examples — as plain text paragraphs separated by blank lines.
//
// Trope pages put the article in #main-article: an optional opening quote
// (div.indent / .quoteright), the description, then an "Examples" heading
// followed by folders of examples. We keep everything before that heading.
export function extractDescription(html: string): string {
  const $ = cheerio.load(html);
  const article = $("#main-article").first();
  if (!article.length) return "";

  // Footnotes, images and folder controls aren't part of the prose.
  article.find("script, style, img, .quoteright, .acaptionright, .notelabel, .inlinefolder, .folderlabel").remove();

  const paragraphs: string[] = [];
  for (const node of article.children().toArray()) {
    const el = $(node);
    const tag = node.tagName?.toLowerCase();
    const text = el.text().replace(/\s+/g, " ").trim();

    if (/^h[1-6]$/.test(tag) && /^(examples?|example subpages)\b/i.test(text)) break;
    if (el.hasClass("folder")) break;
    // An opening epigraph before any prose.
    if (el.hasClass("indent") && paragraphs.length === 0) continue;
    if (/^h[1-6]$/.test(tag)) continue;

    if (tag === "ul" || tag === "ol") {
      const items = el
        .children("li")
        .toArray()
        .map((li) => $(li).text().replace(/\s+/g, " ").trim())
        .filter(Boolean);
      if (items.length) paragraphs.push(items.map((i) => `• ${i}`).join("\n"));
      continue;
    }
    if (text && (tag === "p" || el.hasClass("indent"))) paragraphs.push(text);
  }

  return paragraphs.join("\n\n").trim();
}
