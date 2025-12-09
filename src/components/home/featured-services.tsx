import { Clock } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Container, SectionHeading } from "@/components/ui/section";
import { formatDuration } from "@/lib/utils";
import { formatINR } from "@/shared/money";
import type { ServiceCard } from "@/shared/site";

export function FeaturedServices({ services }: { services: ServiceCard[] }) {
  return (
    <section id="services" aria-labelledby="services-heading" className="bg-offwhite py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Signature rituals"
          title="Curated treatments, crafted by hand."
          id="services-heading"
          description="Every ritual is designed by our lead therapists and can be personalised during your consultation."
        />

        {services.length === 0 ? (
          <div className="mt-14">
            <EmptyState
              title="Rituals are being prepared"
              description="Our signature menu will appear here shortly. Please check back soon."
            />
          </div>
        ) : (
          <ul className="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <li key={service.id}>
                <ServiceCardItem service={service} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

function ServiceCardItem({ service }: { service: ServiceCard }) {
  const hasDiscount = service.discountPrice !== null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-beige bg-white shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-beige">
        {service.featuredImageUrl ? (
          <Image
            src={service.featuredImageUrl}
            alt={service.name}
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
        {service.categoryName ? (
          <span className="absolute left-4 top-4">
            <Badge tone="forest">{service.categoryName}</Badge>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-7">
        <div className="space-y-2">
          <h3 className="text-2xl leading-snug">{service.name}</h3>
          {service.shortDescription ? (
            <p className="text-sm leading-relaxed text-charcoal-600">{service.shortDescription}</p>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-beige pt-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal-600">
            <Clock className="size-4 text-sage" aria-hidden="true" />
            {formatDuration(service.durationMinutes)}
          </p>
          <p className="text-right">
            {hasDiscount ? (
              <span className="block text-xs text-charcoal-600 line-through">{formatINR(service.price)}</span>
            ) : null}
            <span className="font-display text-2xl text-forest">
              {formatINR(service.discountPrice ?? service.price)}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}
