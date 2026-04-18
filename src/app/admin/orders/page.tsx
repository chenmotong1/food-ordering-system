"use client";

import { useEffect, useState, useCallback } from "react";
import { useUserStore } from "@/store/userStore";
import { useAdminNotification } from "@/lib/socket-client";
import { cn, formatPrice } from "@/lib/utils";
import { ORDER_STATUS_MAP } from "@/types";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye } from "lucide-react";

interface OrderItem {
  id: string;
  dishName: string;
  dishImage: string;
  quantity: number;
  unitPrice: number;
  specSummary: string | null;
  subtotal: number;
}

interface Order {
  id: string;
  orderNo: string;
  pickupNo: string;
  userId: string;
  orderType: string;
  tableNo: string | null;
  originalPrice: number;
  discountAmount: number;
  totalPrice: number;
  pointsEarned: number;
  status: string;
  orderTime: string;
  remark: string | null;
  items: OrderItem[];
  user?: { username: string };
}

const STATUS_TABS = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待处理" },
  { value: "preparing", label: "制作中" },
  { value: "ready", label: "待取餐" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

// Status transition rules per role
function getNextStatuses(currentStatus: string, role: string): { value: string; label: string }[] {
  const results: { value: string; label: string }[] = [];
  if (currentStatus === "pending") results.push({ value: "preparing", label: "制作中" });
  if (currentStatus === "preparing") results.push({ value: "ready", label: "待取餐" });

  if (role === "manager" || role === "admin") {
    if (currentStatus === "ready") results.push({ value: "completed", label: "已完成" });
    if (currentStatus !== "cancelled" && currentStatus !== "completed") {
      results.push({ value: "cancelled", label: "取消" });
    }
  }
  return results;
}

const STATUS_BADGE_CLS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  preparing: "bg-blue-100 text-blue-700",
  ready: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function AdminOrdersPage() {
  const { user } = useUserStore();
  const { notifications, dismissNotification } = useAdminNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      if (data.success) setOrders(data.data.items || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time notifications
  useEffect(() => {
    notifications.forEach((n) => {
      toast.success(`新订单 NO.${n.pickupNo}`, {
        description: `${n.itemCount}件商品，${formatPrice(n.totalPrice)}`,
        duration: 5000,
      });
      dismissNotification(n.orderNo);
      if (statusFilter === "all" || statusFilter === "pending") {
        fetchOrders();
      }
    });
  }, [notifications, dismissNotification, statusFilter, fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`订单状态已更新为${ORDER_STATUS_MAP[newStatus]?.label || newStatus}`);
        fetchOrders();
      } else {
        toast.error(data.error?.message || "更新失败");
      }
    } finally {
      setUpdating(null);
    }
  };

  const openDetail = async (order: Order) => {
    const res = await fetch(`/api/orders/${order.id}`);
    const data = await res.json();
    if (data.success) setDetailOrder(data.data);
    else setDetailOrder(order);
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const canUpdate = user?.role === "employee" || user?.role === "manager" || user?.role === "admin";

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-4">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="relative">
                {t.label}
                {t.value === "pending" && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-error)] text-white text-[10px] rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>取餐号</TableHead>
              <TableHead>订单号</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>方式</TableHead>
              <TableHead>金额</TableHead>
              <TableHead className="text-center">商品</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(9)].map((_, j) => (
                    <TableCell key={j}><div className="h-6 bg-gray-100 animate-pulse rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-[var(--color-text-muted)]">
                  暂无订单数据
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const nextStatuses = getNextStatuses(order.status, user?.role || "");
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-bold text-[var(--color-primary)]">
                        NO.{order.pickupNo}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--color-text-muted)]">
                      {order.orderNo}
                    </TableCell>
                    <TableCell>{order.user?.username || "-"}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {order.orderType === "dine_in"
                          ? `堂食${order.tableNo ? ` (${order.tableNo}号桌)` : ""}`
                          : "外带"}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(order.totalPrice)}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.items?.length || 0}件
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", STATUS_BADGE_CLS[order.status] || "")}>
                        {ORDER_STATUS_MAP[order.status]?.label || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--color-text-muted)]">
                      {new Date(order.orderTime).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(order)}
                          className="p-1.5 rounded hover:bg-gray-100 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                          aria-label="查看详情"
                        >
                          <Eye size={14} />
                        </button>
                        {canUpdate && nextStatuses.length > 0 && (
                          <Select
                            onValueChange={(v: string | null) => { if (v !== null) updateStatus(order.id, v) }}
                            disabled={updating === order.id}
                          >
                            <SelectTrigger className="h-7 w-[90px] text-xs">
                              <SelectValue placeholder="更新状态" />
                            </SelectTrigger>
                            <SelectContent>
                              {nextStatuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              订单详情 {detailOrder?.orderNo}
            </DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[var(--color-text-muted)]">取餐号：</span>
                  <span className="font-bold text-[var(--color-primary)]">NO.{detailOrder.pickupNo}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">状态：</span>
                  <Badge className={cn("text-[10px]", STATUS_BADGE_CLS[detailOrder.status] || "")}>
                    {ORDER_STATUS_MAP[detailOrder.status]?.label || detailOrder.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">方式：</span>
                  {detailOrder.orderType === "dine_in"
                    ? `堂食${detailOrder.tableNo ? ` (${detailOrder.tableNo}号桌)` : ""}`
                    : "外带"}
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">下单时间：</span>
                  {new Date(detailOrder.orderTime).toLocaleString("zh-CN")}
                </div>
              </div>
              {detailOrder.remark && (
                <div>
                  <span className="text-[var(--color-text-muted)]">备注：</span>
                  {detailOrder.remark}
                </div>
              )}
              <div className="border-t border-[var(--color-border)] pt-3">
                <p className="font-medium mb-2">商品明细</p>
                <div className="space-y-2">
                  {detailOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{item.dishName}</span>
                        {item.specSummary && (
                          <span className="text-[var(--color-text-muted)] text-xs ml-1">
                            ({item.specSummary})
                          </span>
                        )}
                        <span className="text-[var(--color-text-muted)] ml-1">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-[var(--color-border)] pt-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">原价</span>
                  <span>{formatPrice(detailOrder.originalPrice)}</span>
                </div>
                {detailOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-[var(--color-error)]">
                    <span>优惠</span>
                    <span>-{formatPrice(detailOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>实付</span>
                  <span className="text-[var(--color-primary)]">{formatPrice(detailOrder.totalPrice)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
