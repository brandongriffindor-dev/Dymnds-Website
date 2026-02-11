/**
 * Structured JSON logger for production observability [INF-106].
 *
 * Outputs structured JSON to stdout/stderr for Vercel Logs ingestion.
 * Vercel automatically parses JSON log lines into searchable, filterable fields.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('Order created', { orderId: '123', total: 99.99 });
 *   logger.error('Payment failed', { orderId: '123' }, error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// PII fields to mask in log output
const PII_FIELDS = new Set(['email', 'customer_email', 'customerEmail', 'phone', 'password', 'token', 'idToken', 'creditCard', 'ssn', 'orderId']);

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  if (local.length <= 2) return `${local}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

function maskOrderId(id: string): string {
  if (id.length <= 4) return '****';
  return `${id.slice(0, 4)}****`;
}

function maskPII(context: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...context };
  for (const [key, value] of Object.entries(masked)) {
    if (typeof value === 'string') {
      if (key === 'email' || key === 'customer_email' || key === 'customerEmail') {
        masked[key] = maskEmail(value);
      } else if (key === 'orderId' || key === 'order_id') {
        masked[key] = maskOrderId(value);
      } else if (PII_FIELDS.has(key)) {
        // Show first 3 chars + mask remainder
        masked[key] = value.length > 3 ? value.slice(0, 3) + '***' : '***';
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      masked[key] = maskPII(value as Record<string, unknown>);
    }
  }
  return masked;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: unknown
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = maskPII(context);
  }

  if (error instanceof Error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else if (error) {
    entry.error = {
      name: 'UnknownError',
      message: String(error),
    };
  }

  return entry;
}

function emit(entry: LogEntry): void {
  const json = JSON.stringify(entry);

  if (entry.level === 'error' || entry.level === 'warn') {
    console.error(json);
  } else {
    console.log(json);
  }
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      emit(createLogEntry('debug', message, context));
    }
  },

  info(message: string, context?: Record<string, unknown>): void {
    emit(createLogEntry('info', message, context));
  },

  warn(message: string, context?: Record<string, unknown>, error?: unknown): void {
    emit(createLogEntry('warn', message, context, error));
  },

  error(message: string, context?: Record<string, unknown>, error?: unknown): void {
    emit(createLogEntry('error', message, context, error));
  },
};
