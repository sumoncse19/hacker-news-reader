const LOG_LEVELS = ["error", "warn", "info", "debug"] as const;

function log(level: (typeof LOG_LEVELS)[number], message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, message, ...(meta ? { meta } : {}) };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  error: (message: string, meta?: unknown) => log("error", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  info: (message: string, meta?: unknown) => log("info", message, meta),
  debug: (message: string, meta?: unknown) => log("debug", message, meta),
};
