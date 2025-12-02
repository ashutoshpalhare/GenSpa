import "server-only";

import { z } from "zod";

/**
 * Environment validation. Values are parsed once, lazily, so importing this module
 * never throws during static analysis. Secrets are only read here, never exposed to
 * the browser (only NEXT_PUBLIC_* variables reach client bundles).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string("DATABASE_URL is required")
    .min(1, "DATABASE_URL is required")
    .refine((value) => /^postgres(ql)?:\/\//.test(value), "DATABASE_URL must be a PostgreSQL connection string"),
  NEXT_PUBLIC_APP_URL: z.url("NEXT_PUBLIC_APP_URL must be a valid URL").default("http://localhost:3000"),
  APP_NAME: z.string().min(1).default("GenSpa"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  /** Only enable behind a trusted reverse proxy that sets X-Forwarded-For. */
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): AppEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`);
    throw new Error(`Invalid environment configuration -> ${details.join("; ")}`);
  }
  return result.data;
}

let cachedEnv: AppEnv | undefined;

export function getEnv(): AppEnv {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
