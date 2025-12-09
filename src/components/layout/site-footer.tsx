import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { SiteConfig } from "@/shared/site";
import { Logo } from "./navbar";

const SOCIAL_LINKS: Array<{ key: keyof SiteConfig["social"]; label: string }> = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
];

export function SiteFooter({ config }: { config: SiteConfig }) {
  const year = new Date().getFullYear();
  const phoneHref = `tel:${config.contact.phone.replace(/[^+\d]/g, "")}`;

  return (
    <footer id="contact" className="bg-charcoal text-offwhite/85">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div className="space-y-5">
          <Logo tone="light" />
          <p className="max-w-xs text-sm leading-relaxed text-offwhite/75">{config.general.tagline}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.key}>
                <a
                  href={config.social[link.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-offwhite/80 underline-offset-4 transition-colors hover:text-gold hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Explore</h2>
          <ul className="mt-5 space-y-3">
            {config.navigation.footer.map((item) => (
              <li key={`${item.label}-${item.url}`}>
                <a href={item.url} className="text-sm transition-colors hover:text-gold">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Visit & contact</h2>
          <ul className="mt-5 space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <span>{config.contact.address}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <a href={phoneHref} className="transition-colors hover:text-gold">
                {config.contact.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <a href={`mailto:${config.contact.email}`} className="transition-colors hover:text-gold">
                {config.contact.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <span>{config.contact.hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-offwhite/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-offwhite/60 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>
            © {year} {config.general.brandName}. All rights reserved.
          </p>
          <p>Prices in INR · Inclusive of applicable GST</p>
        </div>
      </div>
    </footer>
  );
}
