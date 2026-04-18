"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { DishWithSpecs, DishSpecInfo } from "@/types";
import { useCartStore } from "@/store/cartStore";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface DishModalProps {
  dish: DishWithSpecs;
  onClose: () => void;
}

export default function DishModal({ dish, onClose }: DishModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>(
    {}
  );
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>(
    {}
  );
  const addItem = useCartStore((s) => s.addItem);

  // 按类型分组 specs
  const specGroups = useMemo(() => {
    const groups: Record<string, DishSpecInfo[]> = {};
    for (const spec of dish.specs || []) {
      if (!groups[spec.specType]) groups[spec.specType] = [];
      groups[spec.specType].push(spec);
    }
    return groups;
  }, [dish.specs]);

  const specTypeLabels: Record<string, string> = {
    size: "规格",
    spicy: "辣度",
    temperature: "温度",
    addon: "加料",
  };

  // 计算价格
  const unitPrice = useMemo(() => {
    let price = dish.price;
    for (const specs of Object.values(specGroups)) {
      for (const spec of specs) {
        if (selectedSpecs[spec.specType] === spec.id) {
          price += spec.priceAdjust;
        }
      }
    }
    for (const spec of dish.specs || []) {
      if (selectedAddons[spec.id] && spec.specType === "addon") {
        price += spec.priceAdjust;
      }
    }
    return price;
  }, [dish.price, dish.specs, specGroups, selectedSpecs, selectedAddons]);

  const handleAdd = () => {
    const specParts: string[] = [];
    const selectedSpecObjs: { specType: string; specName: string; priceAdjust: number }[] = [];

    for (const [type, specs] of Object.entries(specGroups)) {
      if (type === "addon") continue;
      const selectedId = selectedSpecs[type];
      const spec = specs.find((s) => s.id === selectedId);
      if (spec) {
        specParts.push(spec.specName);
        selectedSpecObjs.push({
          specType: spec.specType,
          specName: spec.specName,
          priceAdjust: spec.priceAdjust,
        });
      }
    }

    // 加料
    for (const spec of dish.specs || []) {
      if (spec.specType === "addon" && selectedAddons[spec.id]) {
        specParts.push(spec.specName);
        selectedSpecObjs.push({
          specType: spec.specType,
          specName: spec.specName,
          priceAdjust: spec.priceAdjust,
        });
      }
    }

    addItem({
      dishId: dish.id,
      name: dish.name,
      imageUrl: dish.imageUrl,
      price: dish.price,
      quantity,
      specs: selectedSpecObjs,
      specSummary: specParts.join(" / ") || null,
      unitPrice,
    });
    toast.success("已加入购物车");
    onClose();
  };

  const tags = (() => {
    try {
      return JSON.parse(dish.tags || "[]");
    } catch {
      return [];
    }
  })();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogTitle className="sr-only">{dish.name}</DialogTitle>

        {/* 菜品大图 */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[var(--color-bg)]">
          <Image
            src={dish.imageUrl}
            alt={dish.name}
            fill
            className="object-cover"
          />
          {tags.length > 0 && (
            <div className="absolute left-2 top-2 flex gap-1">
              {tags.slice(0, 3).map((tag: string, i: number) => (
                <span
                  key={i}
                  className="rounded-md bg-[var(--color-accent)] px-2 py-0.5 text-xs font-bold text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 名称和价格 */}
        <div className="mt-3">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {dish.name}
          </h2>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-2xl font-bold text-[var(--color-primary)]">
              ¥{unitPrice.toFixed(2)}
            </span>
            {unitPrice !== dish.price && (
              <span className="text-sm text-[var(--color-text-muted)] line-through">
                ¥{dish.price.toFixed(2)}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
            {dish.calories && <span>{dish.calories} kcal</span>}
            {dish.spicyLevel > 0 && (
              <span>
                {Array.from({ length: dish.spicyLevel }).map((_, i) => (
                  <span key={i}>🌶️</span>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* 规格选择区 */}
        {Object.entries(specGroups).map(([type, specs]) => {
          if (type === "addon") return null;
          return (
            <div key={type} className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
                {specTypeLabels[type] || type}
              </h3>
              <RadioGroup
                value={selectedSpecs[type] || ""}
                onValueChange={(val) =>
                  setSelectedSpecs((prev) => ({ ...prev, [type]: val }))
                }
                className="flex flex-wrap gap-2"
              >
                {specs.map((spec) => (
                  <div key={spec.id}>
                    <RadioGroupItem
                      value={spec.id}
                      id={spec.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={spec.id}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm transition-colors peer-data-[state=checked]:border-[var(--color-primary)] peer-data-[state=checked]:bg-[var(--color-primary)]/10 peer-data-[state=checked]:text-[var(--color-primary)]"
                    >
                      {spec.specName}
                      {spec.priceAdjust > 0 && (
                        <span className="text-[var(--color-text-muted)]">
                          +¥{spec.priceAdjust}
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          );
        })}

        {/* 加料多选 */}
        {specGroups["addon"] && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
              加料（可多选）
            </h3>
            <div className="flex flex-wrap gap-2">
              {specGroups["addon"].map((spec) => (
                <div key={spec.id} className="flex items-center gap-2">
                  <Checkbox
                    id={spec.id}
                    checked={!!selectedAddons[spec.id]}
                    onCheckedChange={(checked) =>
                      setSelectedAddons((prev) => ({
                        ...prev,
                        [spec.id]: !!checked,
                      }))
                    }
                  />
                  <Label
                    htmlFor={spec.id}
                    className="cursor-pointer text-sm"
                  >
                    {spec.specName}
                    {spec.priceAdjust > 0 && (
                      <span className="ml-1 text-[var(--color-text-muted)]">
                        +¥{spec.priceAdjust}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 数量选择 */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            数量
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2rem] text-center text-lg font-bold">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 加入购物车按钮 */}
        <Button
          onClick={handleAdd}
          className="mt-4 min-h-12 w-full bg-[var(--color-primary)] text-base font-bold text-white hover:bg-[var(--color-primary-dark)]"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          加入购物车 ¥{(unitPrice * quantity).toFixed(2)}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
