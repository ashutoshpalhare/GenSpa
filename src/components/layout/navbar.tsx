"use client";

import { Leaf, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/shared/site";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const isLight = tone === "light";
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-10 place-items-center rounded-full bg-forest text-gold">
        <Leaf className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-2xl font-semibold tracking-tight", isLight ? "text-offwhite" : "text-forest")}>
          GenSpa
        </span>
        <span
          className={cn(
            "mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.28em]",
            isLight ? "text-gold" : "text-gold-text",
          )}
        >
          Wellness
        </span>
      </span>
    </span>
  );
}

export function Navbar({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-beige/70 bg-offwhite/90 backdrop-blur-md">
      <nav aria-label="Primary" className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" aria-label="GenSpa home" className="rounded-full">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {items.map((item) => (
            <li key={`${item.label}-${item.url}`}>
              <a
                href={item.url}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                className="text-sm font-semibold text-charcoal/80 transition-colors hover:text-forest"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a href="#services" className={cn(buttonVariants({ variant: "primary", size: "md" }), "hidden sm:inline-flex")}>
            Book a ritual
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            className="grid size-11 place-items-center rounded-full border border-beige bg-white text-forest transition-colors hover:border-sage lg:hidden"
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div id="mobile-nav" className="border-t border-beige bg-offwhite lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
            {items.map((item) => (
              <li key={`mobile-${item.label}-${item.url}`}>
                <a
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-base font-semibold text-charcoal transition-colors hover:bg-beige-100 hover:text-forest"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-3">
              <a
                href="#services"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}
              >
                Book a ritual
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
