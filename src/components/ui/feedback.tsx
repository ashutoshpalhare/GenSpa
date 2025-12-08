import { AlertTriangle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-2xl bg-beige/70", className)} />;
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center gap-4 rounded-[1.75rem] border border-dashed border-sage/50 bg-beige-100/70 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-white text-sage shadow-soft">
        {icon ?? <Inbox className="size-6" aria-hidden="true" />}
      </span>
      <div className="space-y-2">
        <h3 className="text-2xl">{title}</h3>
        <p className="max-w-md text-charcoal-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-red-900/15 bg-white px-6 py-12 text-center shadow-soft"
    >
      <span className="grid size-14 place-items-center rounded-full bg-red-50 text-red-800">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h3 className="text-2xl">{title}</h3>
        <p className="max-w-md text-charcoal-600">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
