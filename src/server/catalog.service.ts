import "server-only";

import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { serviceCategories, services } from "@/db/schema";
import type { Paginated, PaginationMeta } from "@/shared/api";
import type { ServiceCard } from "@/shared/site";

export interface ListPublicServicesOptions {
  featured?: boolean;
  page: number;
  pageSize: number;
}

/** Lists active, non-deleted services. Used by both REST handlers and server components. */
export async function listPublicServices(options: ListPublicServicesOptions): Promise<Paginated<ServiceCard>> {
  const conditions = [isNull(services.deletedAt), eq(services.status, "ACTIVE")];
  if (options.featured) {
    conditions.push(eq(services.isFeatured, true));
  }
  const where = and(...conditions);

  const [totalRow] = await db.select({ total: count() }).from(services).where(where);
  const total = Number(totalRow?.total ?? 0);

  const rows = await db
    .select({
      id: services.id,
      slug: services.slug,
      name: services.name,
      shortDescription: services.shortDescription,
      categoryName: serviceCategories.name,
      durationMinutes: services.durationMinutes,
      price: services.price,
      discountPrice: services.discountPrice,
      featuredImageUrl: services.featuredImageUrl,
      isFeatured: services.isFeatured,
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(where)
    .orderBy(asc(services.sortOrder), asc(services.name))
    .limit(options.pageSize)
    .offset((options.page - 1) * options.pageSize);

  const pagination: PaginationMeta = {
    page: options.page,
    pageSize: options.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / options.pageSize)),
  };

  return { items: rows, pagination };
}
