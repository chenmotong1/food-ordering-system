import { describe, test, expect } from "bun:test";

// Coupon calculation logic (mirrors server-side verify logic)
function calcCouponDiscount(
  coupon: {
    type: string;
    value: number;
    minOrderAmount: number;
    maxDiscount: number | null;
    isActive: boolean;
    totalCount: number;
    usedCount: number;
    startAt: string;
    expireAt: string;
  },
  orderAmount: number
): { discount: number; error?: string } {
  if (!coupon.isActive) return { discount: 0, error: "COUPON_INACTIVE" };

  const now = new Date();
  if (new Date(coupon.expireAt) < now) return { discount: 0, error: "COUPON_EXPIRED" };
  if (new Date(coupon.startAt) > now) return { discount: 0, error: "COUPON_EXPIRED" };
  if (coupon.totalCount !== -1 && coupon.usedCount >= coupon.totalCount)
    return { discount: 0, error: "COUPON_USED_UP" };
  if (orderAmount < coupon.minOrderAmount)
    return { discount: 0, error: "COUPON_MIN_AMOUNT" };

  let discount: number;
  if (coupon.type === "fixed") {
    discount = coupon.value;
  } else if (coupon.type === "percent") {
    discount = orderAmount * (1 - coupon.value);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    return { discount: 0, error: "INVALID_TYPE" };
  }

  if (discount > orderAmount) discount = orderAmount;
  return { discount: Math.round(discount * 100) / 100 };
}

const futureDate = new Date(Date.now() + 30 * 86400000).toISOString();
const pastDate = new Date(Date.now() - 30 * 86400000).toISOString();

describe("Coupon calculation - fixed type", () => {
  const coupon = {
    type: "fixed",
    value: 10,
    minOrderAmount: 50,
    maxDiscount: null,
    isActive: true,
    totalCount: 100,
    usedCount: 0,
    startAt: pastDate,
    expireAt: futureDate,
  };

  test("applies fixed discount when min amount met", () => {
    const result = calcCouponDiscount(coupon, 79);
    expect(result.discount).toBe(10);
    expect(result.error).toBeUndefined();
  });

  test("rejects when below min order amount", () => {
    const result = calcCouponDiscount(coupon, 49);
    expect(result.discount).toBe(0);
    expect(result.error).toBe("COUPON_MIN_AMOUNT");
  });

  test("discount capped at order amount", () => {
    const smallCoupon = { ...coupon, value: 100 };
    const result = calcCouponDiscount(smallCoupon, 50);
    expect(result.discount).toBe(50);
  });
});

describe("Coupon calculation - percent type", () => {
  const coupon = {
    type: "percent",
    value: 0.9, // 10% off
    minOrderAmount: 0,
    maxDiscount: 20,
    isActive: true,
    totalCount: -1,
    usedCount: 0,
    startAt: pastDate,
    expireAt: futureDate,
  };

  test("applies percent discount", () => {
    const result = calcCouponDiscount(coupon, 100);
    expect(result.discount).toBe(10); // 100 * 0.1
  });

  test("respects maxDiscount cap", () => {
    const result = calcCouponDiscount(coupon, 500);
    expect(result.discount).toBe(20); // capped at 20
  });

  test("no cap when maxDiscount is null", () => {
    const noCap = { ...coupon, maxDiscount: null as number | null };
    const result = calcCouponDiscount(noCap, 500);
    expect(result.discount).toBe(50);
  });
});

describe("Coupon validation - status checks", () => {
  const base = {
    type: "fixed",
    value: 10,
    minOrderAmount: 0,
    maxDiscount: null,
    isActive: true,
    totalCount: -1,
    usedCount: 0,
    startAt: pastDate,
    expireAt: futureDate,
  };

  test("inactive coupon rejected", () => {
    const result = calcCouponDiscount({ ...base, isActive: false }, 100);
    expect(result.error).toBe("COUPON_INACTIVE");
  });

  test("expired coupon rejected", () => {
    const result = calcCouponDiscount({ ...base, expireAt: pastDate }, 100);
    expect(result.error).toBe("COUPON_EXPIRED");
  });

  test("used up coupon rejected", () => {
    const result = calcCouponDiscount({ ...base, totalCount: 100, usedCount: 100 }, 100);
    expect(result.error).toBe("COUPON_USED_UP");
  });

  test("unlimited coupon (totalCount=-1) always available", () => {
    const result = calcCouponDiscount({ ...base, totalCount: -1, usedCount: 99999 }, 100);
    expect(result.error).toBeUndefined();
    expect(result.discount).toBe(10);
  });
});
