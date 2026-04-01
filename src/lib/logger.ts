/**
 * Logger utility for development and production environments
 * 
 * Usage:
 * - logger.log() - Only logs in development
 * - logger.error() - Always logs (for error tracking)
 * - logger.warn() - Only logs in development
 * - logger.debug() - Only logs in development
 * 
 * In production, only errors are logged to prevent:
 * - Performance degradation
 * - Sensitive data exposure
 * - Console clutter
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log general information (development only)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log errors (always logged, even in production)
   * TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
   */
  error: (...args: any[]) => {
    console.error(...args);
    
    // TODO: Send to error tracking service
    // Example:
    // if (!isDev) {
    //   Sentry.captureException(args[0]);
    // }
  },

  /**
   * Log warnings (development only)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log debug information (development only)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log with custom prefix (development only)
   */
  info: (prefix: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[${prefix}]`, ...args);
    }
  },

  /**
   * Group logs (development only)
   */
  group: (label: string, fn: () => void) => {
    if (isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
};

/**
 * Performance logger for measuring execution time
 */
export const perfLogger = {
  start: (label: string) => {
    if (isDev) {
      console.time(label);
    }
  },
  
  end: (label: string) => {
    if (isDev) {
      console.timeEnd(label);
    }
  },
};
