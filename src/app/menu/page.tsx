"use client";

import { useEffect } from "react";
import { useDishStore } from "@/store/dishStore";
import { useUserStore } from "@/store/userStore";
import { useCartStore } from "@/store/cartStore";
import Header from "@/components/layout/Header";
import CategoryNav from "@/components/dish/CategoryNav";
import DishCard from "@/components/dish/DishCard";
import CartBar from "@/components/layout/CartBar";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function MenuPage() {
  const router = useRouter();
  const { dishes, isLoading, keyword, total } = useDishStore();
  const fetchDishes = useDishStore((s) => s.fetchDishes);
  const fetchCurrentUser = useUserStore((s) => s.fetchCurrentUser);
  const orderType = useCartStore((s) => s.orderType);

  useEffect(() => {
    if (!orderType) {
      router.replace("/");
      return;
    }
    fetchDishes();
    fetchCurrentUser();
  }, []);

  const isSearching = keyword.trim().length > 0;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <CategoryNav />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-4 lg:ml-48">
        {/* 搜索结果标题 */}
        {isSearching && (
          <div className="mb-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              搜索 &quot;{keyword}&quot; 找到 {total} 个结果
            </p>
          </div>
        )}

        {/* 菜品网格 */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : dishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-5xl">🍽️</span>
            <p className="mt-4 text-lg text-[var(--color-text-muted)]">
              {isSearching
                ? `未找到 "${keyword}" 相关菜品`
                : "暂无菜品"}
            </p>
            {isSearching && (
              <button
                onClick={() => useDishStore.getState().setKeyword("")}
                className="mt-3 text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                清空搜索
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {dishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </main>

      <CartBar />
    </div>
  );
}
