"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import PickupCard from "@/components/order/PickupCard";
import OrderStatusBar from "@/components/order/OrderStatusBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderWithItems } from "@/types";
import { ORDER_STATUS_MAP } from "@/types";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, List } from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = params.id as string;

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrder(data.data);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  // 浏览器推送通知
  useEffect(() => {
    if (!order) return;
    if (order.status === "ready") {
      const pickupNo = order.pickupNo || "";
      if ("Notification" in window) {
        if (Notification.permission === "default") {
          Notification.requestPermission();
        }
        if (Notification.permission === "granted") {
          new Notification("🍔 您的餐品已准备好！", {
            body: `取餐号 NO.${pickupNo}，请到取餐台取餐`,
            icon: "/favicon.ico",
          });
        } else {
          toast.success(`餐品已准备好！取餐号 NO.${pickupNo}`);
        }
      } else {
        toast.success(`餐品已准备好！取餐号 NO.${pickupNo}`);
      }
    }
  }, [order?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Header />
        <div className="mx-auto max-w-lg space-y-4 px-4 pt-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Header />
        <div className="flex flex-col items-center py-20">
          <p className="text-lg text-[var(--color-text-muted)]">订单不存在</p>
          <Button onClick={() => router.push("/menu")} className="mt-4">
            返回点餐
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = ORDER_STATUS_MAP[order.status];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-8">
      <Header />

      <main className="mx-auto max-w-lg px-4 pt-4">
        {/* 取餐号 */}
        {order.pickupNo && (
          <PickupCard pickupNo={order.pickupNo} />
        )}

        {/* 订单状态 */}
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <OrderStatusBar status={order.status} />
          <div className="mt-3 flex items-center justify-center">
            <Badge className={`${statusInfo?.color || "bg-gray-500"} text-white`}>
              {statusInfo?.label || order.status}
            </Badge>
          </div>
        </div>

        {/* 订单信息 */}
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            订单信息
          </h3>
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">订单号</span>
              <span>{order.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">用餐方式</span>
              <span>{order.orderType === "dine_in" ? `堂食 (桌号: ${order.tableNo})` : "外带"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">下单时间</span>
              <span>{new Date(order.orderTime).toLocaleString("zh-CN")}</span>
            </div>
            {order.remark && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">备注</span>
                <span>{order.remark}</span>
              </div>
            )}
          </div>
        </div>

        {/* 商品明细 */}
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            商品明细
          </h3>
          <div className="mt-2 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">{item.dishName}</span>
                  <span className="ml-1 text-[var(--color-text-muted)]">x{item.quantity}</span>
                  {item.specSummary && (
                    <p className="text-xs text-[var(--color-text-muted)]">{item.specSummary}</p>
                  )}
                </div>
                <span className="font-medium">¥{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 border-t border-[var(--color-border)] pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">原价</span>
              <span>¥{order.originalPrice.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-success)]">优惠</span>
                <span className="text-[var(--color-success)]">-¥{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold">
              <span>实付</span>
              <span className="text-[var(--color-primary)]">¥{order.totalPrice.toFixed(2)}</span>
            </div>
            {order.pointsEarned > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">获得积分</span>
                <span className="text-[var(--color-highlight)]">+{order.pointsEarned}</span>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-6 flex gap-3">
          <Button
            onClick={() => router.push("/menu")}
            variant="outline"
            className="flex-1 border-[var(--color-primary)] text-[var(--color-primary)]"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            继续点餐
          </Button>
          <Button
            onClick={() => router.push("/orders")}
            className="flex-1 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
          >
            <List className="mr-1 h-4 w-4" />
            全部订单
          </Button>
        </div>
      </main>
    </div>
  );
}
