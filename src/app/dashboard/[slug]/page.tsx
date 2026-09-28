import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalculatorView } from "@/components/CalculatorView";
import { CategoryChip, CategoryIcon } from "@/components/CategoryBadge";
import { calculators, getCalculator } from "@/lib/calculators";

export const dynamicParams = false;

export function generateStaticParams() {
  return calculators.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const calc = getCalculator(slug);
  return calc ? { title: calc.name, description: calc.description } : {};
}

export default async function CalculatorPage({ params }: PageProps<"/dashboard/[slug]">) {
  const { slug } = await params;
  const calc = getCalculator(slug);
  if (!calc) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/"
        className="neu-button w-fit rounded-xl px-4 py-2 text-sm font-medium text-accent"
      >
        ← All calculators
      </Link>

      <section className="neu-raised flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8">
        <CategoryIcon category={calc.category} />
        <div className="flex flex-col gap-2">
          <CategoryChip category={calc.category} />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{calc.name}</h1>
          <p className="text-muted">{calc.description}</p>
        </div>
      </section>

      <CalculatorView slug={calc.slug} />
    </div>
  );
}
