import { sql } from "drizzle-orm";
import { db } from "@/db";
import { errorResponse, successResponse } from "@/server/http";

export const dynamic = "force-dynamic";

const startedAt = Date.now();

/** Liveness + database readiness. Returns 503 when PostgreSQL cannot be reached. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return successResponse(
      {
        status: "ok",
        database: "connected",
        environment: process.env.NODE_ENV ?? "development",
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        timestamp: new Date().toISOString(),
      },
      "Service healthy",
    );
  } catch {
    return errorResponse(503, "Database unavailable", [{ field: "database", message: "Connection check failed" }]);
  }
}
