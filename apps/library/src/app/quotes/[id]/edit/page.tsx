import { notFound } from "next/navigation";
import { quotes } from "@/lib/quotes";
import { QuoteForm } from "@/components/QuoteForm";

export default async function EditQuote({ params }: { params: Promise<{ id: string }> }) {
  const quote = await (await quotes()).get((await params).id);
  if (!quote) notFound();
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">Edit quote</h1>
      <QuoteForm quote={quote} />
    </div>
  );
}
