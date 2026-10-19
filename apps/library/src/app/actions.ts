"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { quotes } from "@/lib/quotes";
import { quoteInput } from "@/lib/types";

export interface FormState {
  errors?: Record<string, string[] | undefined>;
}

function fromForm(form: FormData) {
  return quoteInput.safeParse({
    text: form.get("text"),
    sourceType: form.get("sourceType"),
    sourceTitle: form.get("sourceTitle") ?? "",
    author: form.get("author") ?? "",
    location: form.get("location") ?? "",
    notes: form.get("notes") ?? "",
    tags: String(form.get("tags") ?? "").split(","),
  });
}

export async function saveQuote(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const parsed = fromForm(form);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const repo = await quotes();
  const quote = id ? await repo.update(id, parsed.data) : await repo.create(parsed.data);
  if (!quote) return { errors: { text: ["This quote no longer exists."] } };

  revalidatePath("/", "layout");
  redirect(`/quotes/${quote.id}`);
}

export async function deleteQuote(id: string) {
  await (await quotes()).remove(id);
  revalidatePath("/", "layout");
  redirect("/");
}
