import "server-only";

import { z, ZodError } from "zod";
import type { ApiFailure, ApiSuccess, FieldError } from "@/shared/api";
import { getEnv } from "./env";
import { logger } from "./logger";

/** Expected, client-facing error. Anything else becomes a generic 500. */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly errors: FieldError[] = [],
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const httpErrors = {
  badRequest: (message = "Bad request", errors: FieldError[] = []) => new AppError(400, message, errors),
  unauthorized: (message = "Authentication required") => new AppError(401, message),
  forbidden: (message = "You do not have permission to perform this action") => new AppError(403, message),
  notFound: (message = "Resource not found") => new AppError(404, message),
  conflict: (message = "This record already exists") => new AppError(409, message),
  unprocessable: (message: string, errors: FieldError[] = []) => new AppError(422, message, errors),
  tooManyRequests: (message: string, retryAfterSeconds: number) =>
    new AppError(429, message, [], { "Retry-After": String(Math.max(1, retryAfterSeconds)) }),
};

export function successResponse<T>(data: T, message = "Operation completed", status = 200): Response {
  const body: ApiSuccess<T> = { success: true, message, data };
  return Response.json(body, { status });
}

export function errorResponse(
  status: number,
  message: string,
  errors: FieldError[] = [],
  options: { requestId?: string; headers?: Record<string, string> } = {},
): Response {
  const body: ApiFailure = {
    success: false,
    message,
    errors,
    ...(options.requestId ? { requestId: options.requestId } : {}),
  };
  return Response.json(body, { status, headers: options.headers });
}

export function zodIssuesToFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "root",
    message: issue.message,
  }));
}

export function handleRouteError(error: unknown, requestId: string): Response {
  if (error instanceof AppError) {
    return errorResponse(error.statusCode, error.message, error.errors, { headers: error.headers });
  }
  if (error instanceof ZodError) {
    return errorResponse(422, "Validation failed", zodIssuesToFieldErrors(error));
  }
  if (error instanceof SyntaxError) {
    return errorResponse(400, "Request body must be valid JSON");
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
    return errorResponse(409, "A record with the same unique value already exists");
  }

  logger.error("Unhandled API error", {
    requestId,
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error),
  });
  return errorResponse(500, "Something went wrong. Please try again.", [], { requestId });
}

/** Wraps a route handler so every failure is converted into the standard error envelope. */
export function apiHandler(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    try {
      return await handler(request);
    } catch (error) {
      return handleRouteError(error, requestId);
    }
  };
}

/** Parses and validates a JSON body. Malformed JSON -> 400, schema failures -> 422. */
export async function parseJsonBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.output<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw httpErrors.badRequest("Request body must be valid JSON");
  }
  return schema.parse(raw) as z.output<T>;
}

/** Client IP for rate limiting. Forwarded headers are only trusted when TRUST_PROXY=true. */
export function getClientIp(request: Request): string {
  if (getEnv().TRUST_PROXY) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() || "unknown";
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
  }
  return "unknown";
}
