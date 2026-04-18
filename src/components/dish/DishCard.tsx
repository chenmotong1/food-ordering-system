"use client";

import { useState } from "react";
import Image from "next/image";
import type { DishWithSpecs } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { Plus, Check } from "lucide-react";
import DishModal from "./DishModal";
import { toast } from "sonner";

interface DishCardProps {
  dish: DishWithSpecs;
}

export default function DishCard({ dish }: DishCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const hasSpecs = dish.specs && dish.specs.length > 0;

  const tags = (() => {
    try {
      return JSON.parse(dish.tags || "[]");
    } catch {
      return [];
    }
  })();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSpecs) {
      setShowModal(true);
      return;
    }
    addItem({
      dishId: dish.id,
      name: dish.name,
      imageUrl: dish.imageUrl,
      price: dish.price,
      quantity: 1,
      specs: [],
      specSummary: null,
      unitPrice: dish.price,
    });
    setAdded(true);
    toast.success("已加入购物车");
    setTimeout(() => setAdded(false), 800);
  };

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="group cursor-pointer overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        {/* 图片区 */}
        <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-bg)]">
          <Image
            src={dish.imageUrl}
            alt={dish.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
          {tags.length > 0 && (
            <div className="absolute right-2 top-2 flex flex-col gap-1">
              {tags.slice(0, 2).map((tag: string, i: number) => (
                <span
                  key={i}
                  className="rounded-md bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {!dish.isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white">
              已售罄
            </div>
          )}
        </div>

        {/* 正文区 */}
        <div className="p-3">
          <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {dish.name}
          </h3>
          <div className="mt-1 flex items-center gap-1">
            {dish.spicyLevel > 0 &&
              Array.from({ length: dish.spicyLevel }).map((_, i) => (
                <span key={i} className="text-xs">
                  🌶️
                </span>
              ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-base font-bold text-[var(--color-primary)]">
              ¥{(dish.price ?? 0).toFixed(2)}
            </span>
            <button
              onClick={handleQuickAdd}
              disabled={!dish.isAvailable}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors min-h-11 min-w-11 ${
                added
                  ? "bg-[var(--color-success)] text-white"
                  : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
              } disabled:opacity-50`}
            >
              {added ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <DishModal dish={dish} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
