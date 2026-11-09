import type { Metadata } from "next";
import { AddRecipe } from "./AddRecipe";

export const metadata: Metadata = { title: "Add a recipe", robots: { index: false } };

export default function AddRecipePage() {
  return (
    <div>
      <header className="page-head">
        <p className="eyebrow">Admin</p>
        <h1>Add a recipe</h1>
        <p className="muted">
          Import a recipe from its page or write one by hand, then save the Markdown file into the repo. Nothing here is
          stored on the site.
        </p>
      </header>
      <AddRecipe />
    </div>
  );
}
