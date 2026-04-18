"use client";

import { useEffect, useState, useCallback } from "react";
import { useUserStore } from "@/store/userStore";
import { cn, formatPrice } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/types";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface DishSpec {
  id?: string;
  specType: string;
  specName: string;
  priceAdjust: number;
  isDefault: boolean;
  sortOrder: number;
}

interface Dish {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  price: number;
  description: string | null;
  imageUrl: string;
  tags: string;
  calories: number | null;
  spicyLevel: number;
  isRecommended: boolean;
  isAvailable: boolean;
  stock: number;
  salesCount: number;
  specs: DishSpec[];
}

const TAG_OPTIONS = ["热销", "新品", "招牌", "限时", "素食", "无辣", "低卡"];

const EMPTY_DISH: Omit<Dish, "id" | "salesCount" | "specs"> & { specs: DishSpec[] } = {
  name: "",
  category: "beverages",
  subcategory: "",
  price: 0,
  description: "",
  imageUrl: "",
  tags: "[]",
  calories: null,
  spicyLevel: 0,
  isRecommended: false,
  isAvailable: true,
  stock: 999,
  specs: [],
};

export default function AdminDishesPage() {
  const { user } = useUserStore();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Omit<Dish, "id" | "salesCount"> & { id?: string; specs: DishSpec[] }>(EMPTY_DISH);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Dish | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isManager = user?.role === "manager" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const fetchDishes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("available", "false"); // show all
      params.set("limit", "100");
      if (keyword) params.set("keyword", keyword);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await fetch(`/api/dishes?${params}`);
      const data = await res.json();
      if (data.success) {
        let items: Dish[] = data.data.items || [];
        if (statusFilter === "available") items = items.filter((d) => d.isAvailable);
        if (statusFilter === "unavailable") items = items.filter((d) => !d.isAvailable);
        setDishes(items);
      }
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const handleToggle = async (dish: Dish) => {
    const res = await fetch(`/api/dishes/${dish.id}/toggle`, { method: "PATCH" });
    const data = await res.json();
    if (data.success) {
      toast.success(dish.isAvailable ? "已下架" : "已上架");
      fetchDishes();
    } else {
      toast.error(data.error?.message || "操作失败");
    }
  };

  const openCreate = () => {
    setEditingDish({ ...EMPTY_DISH, specs: [] });
    setSheetOpen(true);
  };

  const openEdit = async (dish: Dish) => {
    const res = await fetch(`/api/dishes/${dish.id}`);
    const data = await res.json();
    if (data.success) {
      setEditingDish({ ...data.data, specs: data.data.specs || [] });
      setSheetOpen(true);
    }
  };

  const handleSave = async () => {
    if (!editingDish.name.trim()) return toast.error("请输入菜品名称");
    if (editingDish.price <= 0) return toast.error("价格必须大于0");
    if (!editingDish.imageUrl.trim()) return toast.error("请输入图片URL");

    setSaving(true);
    try {
      const payload = {
        name: editingDish.name.trim(),
        category: editingDish.category,
        subcategory: editingDish.subcategory || null,
        price: editingDish.price,
        description: editingDish.description || null,
        imageUrl: editingDish.imageUrl.trim(),
        tags: JSON.stringify(
          TAG_OPTIONS.filter((t) =>
            (editingDish.tags === "[]" ? [] : JSON.parse(editingDish.tags)).includes(t)
          )
        ),
        calories: editingDish.calories,
        spicyLevel: editingDish.spicyLevel,
        isRecommended: editingDish.isRecommended,
        isAvailable: editingDish.isAvailable,
        stock: editingDish.stock,
        specs: editingDish.specs.map((s, i) => ({
          specType: s.specType,
          specName: s.specName,
          priceAdjust: s.priceAdjust,
          isDefault: s.isDefault,
          sortOrder: i,
        })),
      };

      const isEdit = !!editingDish.id;
      const url = isEdit ? `/api/dishes/${editingDish.id}` : "/api/dishes";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? "已更新" : "已创建");
        setSheetOpen(false);
        fetchDishes();
      } else {
        toast.error(data.error?.message || "保存失败");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/dishes/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("已删除");
        setDeleteTarget(null);
        fetchDishes();
      } else {
        toast.error(data.error?.message || "删除失败");
      }
    } finally {
      setDeleting(false);
    }
  };

  const toggleTag = (tag: string) => {
    const current: string[] = editingDish.tags === "[]" ? [] : JSON.parse(editingDish.tags);
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    setEditingDish({ ...editingDish, tags: JSON.stringify(next) });
  };

  const addSpecRow = () => {
    setEditingDish({
      ...editingDish,
      specs: [...editingDish.specs, { specType: "size", specName: "", priceAdjust: 0, isDefault: false, sortOrder: editingDish.specs.length }],
    });
  };

  const updateSpec = (index: number, field: keyof DishSpec, value: string | number | boolean) => {
    const specs = [...editingDish.specs];
    specs[index] = { ...specs[index], [field]: value };
    setEditingDish({ ...editingDish, specs });
  };

  const removeSpec = (index: number) => {
    setEditingDish({ ...editingDish, specs: editingDish.specs.filter((_, i) => i !== index) });
  };

  const parsedTags = (tags: string): string[] => {
    try { return JSON.parse(tags); } catch { return []; }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <Input
            placeholder="搜索菜品..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { if (v !== null) setCategoryFilter(v) }}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { if (v !== null) setStatusFilter(v) }}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="available">上架中</SelectItem>
            <SelectItem value="unavailable">已下架</SelectItem>
          </SelectContent>
        </Select>
        {isManager && (
          <Button onClick={openCreate} className="ml-auto">
            <Plus size={16} className="mr-1" /> 新增菜品
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">图片</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>标签</TableHead>
              <TableHead className="text-right">销量</TableHead>
              <TableHead className="text-right">库存</TableHead>
              <TableHead>状态</TableHead>
              {isManager && <TableHead className="text-right">操作</TableHead>}
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
            ) : dishes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isManager ? 9 : 8} className="text-center py-8 text-[var(--color-text-muted)]">
                  暂无菜品数据
                </TableCell>
              </TableRow>
            ) : (
              dishes.map((dish) => (
                <TableRow key={dish.id}>
                  <TableCell>
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                      🍽️
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{dish.name}</TableCell>
                  <TableCell>
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {CATEGORY_LABELS[dish.category] || dish.category}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-[var(--color-highlight)]">
                    {formatPrice(dish.price)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {parsedTags(dish.tags).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{dish.salesCount}</TableCell>
                  <TableCell className="text-right">{dish.stock}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-[10px]",
                        dish.isAvailable
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {dish.isAvailable ? "上架" : "下架"}
                    </Badge>
                  </TableCell>
                  {isManager && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(dish)}
                          className="p-1.5 rounded hover:bg-gray-100 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                          aria-label="编辑菜品"
                        >
                          <Pencil size={14} />
                        </button>
                        <Switch
                          checked={dish.isAvailable}
                          onCheckedChange={() => handleToggle(dish)}
                        />
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(dish)}
                            className="p-1.5 rounded hover:bg-red-50 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                            aria-label="删除菜品"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingDish.id ? "编辑菜品" : "新增菜品"}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label>名称 *</Label>
              <Input
                value={editingDish.name}
                onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                placeholder="菜品名称"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>分类 *</Label>
                <Select value={editingDish.category} onValueChange={(v) => { if (v !== null) setEditingDish({ ...editingDish, category: v }) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>子分类</Label>
                <Input
                  value={editingDish.subcategory || ""}
                  onChange={(e) => setEditingDish({ ...editingDish, subcategory: e.target.value })}
                  placeholder="可选"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>价格 *</Label>
                <Input
                  type="number"
                  value={editingDish.price}
                  onChange={(e) => setEditingDish({ ...editingDish, price: parseFloat(e.target.value) || 0 })}
                  min={0}
                  step={0.01}
                />
              </div>
              <div>
                <Label>库存 *</Label>
                <Input
                  type="number"
                  value={editingDish.stock}
                  onChange={(e) => setEditingDish({ ...editingDish, stock: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>
            <div>
              <Label>图片URL *</Label>
              <Input
                value={editingDish.imageUrl}
                onChange={(e) => setEditingDish({ ...editingDish, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>描述</Label>
              <Textarea
                value={editingDish.description || ""}
                onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>辣度</Label>
                <Select value={String(editingDish.spicyLevel)} onValueChange={(v) => { if (v !== null) setEditingDish({ ...editingDish, spicyLevel: parseInt(v) }) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">不辣</SelectItem>
                    <SelectItem value="1">微辣</SelectItem>
                    <SelectItem value="2">中辣</SelectItem>
                    <SelectItem value="3">重辣</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>热量(千卡)</Label>
                <Input
                  type="number"
                  value={editingDish.calories ?? ""}
                  onChange={(e) => setEditingDish({ ...editingDish, calories: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
            </div>
            <div>
              <Label>标签</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {TAG_OPTIONS.map((tag) => {
                  const active = parsedTags(editingDish.tags).includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                        active
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                          : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={editingDish.isRecommended} onCheckedChange={(v) => setEditingDish({ ...editingDish, isRecommended: v })} />
                <Label className="text-sm">推荐</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingDish.isAvailable} onCheckedChange={(v) => setEditingDish({ ...editingDish, isAvailable: v })} />
                <Label className="text-sm">上架</Label>
              </div>
            </div>

            {/* Specs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>规格管理</Label>
                <Button variant="outline" size="sm" onClick={addSpecRow}>
                  <Plus size={14} className="mr-1" /> 添加规格
                </Button>
              </div>
              {editingDish.specs.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)] py-2">暂无规格</p>
              )}
              <div className="space-y-2">
                {editingDish.specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Select value={spec.specType} onValueChange={(v) => { if (v !== null) updateSpec(i, "specType", v) }}>
                      <SelectTrigger className="w-[80px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="size">大小</SelectItem>
                        <SelectItem value="spicy">辣度</SelectItem>
                        <SelectItem value="addon">加料</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={spec.specName}
                      onChange={(e) => updateSpec(i, "specName", e.target.value)}
                      placeholder="规格名"
                      className="h-8 text-xs flex-1"
                    />
                    <Input
                      type="number"
                      value={spec.priceAdjust}
                      onChange={(e) => updateSpec(i, "priceAdjust", parseFloat(e.target.value) || 0)}
                      placeholder="加价"
                      className="h-8 text-xs w-[70px]"
                    />
                    <button onClick={() => removeSpec(i)} className="p-1 hover:bg-red-50 rounded text-[var(--color-error)]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除菜品「{deleteTarget?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
