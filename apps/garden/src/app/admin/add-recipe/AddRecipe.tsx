"use client";

import { useMemo, useState } from "react";
import { recipeToMarkdown, slugify, type ImportedRecipe } from "@/lib/recipe-import";

type Step = { header: string; body: string };

const blank = { name: "", author: "", description: "", servings: "", totalTime: "", source: "", ingredients: "" };

export function AddRecipe() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState(blank);
  const [steps, setSteps] = useState<Step[]>([{ header: "", body: "" }]);
  const [copied, setCopied] = useState(false);

  const set = (key: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  const recipe: ImportedRecipe = useMemo(
    () => ({
      name: fields.name.trim(),
      author: fields.author.trim(),
      description: fields.description.trim(),
      servings: fields.servings.trim(),
      totalTime: fields.totalTime.trim(),
      prepTime: "",
      cookTime: "",
      source: fields.source.trim() || undefined,
      ingredients: fields.ingredients.split("\n").map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean),
      instructions: steps.filter((s) => s.header.trim() || s.body.trim()),
    }),
    [fields, steps],
  );

  const ready = recipe.name && recipe.ingredients.length > 0 && recipe.instructions.length > 0;
  const markdown = ready ? recipeToMarkdown(recipe) : "";
  const filename = `${slugify(recipe.name) || "recipe"}.md`;

  async function importFromUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parse-recipe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error ?? "The recipe importer isn't available here.");
      const r = data as ImportedRecipe;
      setFields({
        name: r.name,
        author: r.author,
        description: r.description,
        servings: r.servings,
        totalTime: r.totalTime || [r.prepTime, r.cookTime].filter(Boolean).join(" + "),
        source: r.source ?? url,
        ingredients: r.ingredients.join("\n"),
      });
      setSteps(r.instructions.length ? r.instructions : [{ header: "", body: "" }]);
    } catch (err) {
      setError(`${err instanceof Error ? err.message : "Import failed."} You can fill in the recipe by hand below.`);
    } finally {
      setLoading(false);
    }
  }

  const updateStep = (i: number, patch: Partial<Step>) =>
    setSteps((s) => s.map((step, j) => (j === i ? { ...step, ...patch } : step)));

  function download() {
    const href = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  }

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <form className="panel" onSubmit={importFromUrl}>
        <div className="field">
          <label htmlFor="url">Import from a recipe page</label>
          <div className="url-row">
            <input id="url" type="url" placeholder="https://example.com/recipe" value={url} onChange={(e) => setUrl(e.target.value)} />
            <button className="btn" type="submit" disabled={loading || !url}>
              {loading ? "Reading…" : "Import"}
            </button>
          </div>
        </div>
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
      </form>

      <section className="panel" aria-labelledby="details">
        <h2 id="details" style={{ marginTop: 0 }}>
          Recipe
        </h2>
        <div className="field">
          <label htmlFor="name">Name *</label>
          <input id="name" type="text" placeholder="Chicken Congee" value={fields.name} onChange={set("name")} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="author">Author</label>
            <input id="author" type="text" value={fields.author} onChange={set("author")} />
          </div>
          <div className="field">
            <label htmlFor="servings">Servings</label>
            <input id="servings" type="text" placeholder="4 servings" value={fields.servings} onChange={set("servings")} />
          </div>
          <div className="field">
            <label htmlFor="time">Total time</label>
            <input id="time" type="text" placeholder="1 hr 15 min" value={fields.totalTime} onChange={set("totalTime")} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="source">Source link</label>
          <input id="source" type="url" value={fields.source} onChange={set("source")} />
        </div>
        <div className="field">
          <label htmlFor="desc">Why this recipe matters</label>
          <textarea id="desc" value={fields.description} onChange={set("description")} />
        </div>
        <div className="field">
          <label htmlFor="ingredients">Ingredients * (one per line)</label>
          <textarea id="ingredients" value={fields.ingredients} onChange={set("ingredients")} style={{ minHeight: "10rem" }} />
        </div>

        <h3>Steps *</h3>
        <ol className="step-list">
          {steps.map((step, i) => (
            <li key={i}>
              <div className="step-editor">
                <input
                  type="text"
                  aria-label={`Step ${i + 1} header`}
                  placeholder={`Step ${i + 1} header, e.g. Wash the rice`}
                  value={step.header}
                  onChange={(e) => updateStep(i, { header: e.target.value })}
                />
                <textarea
                  aria-label={`Step ${i + 1} details`}
                  placeholder={"What to do. Start lines with - for bullets."}
                  value={step.body}
                  onChange={(e) => updateStep(i, { body: e.target.value })}
                />
                {steps.length > 1 && (
                  <div>
                    <button type="button" className="btn ghost" onClick={() => setSteps((s) => s.filter((_, j) => j !== i))}>
                      Remove step
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="btn ghost" onClick={() => setSteps((s) => [...s, { header: "", body: "" }])}>
          + Add step
        </button>
      </section>

      <section className="panel" aria-labelledby="output">
        <h2 id="output" style={{ marginTop: 0 }}>
          Markdown
        </h2>
        {ready ? (
          <>
            <p className="muted">
              Save this as <code>apps/garden/content/recipes/{filename}</code> and push. It appears in the Recipe Box on
              the next deploy.
            </p>
            <div className="btn-row">
              <button className="btn" type="button" onClick={download}>
                Download {filename}
              </button>
              <button className="btn ghost" type="button" onClick={copy}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="md-preview">{markdown}</pre>
          </>
        ) : (
          <p className="muted">Add a name, at least one ingredient and one step to generate the file.</p>
        )}
      </section>
    </>
  );
}
