import "server-only";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function currentMinimumLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL;
  return configured && configured in LEVEL_WEIGHT ? (configured as LogLevel) : "info";
}

/** Structured JSON logs. Never pass passwords, tokens or payment secrets as metadata. */
function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[currentMinimumLevel()]) {
    return;
  }
  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...meta });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};
