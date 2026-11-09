import type { Metadata } from "next";
import Link from "next/link";
import { allRecipes, getPage, renderBody } from "@/lib/content";

export const metadata: Metadata = { title: "Recipe Box", description: "Recipes shared with friends and family." };

export default function RecipesPage() {
  const section = getPage(["recipes"]);
  const recipes = allRecipes();

  return (
    <div>
      <header className="page-head">
        <h1>{section?.title ?? "Recipe Box"}</h1>
      </header>
      {section && <div className="prose" dangerouslySetInnerHTML={{ __html: renderBody(section.body) }} />}

      {recipes.length > 0 ? (
        <div className="recipe-grid">
          {recipes.map((r) => (
            <Link key={r.slug.join("/")} href={`/${r.slug.join("/")}`} className="recipe-card">
              <h2>{r.title}</h2>
              <ul className="chips">
                {r.meta.author && <li>{r.meta.author}</li>}
                {r.meta.servings && <li>{r.meta.servings}</li>}
                {r.meta.totalTime && <li>{r.meta.totalTime}</li>}
              </ul>
              {r.description && <p>{r.description}</p>}
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty">No recipes yet.</p>
      )}
    </div>
  );
}
