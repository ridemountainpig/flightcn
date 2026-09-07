"use client";

import { useEffect, useState } from "react";

export function DocsNavigation({
  items,
}: {
  items: { id: string; name: string }[];
}) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const sections = items.flatMap((item) => {
      const element = document.getElementById(item.id);
      return element ? [element] : [];
    });
    const observer = new IntersectionObserver(
      () => {
        const current = sections.find(
          (section) => section.getBoundingClientRect().bottom > 120,
        );
        if (current) setActive(current.id);
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="On this page"
      className="custom-scrollbar flex gap-1 overflow-x-auto lg:block lg:space-y-1"
    >
      {items.map((item, index) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          aria-current={active === item.id ? "location" : undefined}
          onClick={() => setActive(item.id)}
          className="flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium whitespace-nowrap text-slate-600 transition-colors duration-150 hover:bg-slate-100 aria-[current=location]:bg-orange-50 aria-[current=location]:text-orange-800"
        >
          <span className="font-mono text-[10px] opacity-60">
            {String(index + 1).padStart(2, "0")}
          </span>
          {item.name}
        </a>
      ))}
    </nav>
  );
}
