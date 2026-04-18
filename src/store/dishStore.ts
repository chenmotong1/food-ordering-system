import { create } from "zustand";
import type { DishWithSpecs } from "@/types";

interface DishState {
  dishes: DishWithSpecs[];
  isLoading: boolean;
  selectedCategory: string;
  keyword: string;
  page: number;
  total: number;
  totalPages: number;
}

interface DishActions {
  fetchDishes: () => Promise<void>;
  setCategory: (category: string) => void;
  setKeyword: (keyword: string) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
  getRecommended: () => DishWithSpecs[];
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useDishStore = create<DishState & DishActions>()((set, get) => ({
  dishes: [],
  isLoading: false,
  selectedCategory: "all",
  keyword: "",
  page: 1,
  total: 0,
  totalPages: 0,

  fetchDishes: async () => {
    set({ isLoading: true });
    try {
      const { selectedCategory, keyword, page } = get();
      const params = new URLSearchParams({ page: String(page), limit: "20" });

      if (selectedCategory === "recommended") {
        params.set("isRecommended", "true");
      } else if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }

      const res = await fetch(`/api/dishes?${params}`);
      const data = await res.json();

      if (data.success) {
        set({
          dishes: data.data.items,
          total: data.data.total,
          totalPages: data.data.totalPages,
          isLoading: false,
        });
      } else {
        set({ dishes: [], isLoading: false });
      }
    } catch {
      set({ dishes: [], isLoading: false });
    }
  },

  setCategory: (category) => {
    set({ selectedCategory: category, page: 1 });
    get().fetchDishes();
  },

  setKeyword: (keyword) => {
    set({ keyword });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      set({ page: 1 });
      get().fetchDishes();
    }, 300);
  },

  nextPage: () => {
    const { page, totalPages } = get();
    if (page < totalPages) {
      set({ page: page + 1 });
      get().fetchDishes();
    }
  },

  prevPage: () => {
    const { page } = get();
    if (page > 1) {
      set({ page: page - 1 });
      get().fetchDishes();
    }
  },

  setPage: (page) => {
    set({ page });
    get().fetchDishes();
  },

  getRecommended: () => {
    return get().dishes.filter((d) => d.isRecommended);
  },
}));
