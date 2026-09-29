type LogLevel = "debug" | "info" | "warn" | "error";
type LogLevelSetting = LogLevel | "silent";

const levelWeights: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isTestRun = process.env.NODE_ENV === "test" || Boolean(process.env.NODE_TEST_CONTEXT);

const resolveLevel = (): LogLevelSetting => {
  if (isTestRun) return "silent";
  const configured = (process.env.LOG_LEVEL || "info").toLowerCase();
  if (configured === "silent") return "silent";
  if (configured in levelWeights) return configured as LogLevel;
  return "info";
};

const activeLevel = resolveLevel();

const enabled = (level: LogLevel) =>
  activeLevel !== "silent" && levelWeights[level] >= levelWeights[activeLevel as LogLevel];

const serialize = (meta?: Record<string, unknown>) => {
  if (!meta) return "";
  const entries = Object.entries(meta).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return "";
  try {
    return ` ${JSON.stringify(Object.fromEntries(entries))}`;
  } catch {
    return "";
  }
};

const emit = (level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>) => {
  if (!enabled(level)) return;
  const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} [${scope}] ${message}${serialize(meta)}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
};

export type Logger = {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

export const createLogger = (scope: string): Logger => ({
  debug: (message, meta) => emit("debug", scope, message, meta),
  info: (message, meta) => emit("info", scope, message, meta),
  warn: (message, meta) => emit("warn", scope, message, meta),
  error: (message, meta) => emit("error", scope, message, meta),
});

export const describeError = (error: unknown): string => {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause !== undefined && cause !== error) {
      return `${error.message || error.name} (cause: ${describeError(cause)})`;
    }
    return error.message || error.name;
  }
  return String(error);
};

export const logger = createLogger("app");
