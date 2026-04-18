import { describe, test, expect } from "bun:test";
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("hashPassword + verifyPassword", () => {
  test("correct password verifies", async () => {
    const hash = await hashPassword("test123");
    expect(hash).toBeTruthy();
    expect(hash).not.toBe("test123");
    const result = await verifyPassword("test123", hash);
    expect(result).toBe(true);
  });

  test("wrong password fails", async () => {
    const hash = await hashPassword("test123");
    const result = await verifyPassword("wrongpassword", hash);
    expect(result).toBe(false);
  });

  test("different passwords produce different hashes", async () => {
    const hash1 = await hashPassword("password1");
    const hash2 = await hashPassword("password2");
    expect(hash1).not.toBe(hash2);
  });

  test("same password produces different hashes (salt)", async () => {
    const hash1 = await hashPassword("samepass");
    const hash2 = await hashPassword("samepass");
    expect(hash1).not.toBe(hash2);
  });

  test("empty string password", async () => {
    const hash = await hashPassword("");
    const result = await verifyPassword("", hash);
    expect(result).toBe(true);
  });
});
