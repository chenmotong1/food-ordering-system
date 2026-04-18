// ========== Session ==========
export interface SessionData {
  userId: string;
  username: string;
  role: string;
}

// ========== User ==========
export interface UserInfo {
  id: string;
  username: string;
  phone: string;
  email: string | null;
  avatar: string | null;
  role: string;
  points: number;
  memberLevel: string;
  isVerified: boolean;
}

// ========== Cart ==========
export interface CartSpec {
  specType: string;
  specName: string;
  priceAdjust: number;
}

export interface CartItem {
  dishId: string;
  name: string;
  imageUrl: string;
  price: number; // base price
  quantity: number;
  specs: CartSpec[];
  specSummary: string | null;
  unitPrice: number; // base + spec adjustments
}

// ========== Order ==========
export interface OrderItemInput {
  dishId: string;
  quantity: number;
  specs: CartSpec[];
  comboSelections: string[];
}

export interface OrderCreateInput {
  orderType: "dine_in" | "takeout";
  tableNo?: string;
  items: OrderItemInput[];
  couponCode?: string;
  remark?: string;
}

// ========== API Response ==========
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ========== Dish ==========
export interface DishSpecInfo {
  id: string;
  specType: string;
  specName: string;
  priceAdjust: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface DishWithSpecs {
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
  specs: DishSpecInfo[];
}

// ========== Order ==========
export interface OrderItemInfo {
  id: string;
  dishId: string;
  dishName: string;
  dishImage: string;
  quantity: number;
  unitPrice: number;
  specSummary: string | null;
  subtotal: number;
}

export interface OrderWithItems {
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
  couponId: string | null;
  status: string;
  orderTime: Date;
  estimatedTime: Date;
  completedTime: Date | null;
  remark: string | null;
  items: OrderItemInfo[];
}

// ========== Category ==========
export interface CategoryInfo {
  key: string;
  label: string;
  icon: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: "all", label: "全部", icon: "🍽️" },
  { key: "recommended", label: "热门推荐", icon: "🔥" },
  { key: "beverages", label: "饮料", icon: "🥤" },
  { key: "snacks", label: "小吃", icon: "🍟" },
  { key: "desserts", label: "甜品", icon: "🍰" },
  { key: "main_courses", label: "正餐", icon: "🍚" },
  { key: "stir_fry", label: "炒菜", icon: "🥘" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  beverages: "饮料",
  snacks: "小吃",
  desserts: "甜品",
  main_courses: "正餐",
  stir_fry: "炒菜",
};

export const ORDER_STATUS_MAP: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "已下单", color: "bg-yellow-500" },
  preparing: { label: "制作中", color: "bg-blue-500" },
  ready: { label: "待取餐", color: "bg-orange-500" },
  completed: { label: "已完成", color: "bg-green-500" },
  cancelled: { label: "已取消", color: "bg-gray-500" },
};

export const MEMBER_LEVEL_MAP: Record<string, { label: string; color: string }> = {
  bronze: { label: "铜牌会员", color: "text-amber-700" },
  silver: { label: "银牌会员", color: "text-gray-500" },
  gold: { label: "金牌会员", color: "text-yellow-500" },
};
