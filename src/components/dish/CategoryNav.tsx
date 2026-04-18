"use client";

import { useDishStore } from "@/store/dishStore";
import { CATEGORIES } from "@/types";

export default function CategoryNav() {
  const selectedCategory = useDishStore((s) => s.selectedCategory);
  const setCategory = useDishStore((s) => s.setCategory);

  return (
    <>
      {/* 移动端：横向滚动 Tab */}
      <nav className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 lg:hidden">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === cat.key
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </nav>

      {/* 桌面端：左侧固定垂直导航 */}
      <nav className="hidden lg:fixed lg:left-0 lg:top-[calc(3.5rem+2rem)] lg:z-30 lg:flex lg:w-48 lg:flex-col lg:gap-1 lg:overflow-y-auto lg:border-r lg:border-[var(--color-border)] lg:bg-[var(--color-surface)] lg:p-3"
        style={{ height: "calc(100vh - 3.5rem - 2rem - 4.5rem)" }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              selectedCategory === cat.key
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
