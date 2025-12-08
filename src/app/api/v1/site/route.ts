import { apiHandler, successResponse } from "@/server/http";
import { getPublicSiteConfig } from "@/server/site.service";

export const dynamic = "force-dynamic";

/** GET /api/v1/site - public branding, homepage content, contact details and navigation. */
export const GET = apiHandler(async () => {
  const config = await getPublicSiteConfig();
  return successResponse(config, "Site configuration retrieved");
});
