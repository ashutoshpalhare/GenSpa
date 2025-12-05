import { like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { GET as healthGET } from "@/app/api/health/route";
import { POST as newsletterPOST } from "@/app/api/v1/newsletter/route";
import { GET as servicesGET } from "@/app/api/v1/services/route";
import { GET as siteGET } from "@/app/api/v1/site/route";
import { db, pool } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

const TEST_DOMAIN = "@genspa.test";

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterAll(async () => {
  await db.delete(newsletterSubscribers).where(like(newsletterSubscribers.email, `%${TEST_DOMAIN}`));
  await pool.end();
});

describe("API integration (PostgreSQL)", () => {
  it("reports database connectivity on /api/health", async () => {
    const response = await healthGET();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { success: boolean; data: { database: string } };
    expect(body.success).toBe(true);
    expect(body.data.database).toBe("connected");
  });

  it("subscribes to the newsletter idempotently and validates input", async () => {
    const email = `vitest-${crypto.randomUUID()}${TEST_DOMAIN}`;

    const first = await newsletterPOST(jsonRequest("http://localhost/api/v1/newsletter", { email }));
    expect(first.status).toBe(201);
    expect(((await first.json()) as { data: { status: string } }).data.status).toBe("subscribed");

    const duplicate = await newsletterPOST(jsonRequest("http://localhost/api/v1/newsletter", { email }));
    expect(duplicate.status).toBe(200);
    expect(((await duplicate.json()) as { data: { status: string } }).data.status).toBe("already_subscribed");

    const invalid = await newsletterPOST(jsonRequest("http://localhost/api/v1/newsletter", { email: "bad" }));
    expect(invalid.status).toBe(422);
    const invalidBody = (await invalid.json()) as { success: boolean; errors: Array<{ field: string }> };
    expect(invalidBody.success).toBe(false);
    expect(invalidBody.errors[0]?.field).toBe("email");
  });

  it("returns public site configuration with navigation", async () => {
    const response = await siteGET(new Request("http://localhost/api/v1/site"));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { general: { brandName: string }; navigation: { main: unknown[] } };
    };
    expect(body.data.general.brandName).toBe("GenSpa");
    expect(Array.isArray(body.data.navigation.main)).toBe(true);
  });

  it("lists featured services with pagination metadata", async () => {
    const response = await servicesGET(new Request("http://localhost/api/v1/services?featured=true&pageSize=3"));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { items: unknown[]; pagination: { page: number; pageSize: number } };
    };
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.pageSize).toBe(3);
    expect(body.data.items.length).toBeLessThanOrEqual(3);
  });
});
