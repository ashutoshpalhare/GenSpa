import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { getPublicSiteConfig } from "@/server/site.service";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const config = await getPublicSiteConfig();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-offwhite focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      {config.announcement.enabled ? (
        <AnnouncementBar text={config.announcement.text} href={config.announcement.href} />
      ) : null}
      <Navbar items={config.navigation.main} />
      <main id="main-content">{children}</main>
      <SiteFooter config={config} />
    </>
  );
}
