import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ========== Response Helpers ==========

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  code: string,
  status = 400
) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

// ========== Order Helpers ==========

export async function generateOrderNo(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNo: { startsWith: `ORD-${dateStr}-` },
    },
    orderBy: { orderNo: "desc" },
    select: { orderNo: true },
  });

  let seq = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNo.split("-").pop() || "0", 10);
    seq = lastSeq + 1;
  }

  return `ORD-${dateStr}-${seq.toString().padStart(3, "0")}`;
}

export async function generatePickupNo(): Promise<string> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const lastOrder = await prisma.order.findFirst({
    where: { orderTime: { gte: todayStart } },
    orderBy: { pickupNo: "desc" },
    select: { pickupNo: true },
  });

  let num = 100;
  if (lastOrder) {
    num = parseInt(lastOrder.pickupNo, 10) + 1;
  }

  if (num > 999) num = 100;

  return num.toString();
}

export function calcEstimatedTime(totalQuantity: number): Date {
  const minutes = 10 + totalQuantity * 2;
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function calcPointsEarned(
  totalPrice: number,
  memberLevel?: string
): number {
  const base = Math.floor(totalPrice);
  if (memberLevel === "gold") return Math.floor(base * 1.5);
  return base;
}

export function getMemberLevel(points: number): string {
  if (points >= 5000) return "gold";
  if (points >= 1000) return "silver";
  return "bronze";
}

// ========== Formatting ==========

export function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(7);
}

export function formatPrice(price: number | undefined | null): string {
  return `¥${(price ?? 0).toFixed(2)}`;
}

// ========== Validation ==========

export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

export function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

// ========== Client IP ==========

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
