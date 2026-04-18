import { describe, test, expect } from "bun:test";
import {
  calcEstimatedTime,
  calcPointsEarned,
  getMemberLevel,
  maskPhone,
  validatePhone,
  formatPrice,
} from "@/lib/utils";

describe("calcEstimatedTime", () => {
  test("returns 10min base for 0 items", () => {
    const result = calcEstimatedTime(0);
    const diff = (result.getTime() - Date.now()) / 60000;
    expect(diff).toBeGreaterThanOrEqual(9.9);
    expect(diff).toBeLessThan(10.1);
  });

  test("adds 2min per item", () => {
    const result = calcEstimatedTime(5);
    const diff = (result.getTime() - Date.now()) / 60000;
    expect(diff).toBeGreaterThanOrEqual(19.9);
    expect(diff).toBeLessThan(20.1);
  });

  test("single item gives 12min", () => {
    const result = calcEstimatedTime(1);
    const diff = (result.getTime() - Date.now()) / 60000;
    expect(diff).toBeGreaterThanOrEqual(11.9);
    expect(diff).toBeLessThan(12.1);
  });
});

describe("calcPointsEarned", () => {
  test("0 price gives 0 points", () => {
    expect(calcPointsEarned(0)).toBe(0);
  });

  test("1.0 price gives 1 point", () => {
    expect(calcPointsEarned(1.0)).toBe(1);
  });

  test("1.9 price floors to 1 point", () => {
    expect(calcPointsEarned(1.9)).toBe(1);
  });

  test("2.0 price gives 2 points", () => {
    expect(calcPointsEarned(2.0)).toBe(2);
  });

  test("1000 price gives 1000 points", () => {
    expect(calcPointsEarned(1000)).toBe(1000);
  });

  test("gold member gets 1.5x points", () => {
    expect(calcPointsEarned(100, "gold")).toBe(150);
  });

  test("non-gold member gets base points", () => {
    expect(calcPointsEarned(100, "silver")).toBe(100);
    expect(calcPointsEarned(100, "bronze")).toBe(100);
  });
});

describe("getMemberLevel", () => {
  test("0 points → bronze", () => {
    expect(getMemberLevel(0)).toBe("bronze");
  });

  test("999 points → bronze", () => {
    expect(getMemberLevel(999)).toBe("bronze");
  });

  test("1000 points → silver", () => {
    expect(getMemberLevel(1000)).toBe("silver");
  });

  test("4999 points → silver", () => {
    expect(getMemberLevel(4999)).toBe("silver");
  });

  test("5000 points → gold", () => {
    expect(getMemberLevel(5000)).toBe("gold");
  });

  test("10000 points → gold", () => {
    expect(getMemberLevel(10000)).toBe("gold");
  });
});

describe("maskPhone", () => {
  test("masks 11-digit phone", () => {
    expect(maskPhone("13800138000")).toBe("138****8000");
  });

  test("returns unchanged for short string", () => {
    expect(maskPhone("12345")).toBe("12345");
  });

  test("returns unchanged for long string", () => {
    expect(maskPhone("12345678901234")).toBe("12345678901234");
  });
});

describe("validatePhone", () => {
  test("valid phones", () => {
    expect(validatePhone("13800138000")).toBe(true);
    expect(validatePhone("15012345678")).toBe(true);
    expect(validatePhone("19900001111")).toBe(true);
  });

  test("invalid phones", () => {
    expect(validatePhone("12345678901")).toBe(false); // starts with 12
    expect(validatePhone("1380013800")).toBe(false);  // 10 digits
    expect(validatePhone("138001380000")).toBe(false); // 12 digits
    expect(validatePhone("abc00138000")).toBe(false);  // non-digits
    expect(validatePhone("")).toBe(false);
  });
});

describe("formatPrice", () => {
  test("formats with 2 decimal places", () => {
    expect(formatPrice(28)).toBe("¥28.00");
    expect(formatPrice(28.5)).toBe("¥28.50");
    expect(formatPrice(0)).toBe("¥0.00");
  });
});
