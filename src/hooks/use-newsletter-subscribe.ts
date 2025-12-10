"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiClientError, newsletterApi } from "@/services/api-client";

/** Newsletter subscription mutation with toast feedback. Returns the server envelope. */
export function useNewsletterSubscribe() {
  return useMutation({
    mutationFn: (email: string) => newsletterApi.subscribe(email),
    onSuccess: (response) => {
      toast.success(response.message);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "We could not save your email right now. Please try again.",
      );
    },
  });
}
