import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10", className)}>{children}</div>;
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({ eyebrow, title, description, id, align = "left", className }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl space-y-5", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-text">{eyebrow}</p>
      ) : null}
      <h2 id={id} className="text-4xl leading-[1.1] sm:text-5xl">
        {title}
      </h2>
      {description ? <p className="text-lg leading-relaxed text-charcoal-600">{description}</p> : null}
    </div>
  );
}
