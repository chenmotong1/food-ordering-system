"use client";

import Image from "next/image";
import type { CartItem } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemCardProps {
  item: CartItem;
}

export default function CartItemCard({ item }: CartItemCardProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const deleteItem = useCartStore((s) => s.deleteItem);

  return (
    <div className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      {/* 菜品图片 */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg)]">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>

      {/* 信息区 */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {item.name}
          </h4>
          {item.specSummary && (
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {item.specSummary}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--color-primary)]">
            ¥{item.unitPrice.toFixed(2)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                updateQuantity(item.dishId, item.specSummary, item.quantity - 1)
              }
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] min-h-11 min-w-11"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-bold">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                updateQuantity(item.dishId, item.specSummary, item.quantity + 1)
              }
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] min-h-11 min-w-11"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={() => deleteItem(item.dishId, item.specSummary)}
              className="ml-1 flex h-8 w-8 items-center justify-center text-[var(--color-error)] min-h-11 min-w-11"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
