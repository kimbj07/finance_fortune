/**
 * API Security Utilities
 */

import { checkRateLimitRedis, type RateLimitResult } from './rate-limit.js'
import type { VercelRequest, VercelResponse, ValidationError } from './types.js'

export type { VercelRequest, VercelResponse, ValidationError }
export type { RateLimitResult }

export function getClientIP(req: VercelRequest): string {
  const headers = req.headers

  const vercelForwarded = headers?.['x-vercel-forwarded-for']
  if (typeof vercelForwarded === 'string' && vercelForwarded.trim()) {
    return vercelForwarded.split(',')[0]!.trim()
  }

  const realIP = headers?.['x-real-ip']
  if (typeof realIP === 'string' && realIP.trim()) {
    return realIP.trim()
  }

  const forwarded = headers?.['x-forwarded-for']
  const forwardedStr = Array.isArray(forwarded) ? forwarded.join(',') : forwarded
  if (typeof forwardedStr === 'string' && forwardedStr.trim()) {
    const ips = forwardedStr.split(',').map(ip => ip.trim()).filter(Boolean)
    if (ips.length > 0) return ips[0]!
  }

  return 'unknown'
}

export async function checkRateLimitAsync(req: VercelRequest): Promise<RateLimitResult> {
  const ip = getClientIP(req)
  return checkRateLimitRedis(ip)
}

const ALLOWED_ORIGINS = [
  'https://financefortune.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
]

export function setCorsHeaders(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers?.origin
  if (typeof origin === 'string' && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export function setSecurityHeaders(res: VercelResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
}

export function handleCorsPrelight(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res)
    res.status(204).end()
    return true
  }
  return false
}

export function sanitizeError(error: unknown, isDev: boolean): string {
  if (isDev && error instanceof Error) return error.message
  return 'Internal server error'
}
