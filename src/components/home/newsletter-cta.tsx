"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";
import { Container } from "@/components/ui/section";
import { useNewsletterSubscribe } from "@/hooks/use-newsletter-subscribe";
import { ApiClientError } from "@/services/api-client";
import { newsletterSubscribeSchema, type NewsletterSubscribeInput } from "@/shared/validators";

export function NewsletterCta({ title, body }: { title: string; body: string }) {
  const mutation = useNewsletterSubscribe();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterSubscribeInput>({
    resolver: zodResolver(newsletterSubscribeSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values.email);
      reset();
    } catch (error) {
      if (error instanceof ApiClientError) {
        for (const fieldError of error.fieldErrors) {
          if (fieldError.field === "email") {
            setError("email", { type: "server", message: fieldError.message });
          }
        }
      }
    }
  });

  const isBusy = isSubmitting || mutation.isPending;
  const emailError = errors.email?.message;

  return (
    <section id="newsletter" aria-labelledby="newsletter-heading" className="bg-forest py-24 text-offwhite sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Stay in the calm</p>
          <h2 id="newsletter-heading" className="text-4xl leading-[1.1] text-offwhite sm:text-5xl">
            {title}
          </h2>
          <p className="max-w-lg text-lg leading-relaxed text-offwhite/80">{body}</p>
        </div>

        {mutation.isSuccess ? (
          <div
            role="status"
            className="flex items-start gap-4 rounded-[1.75rem] border border-gold/40 bg-forest-700/60 p-8"
          >
            <CircleCheck className="mt-0.5 size-7 shrink-0 text-gold" aria-hidden="true" />
            <div className="space-y-2">
              <p className="font-display text-2xl text-offwhite">Thank you for joining us.</p>
              <p className="text-offwhite/80">{mutation.data.message}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="rounded-[1.75rem] bg-offwhite/5 p-6 sm:p-8">
            <FormField id="newsletter-email" label="Email address" error={emailError} className="text-offwhite">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="newsletter-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "newsletter-email-error" : undefined}
                  disabled={isBusy}
                  {...register("email")}
                />
                <Button type="submit" variant="gold" size="lg" loading={isBusy} className="shrink-0">
                  {isBusy ? "Subscribing" : "Subscribe"}
                </Button>
              </div>
            </FormField>
            <p className="mt-4 text-xs text-offwhite/60">
              We respect your inbox. You can unsubscribe at any time from any email we send.
            </p>
          </form>
        )}
      </Container>
    </section>
  );
}
