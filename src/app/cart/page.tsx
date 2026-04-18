"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useUserStore } from "@/store/userStore";
import Header from "@/components/layout/Header";
import CartItemCard from "@/components/cart/CartItemCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { calcPointsEarned } from "@/lib/utils";
import { ShoppingBag, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const originalPrice = useCartStore((s) => s.originalPrice());
  const discountAmount = useCartStore((s) => s.discountAmount);
  const finalPrice = useCartStore((s) => s.finalPrice());
  const couponCode = useCartStore((s) => s.couponCode);
  const orderType = useCartStore((s) => s.orderType);
  const tableNo = useCartStore((s) => s.tableNo);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useUserStore((s) => s.user);
  const fetchCurrentUser = useUserStore((s) => s.fetchCurrentUser);

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const pointsEarned = user
    ? calcPointsEarned(finalPrice, user.memberLevel)
    : 0;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    const result = await applyCoupon(couponInput.trim());
    setCouponMsg({ ok: result.success, text: result.message });
    setCouponLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push("/login?redirect=/cart");
      return;
    }

    if (items.length === 0) {
      toast.error("购物车为空");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          tableNo,
          items: items.map((item) => ({
            dishId: item.dishId,
            quantity: item.quantity,
            specs: item.specs,
            comboSelections: [],
          })),
          couponCode,
          remark,
        }),
      });
      const data = await res.json();

      if (data.success) {
        clearCart();
        router.push(`/orders/${data.data.id}`);
      } else {
        toast.error(data.error?.message || "下单失败");
      }
    } catch {
      toast.error("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <ShoppingBag className="h-16 w-16 text-[var(--color-text-muted)]" />
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">购物车空空如也</p>
          <Button
            onClick={() => router.push("/menu")}
            className="mt-4 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
          >
            去点餐
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-8">
      <Header />

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <h1 className="mb-4 text-xl font-bold text-[var(--color-text-primary)]">
          购物车 ({items.length}件)
        </h1>

        {/* 商品列表 */}
        <div className="space-y-3">
          {items.map((item, i) => (
            <CartItemCard key={`${item.dishId}-${item.specSummary}-${i}`} item={item} />
          ))}
        </div>

        {/* 优惠码 */}
        <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-[var(--color-accent)]" />
            <span className="text-sm font-semibold">优惠券</span>
          </div>
          {couponCode ? (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-[var(--color-success)]">
                {couponMsg?.text || `已使用: ${couponCode}`}
              </span>
              <button
                onClick={() => {
                  removeCoupon();
                  setCouponMsg(null);
                  setCouponInput("");
                }}
                className="text-xs text-[var(--color-error)] hover:underline"
              >
                取消
              </button>
            </div>
          ) : (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="输入优惠码"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                variant="outline"
                className="border-[var(--color-primary)] text-[var(--color-primary)]"
              >
                {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "验证"}
              </Button>
            </div>
          )}
          {couponMsg && !couponCode && (
            <p className={`mt-1 text-xs ${couponMsg.ok ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>
              {couponMsg.text}
            </p>
          )}
        </div>

        {/* 备注 */}
        <div className="mt-4">
          <label className="text-sm font-semibold text-[var(--color-text-primary)]">
            备注
          </label>
          <Textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value.slice(0, 200))}
            placeholder="有什么想对商家说的吗..."
            maxLength={200}
            className="mt-1"
            rows={2}
          />
          <p className="mt-1 text-right text-xs text-[var(--color-text-muted)]">
            {remark.length}/200
          </p>
        </div>

        {/* 价格汇总 */}
        <div className="mt-4 space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">原价</span>
            <span>¥{originalPrice.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-success)]">优惠</span>
              <span className="text-[var(--color-success)]">-¥{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">实付</span>
            <span className="text-lg font-bold text-[var(--color-primary)]">
              ¥{finalPrice.toFixed(2)}
            </span>
          </div>
          {pointsEarned > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">预计获得积分</span>
              <span className="text-[var(--color-highlight)]">+{pointsEarned}</span>
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 min-h-12 w-full bg-[var(--color-primary)] text-base font-bold text-white hover:bg-[var(--color-primary-dark)]"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : null}
          {submitting ? "提交中..." : user ? "去结算" : "登录后结算"}
        </Button>
      </main>
    </div>
  );
}
