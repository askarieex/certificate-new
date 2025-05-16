/**
 * Logging utilities for the application
 */

import { DEBUG_MODE } from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  timestamp?: boolean;
  prefix?: string;
}

const defaultOptions: LogOptions = {
  timestamp: true,
  prefix: '',
};

/**
 * Format log message with timestamp and prefix
 */
const formatLogMessage = (message: string, level: LogLevel, options: LogOptions = defaultOptions): string => {
  const parts: string[] = [];
  
  // Add timestamp if enabled
  if (options.timestamp) {
    const now = new Date();
    parts.push(`[${now.toISOString()}]`);
  }
  
  // Add log level
  parts.push(`[${level.toUpperCase()}]`);
  
  // Add prefix if provided
  if (options.prefix) {
    parts.push(`[${options.prefix}]`);
  }
  
  // Add message
  parts.push(message);
  
  return parts.join(' ');
};

/**
 * Logger utility
 */
export const logger = {
  debug: (message: string, data?: any, options?: LogOptions) => {
    if (DEBUG_MODE) {
      const formattedMessage = formatLogMessage(message, 'debug', options);
      if (data) {
        console.debug(formattedMessage, data);
      } else {
        console.debug(formattedMessage);
      }
    }
  },
  
  info: (message: string, data?: any, options?: LogOptions) => {
    const formattedMessage = formatLogMessage(message, 'info', options);
    if (data) {
      console.info(formattedMessage, data);
    } else {
      console.info(formattedMessage);
    }
  },
  
  warn: (message: string, data?: any, options?: LogOptions) => {
    const formattedMessage = formatLogMessage(message, 'warn', options);
    if (data) {
      console.warn(formattedMessage, data);
    } else {
      console.warn(formattedMessage);
    }
  },
  
  error: (message: string, error?: any, options?: LogOptions) => {
    const formattedMessage = formatLogMessage(message, 'error', options);
    if (error) {
      console.error(formattedMessage, error);
    } else {
      console.error(formattedMessage);
    }
  },
  
  /**
   * Start timing a process for performance logging
   */
  time: (label: string) => {
    if (DEBUG_MODE) {
      console.time(label);
    }
  },
  
  /**
   * End timing a process and log the result
   */
  timeEnd: (label: string) => {
    if (DEBUG_MODE) {
      console.timeEnd(label);
    }
  },
  
  /**
   * Group related log messages
   */
  group: (label: string) => {
    if (DEBUG_MODE) {
      console.group(label);
    }
  },
  
  /**
   * End a group of log messages
   */
  groupEnd: () => {
    if (DEBUG_MODE) {
      console.groupEnd();
    }
  },
  
  /**
   * Log application startup info
   */
  logStartup: () => {
    logger.info('╔════════════════════════════════════════════╗');
    logger.info('║ Certificate Generator Application Started   ║');
    logger.info('║ Environment: ' + (DEBUG_MODE ? 'Development' : 'Production') + '                   ║');
    logger.info('╚════════════════════════════════════════════╝');
  },
};

// Log startup when this file is first imported
if (typeof window !== 'undefined') {
  logger.logStartup();
} 