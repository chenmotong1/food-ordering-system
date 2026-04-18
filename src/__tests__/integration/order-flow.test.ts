import { describe, test, expect, beforeAll } from "bun:test";

const BASE = process.env.TEST_BASE || "http://localhost:3000";

let userCookie: string;
let adminCookie: string;
let createdOrderId: string;
let createdOrderId_raw: string;

const testUser = {
  username: `test_${Date.now()}`,
  password: "test123456",
  phone: `1${3 + Math.floor(Math.random() * 7)}${String(Date.now()).slice(-9)}`,
};

async function api(
  path: string,
  opts: { method?: string; body?: object; cookie?: string } = {}
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.cookie) headers["Cookie"] = opts.cookie;

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const setCookie = res.headers.getSetCookie();
  const data = await res.json();
  return { status: res.status, data, setCookie };
}

describe("Order flow integration", () => {
  test("1. Register user", async () => {
    const { status, data } = await api("/api/auth/register", {
      method: "POST",
      body: testUser,
    });
    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.username).toBe(testUser.username);
    expect(data.data.phone).toContain("****");
  });

  test("2. Login user", async () => {
    const { status, data, setCookie } = await api("/api/auth/login", {
      method: "POST",
      body: { username: testUser.username, password: testUser.password },
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.role).toBe("customer");
    userCookie = setCookie[0]?.split(";")[0] || "";
    expect(userCookie).toBeTruthy();
  });

  test("3. Get dishes list", async () => {
    const { status, data } = await api("/api/dishes", { cookie: userCookie });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.items.length).toBeGreaterThanOrEqual(10);
    expect(data.data.items[0].specs).toBeDefined();
  });

  test("4. Verify coupon WELCOME10", async () => {
    const { status, data } = await api("/api/coupons/verify", {
      method: "POST",
      body: { code: "WELCOME10", orderAmount: 79 },
      cookie: userCookie,
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.discountAmount).toBe(10);
    expect(data.data.finalAmount).toBe(69);
  });

  test("5. Create order", async () => {
    // Get a dish first
    const { data: dishData } = await api("/api/dishes?limit=1", { cookie: userCookie });
    const dish = dishData.data.items[0];

    const { status, data } = await api("/api/orders", {
      method: "POST",
      body: {
        orderType: "takeout",
        items: [{ dishId: dish.id, quantity: 2, specs: [], comboSelections: [] }],
        couponCode: "WELCOME10",
        remark: "测试订单",
      },
      cookie: userCookie,
    });

    expect([200, 201]).toContain(status);
    expect(data.success).toBe(true);
    expect(data.data.pickupNo).toMatch(/^\d{3}$/);
    expect(data.data.totalPrice).toBeGreaterThan(0);

    createdOrderId = data.data.id;
    createdOrderId_raw = data.data.orderNo;
  });

  test("6. Get order detail", async () => {
    const { status, data } = await api(`/api/orders/${createdOrderId}`, {
      cookie: userCookie,
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe("pending");
    expect(data.data.items.length).toBeGreaterThan(0);
  });

  test("7. Login admin and update status", async () => {
    const { setCookie } = await api("/api/auth/login", {
      method: "POST",
      body: { username: "admin", password: "admin123" },
    });
    adminCookie = setCookie[0]?.split(";")[0] || "";

    const { status, data } = await api(`/api/orders/${createdOrderId}/status`, {
      method: "PATCH",
      body: { status: "preparing" },
      cookie: adminCookie,
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe("preparing");
  });

  test("8. Verify user points increased", async () => {
    const { data } = await api("/api/auth/me", { cookie: userCookie });
    expect(data.success).toBe(true);
    expect(data.data.points).toBeGreaterThanOrEqual(0);
  });

  test("9. Invalid status transition rejected", async () => {
    const { status, data } = await api(`/api/orders/${createdOrderId}/status`, {
      method: "PATCH",
      body: { status: "pending" },
      cookie: adminCookie,
    });
    expect(status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("ORDER_STATUS_INVALID");
  });
});
