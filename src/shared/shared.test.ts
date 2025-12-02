import { describe, expect, it } from "vitest";
import { cn, formatDuration } from "@/lib/utils";
import { addMoney, formatINR, fromMinorUnits, percentageOf, toMinorUnits } from "./money";
import { indianPhoneSchema, newsletterSubscribeSchema, passwordSchema } from "./validators";

describe("money", () => {
  it("parses NUMERIC strings into integer paise without drift", () => {
    expect(toMinorUnits("0.10")).toBe(10);
    expect(toMinorUnits("3500.00")).toBe(350000);
    expect(toMinorUnits("19.99") + toMinorUnits("0.01")).toBe(2000);
  });

  it("rejects malformed or over-precise amounts", () => {
    expect(() => toMinorUnits("12.345")).toThrow();
    expect(() => toMinorUnits("abc")).toThrow();
  });

  it("adds amounts exactly", () => {
    expect(addMoney("0.10", "0.20")).toBe("0.30");
    expect(addMoney("1999.99", "0.01")).toBe("2000.00");
    expect(fromMinorUnits(-505)).toBe("-5.05");
  });

  it("rounds percentage discounts half-up to the paisa", () => {
    expect(percentageOf("1000.00", 10)).toBe("100.00");
    expect(percentageOf("0.05", 50)).toBe("0.03");
  });

  it("formats rupees with Indian digit grouping", () => {
    expect(formatINR("3500.00")).toBe("₹3,500");
    expect(formatINR("2999.50")).toBe("₹2,999.50");
  });
});

describe("validators", () => {
  it("normalises and validates newsletter emails", () => {
    const parsed = newsletterSubscribeSchema.parse({ email: "  Guest@Example.COM " });
    expect(parsed.email).toBe("guest@example.com");

    const invalid = newsletterSubscribeSchema.safeParse({ email: "not-an-email" });
    expect(invalid.success).toBe(false);
  });

  it("accepts common Indian mobile formats and normalises them", () => {
    expect(indianPhoneSchema.parse("+91 98765 43210")).toBe("9876543210");
    expect(indianPhoneSchema.parse("09876543210")).toBe("9876543210");
    expect(indianPhoneSchema.safeParse("12345").success).toBe(false);
  });

  it("enforces password complexity", () => {
    expect(passwordSchema.safeParse("weakpass").success).toBe(false);
    expect(passwordSchema.safeParse("StrongPass1").success).toBe(true);
  });
});

describe("utilities", () => {
  it("merges Tailwind classes and resolves conflicts", () => {
    expect(cn("px-2 py-1", false && "hidden", "px-4")).toBe("py-1 px-4");
  });

  it("formats durations for service cards", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(120)).toBe("2 hr");
    expect(formatDuration(90)).toBe("1 hr 30 min");
  });
});
