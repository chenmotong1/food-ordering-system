"use client";

import { useEffect, useState, useCallback } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart,
  Bar,
} from "recharts";

type DateRange = "7d" | "30d" | "90d";

interface TrendItem {
  date: string;
  totalSales: number;
  orderCount: number;
}

interface TopDish {
  id: string;
  name: string;
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

export default function AdminStatsPage() {
  const [range, setRange] = useState<DateRange>("7d");
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [topDishes, setTopDishes] = useState<TopDish[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySale[]>([]);
  const [hourlyOrders, setHourlyOrders] = useState<HourlyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const daysMap: Record<DateRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

  const fetchTrend = useCallback(async () => {
    const res = await fetch(`/api/stats/sales-trend?days=${daysMap[range]}`);
    const data = await res.json();
    if (data.success) setTrend(data.data || []);
  }, [range]);

  const fetchTopDishes = useCallback(async () => {
    const res = await fetch(`/api/stats/top-dishes?limit=10`);
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
    Promise.all([fetchTrend(), fetchTopDishes(), fetchCategorySales(), fetchHourly()]).finally(
      () => setLoading(false)
    );
  }, [fetchTrend, fetchTopDishes, fetchCategorySales, fetchHourly]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-64 animate-pulse bg-gray-100 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <Tabs value={range} onValueChange={(v) => setRange(v as DateRange)}>
        <TabsList>
          <TabsTrigger value="7d">近7天</TabsTrigger>
          <TabsTrigger value="30d">近30天</TabsTrigger>
          <TabsTrigger value="90d">近90天</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Sales Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">销售趋势</CardTitle>
        </CardHeader>
        <CardContent>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: unknown) => String(v).slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => {
                    if (name === "totalSales") return [`¥${Number(value).toFixed(2)}`, "销售额"];
                    return [String(value), "订单数"];
                  }}
                  labelFormatter={(label: unknown) => `日期: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="totalSales"
                />
                <Line
                  type="monotone"
                  dataKey="orderCount"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  strokeDasharray="5 5"
                  name="orderCount"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-[var(--color-text-muted)]">
              暂无数据
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Dishes Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">菜品销量排行 Top 10</CardTitle>
          </CardHeader>
          <CardContent>
            {topDishes.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topDishes} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={75}
                  />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => {
                      if (name === "salesCount") return [`${value} 份`, "销量"];
                      return [formatPrice(Number(value)), "销售额"];
                    }}
                  />
                  <Bar dataKey="salesCount" fill="var(--color-primary)" radius={[0, 4, 4, 0]} name="salesCount" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-[var(--color-text-muted)]">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">分类销售占比</CardTitle>
          </CardHeader>
          <CardContent>
            {categorySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="sales"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${CATEGORY_LABELS[name || ""] || name} ${((percent ?? 0) * 100).toFixed(1)}%`
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
              <div className="h-[350px] flex items-center justify-center text-[var(--color-text-muted)]">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Orders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">今日时段订单分布</CardTitle>
        </CardHeader>
        <CardContent>
          {hourlyOrders.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={hourlyOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: unknown) => `${v}:00`}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => {
                    if (name === "count") return [`${value} 单`, "订单数"];
                    return [formatPrice(Number(value)), "销售额"];
                  }}
                  labelFormatter={(label: unknown) => `${label}:00`}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-[var(--color-text-muted)]">
              今日暂无订单
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
