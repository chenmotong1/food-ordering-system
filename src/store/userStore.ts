import { create } from "zustand";
import type { UserInfo } from "@/types";

interface UserState {
  user: UserInfo | null;
  isLoading: boolean;
}

interface UserActions {
  fetchCurrentUser: () => Promise<void>;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  setUser: (user: UserInfo | null) => void;
}

export const useUserStore = create<UserState & UserActions>()((set) => ({
  user: null,
  isLoading: true,

  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success) {
        set({ user: data.data, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  login: async (username, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        set({ user: data.data });
        return { success: true };
      }
      return {
        success: false,
        message: data.error?.message || "登录失败",
      };
    } catch {
      return { success: false, message: "网络错误，请重试" };
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      set({ user: null });
    }
  },

  setUser: (user) => set({ user }),
}));
