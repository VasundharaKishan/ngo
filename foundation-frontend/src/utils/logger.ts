/**
 * Centralized logger utility.
 *
 * - In development mode (import.meta.env.DEV), all levels output to the console.
 * - In production, only `error` outputs (always useful for post-deploy debugging).
 * - Provides optional context prefix for traceability.
 */

const isDev = import.meta.env.DEV;

function formatArgs(context: string | undefined, args: unknown[]): unknown[] {
  return context ? [`[${context}]`, ...args] : args;
}

export const logger = {
  /** Always logs, even in production */
  error(context: string | undefined, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.error(...formatArgs(context, args));
  },

  /** Only logs in development */
  warn(context: string | undefined, ...args: unknown[]): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(...formatArgs(context, args));
    }
  },

  /** Only logs in development */
  info(context: string | undefined, ...args: unknown[]): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.info(...formatArgs(context, args));
    }
  },

  /** Only logs in development */
  debug(context: string | undefined, ...args: unknown[]): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug(...formatArgs(context, args));
    }
  },
};

export default logger;
