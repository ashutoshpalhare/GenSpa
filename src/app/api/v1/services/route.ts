import { z } from "zod";
import { listPublicServices } from "@/server/catalog.service";
import { apiHandler, successResponse } from "@/server/http";

export const dynamic = "force-dynamic";

const listQuerySchema = z.object({
  featured: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

/** GET /api/v1/services?featured=true&page=1&pageSize=12 */
export const GET = apiHandler(async (request) => {
  const query = listQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const result = await listPublicServices({
    featured: query.featured === "true",
    page: query.page,
    pageSize: query.pageSize,
  });
  return successResponse(result, "Services retrieved");
});
