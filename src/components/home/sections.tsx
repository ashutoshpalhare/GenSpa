import { ArrowRight, Calendar, CalendarCheck, Check, CreditCard, Leaf, Shield, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Container, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import type { FeatureIcon, FeatureItem, SiteConfig, StepItem } from "@/shared/site";

type HeroContent = SiteConfig["hero"];
type AboutContent = SiteConfig["about"];

export function HeroSection({ hero }: { hero: HeroContent }) {
  return (
    <section className="relative isolate overflow-hidden bg-forest text-offwhite">
      <Image
        src={hero.imageUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-70"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-forest via-forest/85 to-forest/25" aria-hidden="true" />
      <Container className="flex min-h-[80vh] flex-col justify-center py-24 lg:min-h-[88vh]">
        <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.3em] text-gold">{hero.eyebrow}</p>
        <h1 className="mt-6 max-w-3xl animate-fade-up text-5xl leading-[1.02] text-offwhite sm:text-6xl lg:text-7xl">
          {hero.title}{" "}
          <em className="font-display font-medium italic text-gold">{hero.highlight}</em>
        </h1>
        <p className="mt-7 max-w-xl animate-fade-up text-lg leading-relaxed text-offwhite/85">{hero.subtitle}</p>
        <div className="mt-10 flex animate-fade-up flex-wrap gap-4">
          <a href={hero.primaryCtaHref} className={buttonVariants({ variant: "gold", size: "lg" })}>
            {hero.primaryCtaLabel}
            <ArrowRight aria-hidden="true" />
          </a>
          <a href={hero.secondaryCtaHref} className={buttonVariants({ variant: "outline-light", size: "lg" })}>
            {hero.secondaryCtaLabel}
          </a>
        </div>
        <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-offwhite/20 pt-8">
          {hero.stats.map((stat) => (
            <div key={stat.label}>
              <dd className="font-display text-3xl text-offwhite sm:text-4xl">{stat.value}</dd>
              <dt className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-offwhite/70">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

export function AboutSection({ about }: { about: AboutContent }) {
  return (
    <section id="about" aria-labelledby="about-heading" className="bg-offwhite py-24 sm:py-28">
      <Container className="grid items-center gap-16 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-beige shadow-lift">
          <Image
            src={about.imageUrl}
            alt="A quiet GenSpa treatment room with candlelight and linen"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="space-y-7">
          <SectionHeading eyebrow={about.eyebrow} title={about.title} id="about-heading" />
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="text-lg leading-relaxed text-charcoal-600">
              {paragraph}
            </p>
          ))}
          <ul className="grid gap-4 pt-2 sm:grid-cols-2">
            {about.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-3 text-sm font-medium text-charcoal">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sage-100 text-forest">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

const FEATURE_ICONS: Record<FeatureIcon, typeof Users> = {
  users: Users,
  shield: Shield,
  calendar: Calendar,
  card: CreditCard,
  sparkles: Sparkles,
  leaf: Leaf,
};

export function WhyChooseSection({ features }: { features: FeatureItem[] }) {
  return (
    <section id="why-genspa" aria-labelledby="why-heading" className="bg-beige py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Why GenSpa"
          title="Thoughtful care, from first booking to final breath."
          id="why-heading"
          description="We have rebuilt every step of the spa visit around trust, hygiene and clarity."
        />
        <ul className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = FEATURE_ICONS[feature.icon];
            return (
              <li
                key={feature.title}
                className="group rounded-[1.75rem] bg-offwhite p-8 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="grid size-14 place-items-center rounded-full bg-forest text-gold transition-transform duration-500 group-hover:scale-105">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-2xl">{feature.title}</h3>
                <p className="mt-3 leading-relaxed text-charcoal-600">{feature.description}</p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

export function HowItWorksSection({ steps }: { steps: StepItem[] }) {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="bg-offwhite py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Four calm steps to your next ritual."
          id="how-heading"
        />
        <ol className="mt-16 grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className={cn(
                "relative border-t border-gold/60 pt-8",
                index === 0 && "xl:border-t-gold",
              )}
            >
              <span className="font-display text-5xl text-gold">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-2xl">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-charcoal-600">{step.description}</p>
            </li>
          ))}
        </ol>
        <p className="mt-14 inline-flex items-center gap-2 text-sm font-semibold text-forest">
          <CalendarCheck className="size-4 text-sage" aria-hidden="true" />
          Live availability is checked again at confirmation, so your slot is always secured.
        </p>
      </Container>
    </section>
  );
}

