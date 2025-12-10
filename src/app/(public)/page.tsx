import type { Metadata } from "next";
import { NewsletterCta } from "@/components/home/newsletter-cta";
import { FeaturedServices } from "@/components/home/featured-services";
import { AboutSection, HeroSection, HowItWorksSection, WhyChooseSection } from "@/components/home/sections";
import { listPublicServices } from "@/server/catalog.service";
import { getPublicSiteConfig } from "@/server/site.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Premium Spa & Wellness in India",
  description:
    "Signature spa rituals, certified therapists and real-time booking across GenSpa studios in Mumbai, Bengaluru and New Delhi.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [config, featured] = await Promise.all([
    getPublicSiteConfig(),
    listPublicServices({ featured: true, page: 1, pageSize: 6 }),
  ]);

  return (
    <>
      <HeroSection hero={config.hero} />
      <AboutSection about={config.about} />
      <FeaturedServices services={featured.items} />
      <WhyChooseSection features={config.homepage.features} />
      <HowItWorksSection steps={config.homepage.steps} />
      <NewsletterCta title={config.homepage.newsletterTitle} body={config.homepage.newsletterBody} />
    </>
  );
}
