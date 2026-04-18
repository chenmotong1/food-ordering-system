import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  orderType: "dine_in" | "takeout" | null;
  tableNo: string | null;
  couponCode: string | null;
  couponId: string | null;
  discountAmount: number;
}

interface CartActions {
  totalItems: () => number;
  originalPrice: () => number;
  finalPrice: () => number;
  setOrderType: (type: "dine_in" | "takeout", tableNo?: string) => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (
    dishId: string,
    specSummary: string | null,
    quantity: number
  ) => void;
  deleteItem: (dishId: string, specSummary: string | null) => void;
  clearCart: () => void;
  applyCoupon: (
    code: string
  ) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: null,
      tableNo: null,
      couponCode: null,
      couponId: null,
      discountAmount: 0,

      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      originalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );
      },

      finalPrice: () => {
        return get().originalPrice() - get().discountAmount;
      },

      setOrderType: (type, tableNo) => {
        set({
          orderType: type,
          tableNo: type === "dine_in" ? tableNo || null : null,
        });
      },

      addItem: (item) => {
        const { items } = get();
        const key = `${item.dishId}-${item.specSummary || ""}`;

        const existingIndex = items.findIndex(
          (i) => `${i.dishId}-${i.specSummary || ""}` === key
        );

        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + item.quantity,
          };
          set({ items: newItems });
        } else {
          set({ items: [...items, item] });
        }
      },

      updateQuantity: (dishId, specSummary, quantity) => {
        if (quantity <= 0) {
          get().deleteItem(dishId, specSummary);
          return;
        }
        const { items } = get();
        const key = `${dishId}-${specSummary || ""}`;
        set({
          items: items.map((i) =>
            `${i.dishId}-${i.specSummary || ""}` === key
              ? { ...i, quantity }
              : i
          ),
        });
      },

      deleteItem: (dishId, specSummary) => {
        const { items } = get();
        const key = `${dishId}-${specSummary || ""}`;
        set({ items: items.filter((i) => `${i.dishId}-${i.specSummary || ""}` !== key) });
      },

      clearCart: () => {
        set({
          items: [],
          orderType: null,
          tableNo: null,
          couponCode: null,
          couponId: null,
          discountAmount: 0,
        });
      },

      applyCoupon: async (code) => {
        try {
          const originalPrice = get().originalPrice();
          const res = await fetch("/api/coupons/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, orderAmount: originalPrice }),
          });
          const data = await res.json();

          if (data.success) {
            set({
              couponCode: code,
              couponId: data.data.couponId,
              discountAmount: data.data.discountAmount,
            });
            return {
              success: true,
              message: `已优惠 ¥${data.data.discountAmount.toFixed(2)}（${data.data.name}）`,
            };
          }
          return {
            success: false,
            message: data.error?.message || "优惠券无效",
          };
        } catch {
          return { success: false, message: "网络错误，请重试" };
        }
      },

      removeCoupon: () => {
        set({ couponCode: null, couponId: null, discountAmount: 0 });
      },
    }),
    {
      name: "food-cart-v1",
      partialize: (state) => ({
        items: state.items,
        orderType: state.orderType,
        tableNo: state.tableNo,
      }),
    }
  )
);
