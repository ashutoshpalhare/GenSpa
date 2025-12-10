import type { ApiResponse, ApiSuccess, FieldError } from "@/shared/api";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Typed fetch wrapper for the /api/v1 contract. Resolves with the full success envelope
 * and throws ApiClientError (with server field errors) for every failure.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<ApiSuccess<T>> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  } catch {
    throw new ApiClientError("Network error. Please check your connection and try again.", 0);
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success === false) {
    const failure = payload && payload.success === false ? payload : null;
    throw new ApiClientError(
      failure?.message ?? "Something went wrong. Please try again.",
      response.status,
      failure?.errors ?? [],
    );
  }

  return payload;
}

export const newsletterApi = {
  subscribe: (email: string) =>
    apiRequest<{ status: "subscribed" | "resubscribed" | "already_subscribed" }>("/api/v1/newsletter", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};
