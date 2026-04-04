/**
 * Structured Logging with Pino
 */
import pino from 'pino'

export function createApiLogger(endpoint: string) {
  return pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    base: { service: 'finance-fortune', endpoint },
  })
}

export function logRequest(log: pino.Logger, method: string, ip: string, body: unknown): void {
  log.info({ event: 'request', method, ip, bodyKeys: body && typeof body === 'object' ? Object.keys(body) : [] })
}

export function logResponse(log: pino.Logger, status: number, durationMs: number): void {
  log.info({ event: 'response', status, durationMs })
}

export function logError(log: pino.Logger, error: unknown, context?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error)
  log.error({ event: 'error', error: message, ...context })
}

export function logRateLimit(log: pino.Logger, allowed: boolean, remaining: number, isRedis: boolean): void {
  if (!allowed) {
    log.warn({ event: 'rate_limit_exceeded', remaining, isRedis })
  }
}

export function logOpenAI(log: pino.Logger, model: string, durationMs: number, cached: boolean): void {
  log.info({ event: 'openai_call', model, durationMs, cached })
}
