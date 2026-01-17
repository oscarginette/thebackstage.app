/**
 * Logger Infrastructure
 *
 * Provides structured logging with correlation IDs for request tracing.
 * Implements Clean Architecture + SOLID principles.
 *
 * Features:
 * - Structured logging (JSON in production, pretty print in dev)
 * - Correlation ID support for distributed tracing
 * - Type-safe logging interface
 * - Context enrichment
 */

/**
 * ILogger Interface
 *
 * Dependency Inversion: Domain layer depends on this interface,
 * not on concrete Logger implementation.
 */
export interface ILogger {
  /**
   * Log debug information (verbose, development-only)
   */
  debug(message: string, context?: Record<string, unknown>): void;

  /**
   * Log informational messages (normal operations)
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Log warnings (recoverable issues)
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Log errors (failures, exceptions)
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void;

  /**
   * Create scoped logger with correlation ID for request tracing
   */
  withCorrelationId(correlationId: string): ILogger;
}

/**
 * Log Level Type
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log Entry Structure
 */
interface LogEntry {
  level: LogLevel;
  service: string;
  correlationId?: string;
  message: string;
  timestamp: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
}

/**
 * Logger Implementation
 *
 * Concrete implementation of ILogger with structured logging.
 *
 * Usage:
 * ```typescript
 * const logger = new Logger('SendEmailUseCase');
 * logger.info('Email sent', { emailId: 123 });
 *
 * // With correlation ID (for request tracing)
 * const scopedLogger = logger.withCorrelationId(requestId);
 * scopedLogger.error('Failed to send', error, { emailId: 123 });
 * ```
 */
export class Logger implements ILogger {
  constructor(
    private service: string,
    private correlationId?: string
  ) {}

  debug(message: string, context?: Record<string, unknown>): void {
    // Skip debug logs in production unless explicitly enabled
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_LOGS) {
      return;
    }

    this.log('debug', message, undefined, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, undefined, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, undefined, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, error, context);
  }

  withCorrelationId(correlationId: string): ILogger {
    return new Logger(this.service, correlationId);
  }

  /**
   * Core logging method (private)
   *
   * Single Responsibility: Formats and outputs log entries
   */
  private log(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const logEntry: LogEntry = {
      level,
      service: this.service,
      correlationId: this.correlationId,
      message,
      timestamp: new Date().toISOString(),
    };

    // Add error details if present
    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Add additional context if present
    if (context) {
      logEntry.context = context;
    }

    // Output format depends on environment
    if (process.env.NODE_ENV === 'production') {
      // Production: JSON structured logs (for log aggregation tools)
      this.outputJson(logEntry);
    } else {
      // Development: Pretty print for human readability
      this.outputPretty(logEntry);
    }
  }

  /**
   * Output JSON structured log (production)
   */
  private outputJson(logEntry: LogEntry): void {
    const output = JSON.stringify(logEntry);

    // Use appropriate console method based on level
    switch (logEntry.level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  /**
   * Output pretty-printed log (development)
   */
  private outputPretty(logEntry: LogEntry): void {
    const levelColor = this.getLevelColor(logEntry.level);
    const levelLabel = logEntry.level.toUpperCase().padEnd(5);

    // Base message with correlation ID if present
    const correlationId = logEntry.correlationId
      ? ` [${logEntry.correlationId}]`
      : '';

    let message = `${levelColor}[${levelLabel}]${correlationId} [${logEntry.service}] ${logEntry.message}\x1b[0m`;

    // Append context if present
    if (logEntry.context && Object.keys(logEntry.context).length > 0) {
      message += '\n  Context: ' + JSON.stringify(logEntry.context, null, 2);
    }

    // Append error details if present
    if (logEntry.error) {
      message += '\n  Error: ' + logEntry.error.name + ': ' + logEntry.error.message;
      if (logEntry.error.stack) {
        message += '\n  Stack:\n    ' + logEntry.error.stack.split('\n').join('\n    ');
      }
    }

    // Use appropriate console method based on level
    switch (logEntry.level) {
      case 'debug':
        console.debug(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
    }
  }

  /**
   * Get ANSI color code for log level (development pretty print)
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '\x1b[36m'; // Cyan
      case 'info':
        return '\x1b[32m'; // Green
      case 'warn':
        return '\x1b[33m'; // Yellow
      case 'error':
        return '\x1b[31m'; // Red
    }
  }
}

/**
 * Create Logger Factory
 *
 * Helper function to create logger instances with service name.
 *
 * Usage:
 * ```typescript
 * const logger = createLogger('SendEmailUseCase');
 * ```
 */
export function createLogger(service: string): ILogger {
  return new Logger(service);
}
