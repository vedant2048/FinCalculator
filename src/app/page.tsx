import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryBadge";
import { calculators, calculatorsByCategory, categoryOrder } from "@/lib/calculators";

export default function Home() {
  return (
    <div className="flex flex-col gap-14">
      <section className="neu-raised flex flex-col gap-6 rounded-3xl p-6 sm:p-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Plan every <span className="text-accent">rupee</span>.
          </h1>
          <p className="max-w-2xl text-muted sm:text-lg">
            Simple calculators for SIPs, loans, goals and savings, in lakhs and crores. Pick
            one to get started.
          </p>
        </div>
        <ul className="flex flex-wrap gap-3 text-sm font-medium">
          <li className="neu-shadow-sm rounded-full bg-fill px-4 py-1.5 text-on-fill">
            {calculators.length} calculators
          </li>
          <li className="neu-shadow-sm rounded-full bg-fill-soft px-4 py-1.5 text-on-fill">
            {categoryOrder.length} categories
          </li>
          <li className="neu-shadow-sm rounded-full bg-ink px-4 py-1.5 text-on-ink">
            Live results
          </li>
        </ul>
      </section>

      {calculatorsByCategory().map(({ category, items }) => (
        <section key={category} className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <CategoryIcon category={category} size="sm" />
            <h2 className="text-lg font-semibold tracking-tight">{category}</h2>
            <span className="text-sm text-muted">{items.length}</span>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((calc) => (
              <li key={calc.slug}>
                <Link
                  href={`/dashboard/${calc.slug}`}
                  className="neu-button group flex h-full flex-col gap-3 rounded-2xl p-5"
                >
                  <div className="flex items-start gap-3">
                    <CategoryIcon category={calc.category} />
                    <span className="pt-2 font-medium leading-snug">{calc.name}</span>
                  </div>
                  <span className="text-sm leading-relaxed text-muted">{calc.description}</span>
                  <span className="mt-auto self-end text-sm font-medium text-accent transition-transform group-hover:translate-x-1">
                    Open →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
