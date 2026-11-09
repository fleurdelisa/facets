import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allRecipes, getRecipe } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return allRecipes().map((r) => ({ slug: r.slug[1] }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  return recipe ? { title: recipe.title, description: recipe.description } : {};
}

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) notFound();
  const { meta } = recipe;

  return (
    <article>
      <header className="page-head recipe-head">
        <p className="eyebrow">Recipe Box</p>
        <h1>{recipe.title}</h1>
        <ul className="chips">
          {meta.author && <li>By {meta.author}</li>}
          {meta.servings && <li>{meta.servings}</li>}
          {meta.totalTime && <li>{meta.totalTime}</li>}
        </ul>
        <div className="prose" dangerouslySetInnerHTML={{ __html: recipe.intro }} />
        {meta.source && (
          <a href={meta.source} target="_blank" rel="noopener noreferrer">
            View the original recipe ↗
          </a>
        )}
      </header>

      <div className="recipe-layout">
        <section className="ingredients" aria-labelledby="ingredients">
          <h2 id="ingredients">Ingredients</h2>
          {recipe.ingredients.map((group, gi) => (
            <div key={gi}>
              {group.name && <h3>{group.name}</h3>}
              <ul>
                {group.items.map((item, i) => (
                  <li key={i}>
                    <label>
                      <input type="checkbox" />
                      <span>{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="instructions" aria-labelledby="instructions">
          <h2 id="instructions">Instructions</h2>
          <ol className="steps">
            {recipe.steps.map((step) => (
              <li key={step.number} className="step">
                <span className="step-num" aria-hidden="true">{step.number}</span>
                <div>
                  <h3>{step.header}</h3>
                  <div className="step-body" dangerouslySetInnerHTML={{ __html: step.html }} />
                </div>
              </li>
            ))}
            <li className="step done">
              <span className="step-num" aria-hidden="true">✓</span>
              <div>
                <h3>Done!</h3>
              </div>
            </li>
          </ol>
          {recipe.notesHtml && <div className="prose" dangerouslySetInnerHTML={{ __html: recipe.notesHtml }} />}
        </section>
      </div>

      <Link className="back" href="/recipes">
        ← Back to the Recipe Box
      </Link>
    </article>
  );
}
