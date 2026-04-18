"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCart } from "lucide-react";

export default function CartBar() {
  const totalItems = useCartStore((s) => s.totalItems());
  const finalPrice = useCartStore((s) => s.finalPrice());

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="h-6 w-6 text-[var(--color-primary)]" />
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white animate-bounce">
              {totalItems}
            </span>
          </div>
          <span className="text-sm text-[var(--color-text-secondary)]">
            已选 {totalItems} 件
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-[var(--color-text-muted)]">合计</span>
            <span className="ml-1 text-lg font-bold text-[var(--color-primary)]">
              ¥{finalPrice.toFixed(2)}
            </span>
          </div>
          <Link
            href="/cart"
            className="min-h-11 rounded-full bg-[var(--color-primary)] px-6 text-sm font-bold text-white hover:bg-[var(--color-primary-dark)]"
          >
            查看购物车
          </Link>
        </div>
      </div>
    </div>
  );
}
