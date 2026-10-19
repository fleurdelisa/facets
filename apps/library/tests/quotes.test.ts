import { beforeEach, describe, expect, it } from "vitest";
import { createClient } from "@libsql/client";
import { migrate } from "@/lib/db";
import { quoteRepo } from "@/lib/quotes";
import { quoteInput } from "@/lib/types";

let repo: ReturnType<typeof quoteRepo>;
const input = (overrides: Record<string, unknown>) => quoteInput.parse({ text: "x", ...overrides });

beforeEach(async () => {
  const db = createClient({ url: ":memory:" });
  await migrate(db);
  repo = quoteRepo(db);
});

describe("quote repository", () => {
  it("creates, reads, updates and deletes with timestamps", async () => {
    const created = await repo.create(
      input({ text: "So it goes.", author: "Kurt Vonnegut", tags: [" War ", "war", "fate"] }),
    );
    expect(created.tags).toEqual(["war", "fate"]);
    expect(created.createdAt).toBe(created.updatedAt);
    expect(await repo.get(created.id)).toEqual(created);

    await new Promise((r) => setTimeout(r, 5));
    const updated = await repo.update(created.id, { notes: "Billy Pilgrim's refrain." });
    expect(updated?.notes).toBe("Billy Pilgrim's refrain.");
    expect(updated?.text).toBe("So it goes.");
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated!.updatedAt > created.updatedAt).toBe(true);

    expect(await repo.remove(created.id)).toBe(true);
    expect(await repo.get(created.id)).toBeNull();
    expect(await repo.remove(created.id)).toBe(false);
    expect(await repo.update(created.id, { notes: "gone" })).toBeNull();
  });

  it("filters by search text, tag and source type", async () => {
    await repo.create(input({ text: "Fear is the mind-killer.", sourceType: "book", tags: ["fear"] }));
    await repo.create(input({ text: "Just keep swimming.", sourceType: "movie", notes: "Dory, always" }));

    expect((await repo.list({ q: "MIND" })).map((q) => q.text)).toEqual(["Fear is the mind-killer."]);
    expect((await repo.list({ q: "dory" })).length).toBe(1);
    expect((await repo.list({ tag: "fear" })).length).toBe(1);
    expect((await repo.list({ sourceType: "movie" }))[0].text).toBe("Just keep swimming.");
    expect(await repo.allTags()).toEqual([{ tag: "fear", count: 1 }]);
  });

  it("rejects an empty quote", () => {
    expect(quoteInput.safeParse({ text: "   " }).success).toBe(false);
  });
});

describe("related quotes", () => {
  it("ranks shared tags, author and similar wording above unrelated quotes", async () => {
    const target = await repo.create(
      input({
        text: "The cave you fear to enter holds the treasure you seek.",
        author: "Joseph Campbell",
        tags: ["courage", "fear"],
      }),
    );
    const sameAuthor = await repo.create(input({ text: "Follow your bliss.", author: "joseph campbell" }));
    const sharedTags = await repo.create(
      input({ text: "Do one thing every day that scares you.", tags: ["courage"] }),
    );
    const similar = await repo.create(input({ text: "What we fear doing most is usually what we most need to do." }));
    await repo.create(input({ text: "Pasta should be cooked al dente.", tags: ["food"] }));

    const related = (await repo.related(target.id))!;
    const ids = related.map((r) => r.quote.id);

    expect(ids).toHaveLength(3);
    expect(new Set(ids)).toEqual(new Set([sameAuthor.id, sharedTags.id, similar.id]));
    expect(ids).not.toContain(target.id);
    expect(related.find((r) => r.quote.id === sharedTags.id)?.reasons[0]).toBe("Shared tags: #courage");
    expect(related.find((r) => r.quote.id === sameAuthor.id)?.reasons).toContain("Also by joseph campbell");
    expect(related.find((r) => r.quote.id === similar.id)?.reasons[0]).toMatch(/^Similar ideas: fear/);
  });

  it("returns null for a missing quote", async () => {
    expect(await repo.related("nope")).toBeNull();
  });
});
