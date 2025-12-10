import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-offwhite px-5 py-24">
      <Container className="max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-text">Error 404</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">This retreat is not here.</h1>
        <p className="mt-5 text-lg leading-relaxed text-charcoal-600">
          The page you were looking for may have moved. Let us guide you back to stillness.
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-10")}>
          Return home
        </Link>
      </Container>
    </main>
  );
}
