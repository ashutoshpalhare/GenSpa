import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { menuItems, menus, settings } from "@/db/schema";
import { SITE_DEFAULTS, SITE_SETTING_KEYS, type NavItem, type SiteConfig, type SiteSettings } from "@/shared/site";

const NAVIGATION_MENUS = {
  main: "main-nav",
  footer: "footer-explore",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function getNavigation(): Promise<SiteConfig["navigation"]> {
  const rows = await db
    .select({
      menuKey: menus.key,
      label: menuItems.label,
      url: menuItems.url,
      openInNewTab: menuItems.openInNewTab,
    })
    .from(menuItems)
    .innerJoin(menus, eq(menuItems.menuId, menus.id))
    .where(and(inArray(menus.key, Object.values(NAVIGATION_MENUS)), eq(menuItems.isActive, true)))
    .orderBy(asc(menus.key), asc(menuItems.sortOrder));

  const toItems = (menuKey: string): NavItem[] =>
    rows
      .filter((row) => row.menuKey === menuKey)
      .map(({ label, url, openInNewTab }) => ({ label, url, openInNewTab }));

  return {
    main: toItems(NAVIGATION_MENUS.main),
    footer: toItems(NAVIGATION_MENUS.footer),
  };
}

/** Public site configuration: DB overrides merged over typed defaults, plus navigation. */
export const getPublicSiteConfig = cache(async (): Promise<SiteConfig> => {
  const keys = SITE_SETTING_KEYS.map((key) => `site.${key}`);
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .where(and(inArray(settings.key, keys), eq(settings.isPublic, true)));

  const stored = new Map(rows.map((row) => [row.key, row.value]));
  const merged: Record<string, unknown> = {};
  for (const key of SITE_SETTING_KEYS) {
    const override = stored.get(`site.${key}`);
    merged[key] = { ...SITE_DEFAULTS[key], ...(isRecord(override) ? override : {}) };
  }

  return {
    ...(merged as unknown as SiteSettings),
    navigation: await getNavigation(),
  };
});
