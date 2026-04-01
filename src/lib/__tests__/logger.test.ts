/**
 * Tests for logger utility
 * Tests logging behavior in development and production modes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it('should have log method', () => {
    expect(logger.log).toBeDefined();
    expect(typeof logger.log).toBe('function');
  });

  it('should have error method', () => {
    expect(logger.error).toBeDefined();
    expect(typeof logger.error).toBe('function');
  });

  it('should have warn method', () => {
    expect(logger.warn).toBeDefined();
    expect(typeof logger.warn).toBe('function');
  });

  it('should have debug method', () => {
    expect(logger.debug).toBeDefined();
    expect(typeof logger.debug).toBe('function');
  });

  it('should always log errors', () => {
    logger.error('error message');
    expect(console.error).toHaveBeenCalledWith('error message');
  });

  it('should support multiple arguments', () => {
    logger.error('error', 'with', 'multiple', 'args');
    expect(console.error).toHaveBeenCalledWith('error', 'with', 'multiple', 'args');
  });
});
