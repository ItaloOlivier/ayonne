/**
 * Structured Logger
 *
 * A simple structured logging utility for consistent log output.
 * In production, this can be extended to send logs to external services
 * like Datadog, LogRocket, or CloudWatch.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Default to 'info' in production, 'debug' in development
const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatLogEntry(entry: LogEntry): string {
  // In production, output JSON for log aggregation
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry)
  }

  // In development, output human-readable format
  const levelPadded = entry.level.toUpperCase().padEnd(5)
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
  const errorStr = entry.error ? `\n  Error: ${entry.error.message}` : ''

  return `[${entry.timestamp}] ${levelPadded} ${entry.message}${contextStr}${errorStr}`
}

function createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  if (context && Object.keys(context).length > 0) {
    // Sanitize context to remove sensitive data
    entry.context = sanitizeContext(context)
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }
  }

  return entry
}

// Remove sensitive data from log context
function sanitizeContext(context: LogContext): LogContext {
  const sensitiveKeys = [
    'password', 'token', 'apiKey', 'secret', 'authorization',
    'cookie', 'session', 'credit', 'ssn', 'email', 'phone',
  ]

  const sanitized: LogContext = {}

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase()

    // Check if key contains sensitive keywords
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects (but limit depth)
      sanitized[key] = sanitizeContext(value as LogContext)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return
    const entry = createLogEntry('debug', message, context)
    console.log(formatLogEntry(entry))
  },

  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return
    const entry = createLogEntry('info', message, context)
    console.log(formatLogEntry(entry))
  },

  warn(message: string, context?: LogContext): void {
    if (!shouldLog('warn')) return
    const entry = createLogEntry('warn', message, context)
    console.warn(formatLogEntry(entry))
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!shouldLog('error')) return
    const err = error instanceof Error ? error : undefined
    const entry = createLogEntry('error', message, context, err)
    console.error(formatLogEntry(entry))
  },

  // Create a child logger with default context
  child(defaultContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        logger.warn(message, { ...defaultContext, ...context }),
      error: (message: string, error?: Error | unknown, context?: LogContext) =>
        logger.error(message, error, { ...defaultContext, ...context }),
    }
  },
}

// Pre-configured loggers for common modules
export const apiLogger = logger.child({ module: 'api' })
export const authLogger = logger.child({ module: 'auth' })
export const analysisLogger = logger.child({ module: 'skin-analysis' })
export const shopifyLogger = logger.child({ module: 'shopify' })
export const growthLogger = logger.child({ module: 'growth' })
