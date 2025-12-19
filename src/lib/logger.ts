type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const emoji = { info: "ℹ️", warn: "⚠️", error: "❌" }[level];

  console.groupCollapsed(`${emoji} [${timestamp}] ${message}`);
  if (context) {
    Object.entries(context).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
  }
  console.groupEnd();
}

export const logger = {
  info: (message: string, context?: LogContext) =>
    formatLog("info", message, context),
  warn: (message: string, context?: LogContext) =>
    formatLog("warn", message, context),
  error: (message: string, context?: LogContext) =>
    formatLog("error", message, context),
};
