type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  message: string;
  context?: string;
  data?: unknown;
  timestamp?: string;
  service?: string;
}

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private format(level: LogLevel, payload: LogPayload) {
    return {
      level,
      service: payload.service ?? "vestara-api",
      message: payload.message,
      context: payload.context,
      data: payload.data,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };
  }

  private write(level: LogLevel, payload: LogPayload) {
    const log = this.format(level, payload);

    if (this.isDev) {
      // Pretty console output for development
      const color =
        level === "error"
          ? "\x1b[31m"
          : level === "warn"
          ? "\x1b[33m"
          : level === "debug"
          ? "\x1b[36m"
          : "\x1b[32m";

      console.log(color, JSON.stringify(log, null, 2), "\x1b[0m");
    } else {
      // Production: structured logs (JSON)
      console.log(JSON.stringify(log));
    }
  }

  info(message: string, data?: unknown, context?: string) {
    this.write("info", { message, data, context });
  }

  warn(message: string, data?: unknown, context?: string) {
    this.write("warn", { message, data, context });
  }

  error(message: string, data?: unknown, context?: string) {
    this.write("error", { message, data, context });
  }

  debug(message: string, data?: unknown, context?: string) {
    if (!this.isDev) return;
    this.write("debug", { message, data, context });
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();