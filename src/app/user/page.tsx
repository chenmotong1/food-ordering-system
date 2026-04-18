"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import Header from "@/components/layout/Header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderWithItems } from "@/types";
import { ORDER_STATUS_MAP, MEMBER_LEVEL_MAP } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const fetchCurrentUser = useUserStore((s) => s.fetchCurrentUser);
  const logout = useUserStore((s) => s.logout);
  const [recentOrders, setRecentOrders] = useState<OrderWithItems[]>([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetch("/api/orders?limit=5")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setRecentOrders(d.data.items);
        });
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const levelInfo = user ? MEMBER_LEVEL_MAP[user.memberLevel] : null;

  const levelThresholds: Record<string, { min: number; next: number | null; nextLevel: string }> = {
    bronze: { min: 0, next: 500, nextLevel: "silver" },
    silver: { min: 500, next: 2000, nextLevel: "gold" },
    gold: { min: 2000, next: null, nextLevel: "" },
  };

  const levelData = user ? levelThresholds[user.memberLevel] : null;
  const progressValue =
    levelData?.next
      ? Math.min(
          100,
          ((user!.points - levelData.min) / (levelData.next - levelData.min)) * 100
        )
      : 100;

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Header />
        <div className="flex flex-col items-center py-20">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="mt-4 h-6 w-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-8">
      <Header />

      <main className="mx-auto max-w-lg px-4 pt-4">
        {/* 用户信息卡 */}
        <div className="rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] p-6 text-white">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/30">
              <AvatarFallback className="bg-white/20 text-xl font-bold">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.username}</h2>
              <p className="mt-0.5 text-sm opacity-80">
                {user.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
              </p>
              <Badge className="mt-1 bg-white/20 text-white hover:bg-white/30">
                {levelInfo?.label || user.memberLevel}
              </Badge>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span>积分: {user.points}</span>
            {levelData?.next ? (
              <span className="opacity-75">
                距{MEMBER_LEVEL_MAP[levelData.nextLevel]?.label}还需{levelData.next - user.points}积分
              </span>
            ) : (
              <span className="opacity-75">已是最高等级</span>
            )}
          </div>
          {levelData?.next && (
            <Progress value={progressValue} className="mt-2 h-2 bg-white/20" />
          )}
        </div>

        {/* 最近订单 */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              最近订单
            </h3>
            <button
              onClick={() => router.push("/orders")}
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              查看全部
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">暂无订单</p>
          ) : (
            <div className="mt-3 space-y-2">
              {recentOrders.map((order) => {
                const statusInfo = ORDER_STATUS_MAP[order.status];
                return (
                  <button
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition-colors hover:border-[var(--color-primary)]/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-[var(--color-text-muted)]">
                        {order.orderNo}
                      </span>
                      <Badge className={`${statusInfo?.color || "bg-gray-500"} text-white text-xs`}>
                        {statusInfo?.label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">
                        {order.items.length}件 · {new Date(order.orderTime).toLocaleDateString("zh-CN")}
                      </span>
                      <span className="font-medium">¥{order.totalPrice.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 退出登录 */}
        <Button
          onClick={() => setShowLogoutDialog(true)}
          variant="outline"
          className="mt-6 w-full border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white"
        >
          退出登录
        </Button>

        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent className="sm:max-w-sm">
            <DialogTitle>确认退出</DialogTitle>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              确定要退出登录吗？
            </p>
            <div className="mt-4 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
                取消
              </Button>
              <Button
                className="bg-[var(--color-error)] text-white hover:opacity-90"
                onClick={handleLogout}
              >
                确认退出
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
