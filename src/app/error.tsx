"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/feedback";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-offwhite px-5 py-24">
      <div className="w-full max-w-xl">
        <ErrorState
          title="We could not load this page"
          description="Please try again. If the problem continues, contact our studio team."
          onRetry={reset}
        />
      </div>
    </main>
  );
}
