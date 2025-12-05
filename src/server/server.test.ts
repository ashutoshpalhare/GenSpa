import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseEnv } from "./env";
import { errorResponse, handleRouteError, httpErrors, parseJsonBody, successResponse } from "./http";
import { consumeRateLimit } from "./rate-limit";

describe("environment validation", () => {
  it("requires DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("rejects non-PostgreSQL connection strings", () => {
    expect(() => parseEnv({ DATABASE_URL: "mysql://user:pass@localhost/db" })).toThrow(/PostgreSQL/);
  });

  it("applies safe defaults", () => {
    const env = parseEnv({ DATABASE_URL: "postgresql://user:pass@localhost:5432/db" });
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.TRUST_PROXY).toBe(false);
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });
});

describe("rate limiting", () => {
  it("blocks after the limit within a window and recovers after it", () => {
    const key = `test:${crypto.randomUUID()}`;
    const options = { limit: 2, windowMs: 1000 };
    const start = 1_000_000;

    expect(consumeRateLimit(key, options, start).allowed).toBe(true);
    expect(consumeRateLimit(key, options, start).allowed).toBe(true);

    const blocked = consumeRateLimit(key, options, start + 100);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);

    expect(consumeRateLimit(key, options, start + 1001).allowed).toBe(true);
  });
});

describe("API response envelope", () => {
  it("builds the standard success envelope", async () => {
    const response = successResponse({ id: 1 }, "Done", 201);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true, message: "Done", data: { id: 1 } });
  });

  it("maps schema failures to 422 with field-level errors", async () => {
    const result = z.object({ email: z.email("Enter a valid email address") }).safeParse({ email: "nope" });
    if (result.success) {
      throw new Error("expected validation to fail");
    }

    const response = handleRouteError(result.error, "req-1");
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      success: false,
      message: "Validation failed",
      errors: [{ field: "email", message: "Enter a valid email address" }],
    });
  });

  it("never leaks internal error details for unexpected failures", async () => {
    const response = handleRouteError(new Error("connection string password=secret"), "req-2");
    expect(response.status).toBe(500);
    const body = (await response.json()) as { message: string; requestId?: string };
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(body.requestId).toBe("req-2");
  });

  it("propagates Retry-After for throttled requests", async () => {
    const response = handleRouteError(httpErrors.tooManyRequests("Slow down", 30), "req-3");
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
  });

  it("returns 400 for malformed JSON bodies", async () => {
    const request = new Request("http://localhost/api/test", { method: "POST", body: "{bad json" });
    await expect(parseJsonBody(request, z.object({}))).rejects.toMatchObject({ statusCode: 400 });
  });

  it("builds error envelopes with optional request IDs", async () => {
    const response = errorResponse(404, "Missing", [], { requestId: "abc" });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ success: false, message: "Missing", errors: [], requestId: "abc" });
  });
});
