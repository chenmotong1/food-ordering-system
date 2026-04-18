"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderWithItems } from "@/types";
import { ORDER_STATUS_MAP } from "@/types";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchOrders = () => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrders(data.data.items);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (!confirm("确定要取消该订单吗？")) return;

    setCancelling(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("订单已取消");
        fetchOrders();
      } else {
        toast.error(data.error?.message || "取消失败");
      }
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-8">
      <Header />

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <h1 className="mb-4 text-xl font-bold text-[var(--color-text-primary)]">
          我的订单
        </h1>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <ShoppingBag className="h-16 w-16 text-[var(--color-text-muted)]" />
            <p className="mt-4 text-lg text-[var(--color-text-muted)]">还没有订单哦</p>
            <Button
              onClick={() => router.push("/menu")}
              className="mt-4 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
            >
              去点餐
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusInfo = ORDER_STATUS_MAP[order.status];
              const canCancel = order.status === "pending";
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-colors hover:border-[var(--color-primary)]/30 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-[var(--color-text-muted)]">
                      {order.orderNo}
                    </span>
                    <Badge className={`${statusInfo?.color || "bg-gray-500"} text-white text-xs`}>
                      {statusInfo?.label || order.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {order.items.length}件商品
                    </span>
                    <span className="text-base font-bold text-[var(--color-primary)]">
                      ¥{order.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <span>{new Date(order.orderTime).toLocaleString("zh-CN")}</span>
                    {order.pickupNo && <span>取餐号: {order.pickupNo}</span>}
                  </div>
                  {canCancel && (
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 text-[var(--color-error)] border-[var(--color-error)]/30 hover:bg-red-50"
                        onClick={(e) => handleCancel(e, order.id)}
                        disabled={cancelling === order.id}
                      >
                        {cancelling === order.id ? "取消中..." : "取消订单"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
