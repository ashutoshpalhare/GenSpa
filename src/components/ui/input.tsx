import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  invalid = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-12 w-full rounded-full border bg-white px-5 text-base text-charcoal placeholder:text-charcoal-600/60 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-60",
        invalid ? "border-red-700/70" : "border-beige hover:border-sage",
        className,
      )}
      {...props}
    />
  );
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

/** Label, control slot and accessible error/hint text. */
export function FormField({ id, label, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-charcoal">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-charcoal-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
