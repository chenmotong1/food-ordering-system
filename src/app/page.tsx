"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, ShoppingBag } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const orderType = useCartStore((s) => s.orderType);
  const tableNo = useCartStore((s) => s.tableNo);
  const setOrderType = useCartStore((s) => s.setOrderType);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [inputTableNo, setInputTableNo] = useState("");

  const handleDineIn = () => {
    setInputTableNo("");
    setShowTableDialog(true);
  };

  const confirmDineIn = () => {
    const no = inputTableNo.trim();
    if (!no || isNaN(Number(no)) || Number(no) < 1 || Number(no) > 50) {
      return;
    }
    setOrderType("dine_in", no);
    router.push("/menu");
  };

  const handleTakeout = () => {
    setOrderType("takeout");
    router.push("/menu");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[var(--color-bg)] to-white px-4">
      {/* 品牌 */}
      <div className="mb-12 text-center">
        <div className="text-5xl font-black text-[var(--color-primary)]">美味1165</div>
        <p className="mt-2 text-lg text-[var(--color-text-secondary)]">
          新鲜美味，即刻享用
        </p>
      </div>

      {/* 当前选择提示 */}
      {orderType && (
        <div className="mb-6 rounded-xl bg-[var(--color-accent)]/10 px-6 py-3 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            当前选择：
            <span className="font-bold text-[var(--color-primary)]">
              {orderType === "dine_in" ? `堂食（桌号 ${tableNo}）` : "外带"}
            </span>
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            可重新选择用餐方式，或点击上方选项继续
          </p>
        </div>
      )}

      {/* 用餐方式选择 */}
      <div className="flex w-full max-w-md flex-col gap-4 sm:flex-row">
        <button
          onClick={handleDineIn}
          className={`flex min-h-20 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-white px-6 py-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
            orderType === "dine_in"
              ? "border-[var(--color-primary)]"
              : "border-[var(--color-accent)] hover:border-[var(--color-primary)]"
          }`}
        >
          <UtensilsCrossed className="h-8 w-8 text-[var(--color-accent)]" />
          <span className="text-lg font-bold text-[var(--color-text-primary)]">堂食</span>
          <span className="text-xs text-[var(--color-text-muted)]">在餐厅享用</span>
        </button>

        <button
          onClick={handleTakeout}
          className={`flex min-h-20 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-white px-6 py-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
            orderType === "takeout"
              ? "border-[var(--color-primary)]"
              : "border-[var(--color-accent)] hover:border-[var(--color-primary)]"
          }`}
        >
          <ShoppingBag className="h-8 w-8 text-[var(--color-accent)]" />
          <span className="text-lg font-bold text-[var(--color-text-primary)]">外带</span>
          <span className="text-xs text-[var(--color-text-muted)]">打包带走</span>
        </button>
      </div>

      {/* 桌号弹窗 */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>请输入桌号</DialogTitle>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="tableNo">桌号（1-50）</Label>
              <Input
                id="tableNo"
                type="number"
                min={1}
                max={50}
                value={inputTableNo}
                onChange={(e) => setInputTableNo(e.target.value)}
                placeholder="请输入您的桌号"
                className="mt-1"
              />
            </div>
            <Button
              onClick={confirmDineIn}
              className="w-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
            >
              确认堂食
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
