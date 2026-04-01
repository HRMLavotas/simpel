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
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};
