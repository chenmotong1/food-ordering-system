"use client";

import { useEffect, useState, useCallback } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Coupon {
  id: string;
  code: string;
  name: string;
  type: string;
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  totalCount: number;
  usedCount: number;
  startAt: string;
  expireAt: string;
  isActive: boolean;
}

const EMPTY_COUPON = {
  code: "",
  name: "",
  type: "fixed",
  value: 0,
  minOrderAmount: 0,
  maxDiscount: null as number | null,
  totalCount: -1,
  startAt: "",
  expireAt: "",
  isActive: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_COUPON);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons");
      const data = await res.json();
      if (data.success) setCoupons(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleToggle = async (coupon: Coupon) => {
    const res = await fetch(`/api/coupons/${coupon.id}/toggle`, { method: "PATCH" });
    const data = await res.json();
    if (data.success) {
      toast.success(coupon.isActive ? "已禁用" : "已启用");
      fetchCoupons();
    } else {
      toast.error(data.error?.message || "操作失败");
    }
  };

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) return toast.error("请填写优惠码和名称");
    if (form.value <= 0) return toast.error("优惠值必须大于0");
    if (!form.startAt || !form.expireAt) return toast.error("请设置有效期");

    setSaving(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          startAt: new Date(form.startAt).toISOString(),
          expireAt: new Date(form.expireAt).toISOString(),
          maxDiscount: form.type === "percent" ? form.maxDiscount : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("优惠券已创建");
        setSheetOpen(false);
        setForm(EMPTY_COUPON);
        fetchCoupons();
      } else {
        toast.error(data.error?.message || "创建失败");
      }
    } finally {
      setSaving(false);
    }
  };

  const describeCoupon = (c: Coupon) => {
    if (c.type === "fixed") return `满${c.minOrderAmount}减${c.value}`;
    const pct = Math.round((1 - c.value) * 100);
    let desc = `${pct}%折`;
    if (c.maxDiscount) desc += `（最多减${c.maxDiscount}）`;
    return desc;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">优惠券管理</h2>
        <Button onClick={() => { setForm(EMPTY_COUPON); setSheetOpen(true); }}>
          <Plus size={16} className="mr-1" /> 创建优惠券
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>优惠码</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>优惠内容</TableHead>
              <TableHead className="text-center">使用量</TableHead>
              <TableHead>有效期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((_, j) => (
                    <TableCell key={j}><div className="h-6 bg-gray-100 animate-pulse rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-[var(--color-text-muted)]">
                  暂无优惠券
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-semibold text-[var(--color-primary)]">
                    {coupon.code}
                  </TableCell>
                  <TableCell>{coupon.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {coupon.type === "fixed" ? "满减" : "折扣"}
                    </Badge>
                  </TableCell>
                  <TableCell>{describeCoupon(coupon)}</TableCell>
                  <TableCell className="text-center">
                    {coupon.usedCount}/{coupon.totalCount === -1 ? "∞" : coupon.totalCount}
                  </TableCell>
                  <TableCell className="text-xs text-[var(--color-text-muted)]">
                    {new Date(coupon.startAt).toLocaleDateString("zh-CN")}
                    {" ~ "}
                    {new Date(coupon.expireAt).toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-[10px]",
                        coupon.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {coupon.isActive ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={coupon.isActive}
                      onCheckedChange={() => handleToggle(coupon)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>创建优惠券</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label>优惠码 *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="如 WELCOME10"
              />
            </div>
            <div>
              <Label>名称 *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如 新人专享满50减10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>类型</Label>
                <Select value={form.type} onValueChange={(v) => { if (v) setForm({ ...form, type: v }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">满减</SelectItem>
                    <SelectItem value="percent">折扣</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{form.type === "fixed" ? "减免金额" : "折扣率"}</Label>
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                  step={form.type === "fixed" ? 1 : 0.01}
                  min={0}
                  placeholder={form.type === "fixed" ? "10" : "0.9"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>最低消费</Label>
                <Input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              {form.type === "percent" && (
                <div>
                  <Label>最大抵扣</Label>
                  <Input
                    type="number"
                    value={form.maxDiscount ?? ""}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value ? parseFloat(e.target.value) : null })}
                    min={0}
                    placeholder="不限"
                  />
                </div>
              )}
            </div>
            <div>
              <Label>总发行量（-1=不限）</Label>
              <Input
                type="number"
                value={form.totalCount}
                onChange={(e) => setForm({ ...form, totalCount: parseInt(e.target.value) || -1 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>开始时间</Label>
                <Input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                />
              </div>
              <div>
                <Label>过期时间</Label>
                <Input
                  type="datetime-local"
                  value={form.expireAt}
                  onChange={(e) => setForm({ ...form, expireAt: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={saving} className="w-full">
              {saving ? "创建中..." : "创建优惠券"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
