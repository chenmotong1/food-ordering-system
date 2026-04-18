"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";
import type { UserInfo } from "@/types";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Users,
  Ticket,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  minRole: "all" | "manager" | "admin";
}

const NAV_ITEMS: NavItem[] = [
  { label: "仪表盘", href: "/admin", icon: <LayoutDashboard size={18} />, minRole: "all" },
  { label: "菜品管理", href: "/admin/dishes", icon: <UtensilsCrossed size={18} />, minRole: "all" },
  { label: "订单管理", href: "/admin/orders", icon: <Package size={18} />, minRole: "all" },
  { label: "用户管理", href: "/admin/users", icon: <Users size={18} />, minRole: "manager" },
  { label: "优惠券", href: "/admin/coupons", icon: <Ticket size={18} />, minRole: "manager" },
  { label: "数据统计", href: "/admin/stats", icon: <BarChart3 size={18} />, minRole: "manager" },
  { label: "操作日志", href: "/admin/logs", icon: <ClipboardList size={18} />, minRole: "admin" },
  { label: "角色管理", href: "/admin/roles", icon: <ShieldCheck size={18} />, minRole: "admin" },
];

const ROLE_HIERARCHY: Record<string, number> = {
  employee: 0,
  manager: 1,
  admin: 2,
};

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: "管理员", cls: "bg-red-100 text-red-700" },
  manager: { label: "经理", cls: "bg-blue-100 text-blue-700" },
  employee: { label: "员工", cls: "bg-green-100 text-green-700" },
};

function canSee(item: NavItem, role: string) {
  if (item.minRole === "all") return true;
  const userLevel = ROLE_HIERARCHY[role] ?? 0;
  const required = ROLE_HIERARCHY[item.minRole] ?? 99;
  return userLevel >= required;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, fetchCurrentUser, logout } = useUserStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!user || !["admin", "manager", "employee"].includes(user.role)) {
        router.replace("/login?redirect=/admin");
      }
    }
  }, [mounted, isLoading, user, router]);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-[var(--color-text-muted)]">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const visibleItems = NAV_ITEMS.filter((item) => canSee(item, user.role));
  const badge = ROLE_BADGE[user.role] ?? { label: user.role, cls: "bg-gray-100 text-gray-700" };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-[var(--color-border)] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-[var(--color-border)] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm">
            美
          </div>
          <span className="font-bold text-[var(--color-text-primary)]">
            美味1165管理后台
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
                  active
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-text-secondary)] hover:bg-gray-100 hover:text-[var(--color-text-primary)]"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[var(--color-border)] p-4 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-xs">
              {(user.username ?? "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {user.username}
              </p>
              <span
                className={cn(
                  "inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  badge.cls
                )}
              >
                {badge.label}
              </span>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-error)] w-full px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[var(--color-border)] flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {visibleItems.find((i) => i.href === pathname)?.label ?? "管理后台"}
            </h1>
          </div>
          <Link
            href="/menu"
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            返回前台
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
