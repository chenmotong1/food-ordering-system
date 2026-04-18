"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useUserStore } from "@/store/userStore";
import { useDishStore } from "@/store/dishStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, User, LogOut, LayoutDashboard } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems());
  const orderType = useCartStore((s) => s.orderType);
  const tableNo = useCartStore((s) => s.tableNo);
  const setKeyword = useDishStore((s) => s.setKeyword);
  const keyword = useDishStore((s) => s.keyword);
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* 顶部用餐方式提示条 */}
      {orderType && (
        <div className="flex h-8 items-center justify-center bg-[var(--color-primary)] text-xs font-medium text-white">
          {orderType === "dine_in"
            ? `桌号: ${tableNo} · 堂食`
            : "外带"}
          <Link
            href="/"
            className="ml-3 underline underline-offset-2 hover:opacity-80"
          >
            修改
          </Link>
        </div>
      )}

      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/menu" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-black text-[var(--color-primary)]">
            美味1165
          </span>
          <span className="hidden text-sm text-[var(--color-text-secondary)] sm:inline">
            点餐
          </span>
        </Link>

        {/* 搜索框 */}
        <div className="mx-auto hidden max-w-sm flex-1 md:block">
          <Input
            placeholder="搜索菜品..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-9 rounded-full border-[var(--color-border)] bg-[var(--color-bg)]"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* 购物车 */}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-bg)]"
          >
            <ShoppingCart className="h-5 w-5 text-[var(--color-text-primary)]" />
            {totalItems > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white">
                {totalItems}
              </Badge>
            )}
          </Link>

          {/* 用户 */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 hover:bg-[var(--color-bg)] outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[var(--color-accent)] text-xs font-bold text-white">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">
                  {user.username}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => router.push("/user")}>
                  <User className="mr-2 h-4 w-4" />
                  个人中心
                </DropdownMenuItem>
                {["admin", "manager", "employee"].includes(user.role) && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    管理后台
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)]"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
