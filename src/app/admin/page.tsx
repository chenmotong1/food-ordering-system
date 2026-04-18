"use client";

import { useEffect, useState, useCallback } from "react";
import { useUserStore } from "@/store/userStore";
import { useAdminNotification } from "@/lib/socket-client";
import { cn, formatPrice } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/types";
import { toast } from "sonner";
import {
  ShoppingBag,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type DateRange = "today" | "7d" | "30d";

interface OverviewData {
  todayOrders: number;
  todaySales: number;
  pendingOrders: number;
  totalUsers: number;
}

interface TrendItem {
  date: string;
  totalSales: number;
  orderCount: number;
}

interface TopDish {
  id: string;
  name: string;
  imageUrl: string;
  salesCount: number;
  revenue: number;
}

interface CategorySale {
  category: string;
  sales: number;
  percentage: number;
}

interface HourlyOrder {
  hour: number;
  count: number;
  sales: number;
}

const CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-accent)",
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
];

export default function AdminDashboard() {
  const { user } = useUserStore();
  const { notifications, dismissNotification } = useAdminNotification();
  const [range, setRange] = useState<DateRange>("today");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [topDishes, setTopDishes] = useState<TopDish[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySale[]>([]);
  const [hourlyOrders, setHourlyOrders] = useState<HourlyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    const params = new URLSearchParams();
    if (range === "today") {
      params.set("date", new Date().toISOString().slice(0, 10));
    }
    const res = await fetch(`/api/stats/overview?${params}`);
    const data = await res.json();
    if (data.success) setOverview(data.data);
  }, [range]);

  const fetchTrend = useCallback(async () => {
    const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
    const res = await fetch(`/api/stats/sales-trend?days=${days}`);
    const data = await res.json();
    if (data.success) setTrend(data.data || []);
  }, [range]);

  const fetchTopDishes = useCallback(async () => {
    const res = await fetch(`/api/stats/top-dishes?limit=5`);
    const data = await res.json();
    if (data.success) setTopDishes(data.data || []);
  }, []);

  const fetchCategorySales = useCallback(async () => {
    const res = await fetch(`/api/stats/category-sales`);
    const data = await res.json();
    if (data.success) setCategorySales(data.data || []);
  }, []);

  const fetchHourly = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("date", new Date().toISOString().slice(0, 10));
    const res = await fetch(`/api/stats/hourly-orders?${params}`);
    const data = await res.json();
    if (data.success) setHourlyOrders(data.data || []);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOverview(), fetchTrend(), fetchTopDishes(), fetchCategorySales(), fetchHourly()])
      .finally(() => setLoading(false));
  }, [fetchOverview, fetchTrend, fetchTopDishes, fetchCategorySales, fetchHourly]);

  // Show new order notifications
  useEffect(() => {
    notifications.forEach((n) => {
      toast.success(`新订单 NO.${n.pickupNo}`, {
        description: `${n.itemCount}件商品，${formatPrice(n.totalPrice)}`,
        duration: 5000,
      });
      dismissNotification(n.orderNo);
    });
  }, [notifications, dismissNotification]);

  const isManager = user?.role === "manager" || user?.role === "admin";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Tabs value={range} onValueChange={(v) => setRange(v as DateRange)}>
        <TabsList>
          <TabsTrigger value="today">今日</TabsTrigger>
          <TabsTrigger value="7d">近7天</TabsTrigger>
          <TabsTrigger value="30d">近30天</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">订单数</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                  {overview?.todayOrders ?? 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShoppingBag size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">销售额</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                  {formatPrice(overview?.todaySales ?? 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">待处理</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                  {overview?.pendingOrders ?? 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">总用户</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                  {overview?.totalUsers ?? 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users size={20} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      {isManager && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sales Trend */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp size={16} />
                销售趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: unknown) => String(v).slice(5)}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: unknown) => [`¥${Number(value).toFixed(2)}`, "销售额"]}
                      labelFormatter={(label: unknown) => `日期: ${String(label)}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalSales"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Sales Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">分类销售占比</CardTitle>
            </CardHeader>
            <CardContent>
              {categorySales.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categorySales}
                      dataKey="sales"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${CATEGORY_LABELS[name || ""] || name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {categorySales.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown) => [formatPrice(Number(value)), "销售额"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Row */}
      {isManager && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top 5 Dishes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">热门菜品 Top 5</CardTitle>
            </CardHeader>
            <CardContent>
              {topDishes.length > 0 ? (
                <div className="space-y-3">
                  {topDishes.map((dish, i) => (
                    <div key={dish.id} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                          i === 0
                            ? "bg-yellow-500"
                            : i === 1
                              ? "bg-gray-400"
                              : i === 2
                                ? "bg-amber-700"
                                : "bg-gray-300"
                        )}
                      >
                        {i + 1}
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
                        🍽️
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{dish.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          销量 {dish.salesCount}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-highlight)]">
                        {formatPrice(dish.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-[var(--color-text-muted)] text-sm">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hourly Orders (only today) */}
          {range === "today" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">今日时段订单分布</CardTitle>
              </CardHeader>
              <CardContent>
                {hourlyOrders.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={hourlyOrders}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: unknown) => `${v}:00`}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: unknown, name: unknown) => [
                          name === "count" ? `${value} 单` : formatPrice(Number(value)),
                          name === "count" ? "订单数" : "销售额",
                        ]}
                        labelFormatter={(label: unknown) => `${label}:00`}
                      />
                      <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                    今日暂无订单
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Non-manager fallback */}
      {!isManager && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[var(--color-text-muted)]">
              仪表盘完整数据统计仅对经理及以上角色可见
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
