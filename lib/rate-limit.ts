/**
 * Upstash Redis Rate Limiting
 * - IP당 분당 5회 제한
 * - 인메모리 폴백 (개발용)
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5 // IP당 5회/분

interface RateLimitEntry {
  count: number
  resetTime: number
}
const memoryStore = new Map<string, RateLimitEntry>()

function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit | null {
  if (!isRedisConfigured()) return null

  if (!ratelimit) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_REQUESTS, '1 m'),
      analytics: true,
      prefix: 'fortune:ratelimit',
    })
  }
  return ratelimit
}

function checkMemoryRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()

  if (memoryStore.size > 1000) {
    for (const [key, entry] of memoryStore) {
      if (now > entry.resetTime) memoryStore.delete(key)
    }
  }

  const entry = memoryStore.get(ip)
  if (!entry || now > entry.resetTime) {
    memoryStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  isRedis: boolean
}

export async function checkRateLimitRedis(identifier: string): Promise<RateLimitResult> {
  const limiter = getRatelimit()

  if (!limiter) {
    const result = checkMemoryRateLimit(identifier)
    return { ...result, isRedis: false }
  }

  try {
    const { success, remaining } = await limiter.limit(identifier)
    return { allowed: success, remaining, isRedis: true }
  } catch {
    // Fail closed in production, fallback in dev
    if (process.env.NODE_ENV === 'production') {
      return { allowed: false, remaining: 0, isRedis: false }
    }
    const result = checkMemoryRateLimit(identifier)
    return { ...result, isRedis: false }
  }
}
