import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperimentScene } from "@/components/ExperimentScene";
import { allPages, childrenOf, getPage, renderBody } from "@/lib/content";

// Every Markdown page except the home page and recipes (which have their own routes).
// Section pages (blog, experiments) also list the pages under them.

export const dynamicParams = false;

export function generateStaticParams() {
  return allPages()
    .filter((p) => p.slug.length > 0 && p.slug[0] !== "recipes")
    .map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);
  return page ? { title: page.title, description: page.description } : {};
}

function formatDate(date?: string) {
  if (!date) return undefined;
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();

  const isSection = slug.length === 1;
  const children = isSection ? childrenOf(slug[0]) : [];
  const parent = slug.length > 1 ? getPage([slug[0]]) : undefined;

  return (
    <article>
      <header className="page-head">
        <h1>{page.title}</h1>
        {page.date && !isSection && <time className="date" dateTime={page.date}>{formatDate(page.date)}</time>}
      </header>

      <div className="prose" dangerouslySetInnerHTML={{ __html: renderBody(page.body) }} />

      {slug[0] === "experiments" && slug[1] && <ExperimentScene slug={slug[1]} />}

      {isSection && slug[0] !== "admin" && slug[0] !== "about" && (
        children.length > 0 ? (
          <ul className="entry-list">
            {children.map((c) => (
              <li key={c.slug.join("/")}>
                <Link href={`/${c.slug.join("/")}`}>
                  <span className="title">{c.title}</span>
                  {c.date && <span className="sub">{formatDate(c.date)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Nothing planted here yet.</p>
        )
      )}

      {parent && (
        <Link className="back" href={`/${slug[0]}`}>
          ← Back to {parent.title}
        </Link>
      )}
    </article>
  );
}
