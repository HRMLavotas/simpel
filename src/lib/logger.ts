/**
 * Logger utility for SIMPEL application
 * Conditionally logs based on environment (development vs production)
 * 
 * Usage:
 * - logger.log() - Only logs in development
 * - logger.error() - Always logs (errors should always be visible)
 * - logger.warn() - Only logs in development
 * - logger.debug() - Only logs in development
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};
