// Cloudflare Pages Function: POST /api/parse-recipe { url }
//
// The site itself is static, but Cloudflare Pages runs files in functions/ as
// small serverless handlers next to it. The add-recipe page calls this to read
// a recipe page, which the browser can't fetch directly because of CORS.
// It isn't available under `next dev`; the page falls back to manual entry.

import { extractRecipeFromHtml } from "../../src/lib/recipe-import";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function onRequestPost({ request }: { request: Request }): Promise<Response> {
  let url: URL;
  try {
    const body = (await request.json()) as { url?: string };
    url = new URL(String(body.url ?? ""));
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
  } catch {
    return json({ error: "Please send a valid http(s) URL." }, 400);
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; fleurdelisa-recipe-box/1.0)", accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) return json({ error: `That page returned ${res.status}.` }, 502);
    html = await res.text();
  } catch {
    return json({ error: "Couldn't reach that page." }, 502);
  }

  const recipe = extractRecipeFromHtml(html);
  if (!recipe) return json({ error: "No recipe data found on that page (it needs schema.org Recipe markup)." }, 422);
  return json({ ...recipe, source: url.toString() });
}
