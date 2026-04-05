/**
 * Redis Cache for Fortune Results
 *
 * Cache TTL Policy:
 * - monthly: 해당 월 마지막 날까지 (KST)
 * - weekly: 해당 주 일요일 23:59:59까지 (KST)
 *
 * Security: Cache keys are SHA-256 hashed to prevent PII exposure.
 */

import { createHash } from 'crypto'
import { Redis } from '@upstash/redis'

const CACHE_PREFIX = 'fortune:result:'
const KST_OFFSET = 9 * 60 * 60 * 1000

// In-memory fallback cache
interface CacheEntry<T> {
  data: T
  expiresAt: number
}
const memoryCache = new Map<string, CacheEntry<unknown>>()

function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (!isRedisConfigured()) return null
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redisClient
}

/**
 * 캐시 키 생성 (SHA-256 해시)
 * 형식: name|YYYYMMDD|hour|gender|period_identifier
 */
export function generateFortuneKey(
  name: string,
  birthDate: string,
  birthHour: string,
  gender: 'male' | 'female',
  periodKey: string,
): string {
  const identifier = `${name}|${birthDate}|${birthHour}|${gender}|${periodKey}`
  const hash = createHash('sha256').update(identifier).digest('hex')
  return `${CACHE_PREFIX}${hash.slice(0, 32)}`
}

/** 현재 월의 period key (예: monthly:2026-04) */
export function getMonthlyPeriodKey(): string {
  const now = new Date(Date.now() + KST_OFFSET)
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `monthly:${year}-${month}`
}

/** 현재 월의 대출운 period key (예: loan:2026-04) */
export function getLoanPeriodKey(): string {
  const now = new Date(Date.now() + KST_OFFSET)
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `loan:${year}-${month}`
}

/** 현재 주의 period key (예: weekly:2026-W14) */
export function getWeeklyPeriodKey(): string {
  const now = new Date(Date.now() + KST_OFFSET)
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000) + 1
  const weekNumber = Math.ceil(dayOfYear / 7)
  return `weekly:${now.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

/** 월간 운세 TTL: 해당 월 마지막 날까지 (KST) */
export function getMonthlyTTL(): number {
  const now = new Date(Date.now() + KST_OFFSET)
  const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59))
  const ttlMs = endOfMonth.getTime() - now.getTime()
  return Math.max(Math.floor(ttlMs / 1000), 3600) // 최소 1시간
}

/** 주간 운세 TTL: 해당 주 일요일 23:59:59까지 (KST) */
export function getWeeklyTTL(): number {
  const now = new Date(Date.now() + KST_OFFSET)
  const dayOfWeek = now.getUTCDay() // 0=일, 1=월, ...
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  const endOfWeek = new Date(now)
  endOfWeek.setUTCDate(now.getUTCDate() + daysUntilSunday)
  endOfWeek.setUTCHours(23, 59, 59, 999)
  const ttlMs = endOfWeek.getTime() - now.getTime()
  return Math.max(Math.floor(ttlMs / 1000), 3600) // 최소 1시간
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedisClient()

  if (redis) {
    try {
      return await redis.get<T>(key)
    } catch {
      // Fall through to memory cache
    }
  }

  const entry = memoryCache.get(key) as CacheEntry<T> | undefined
  if (entry && Date.now() < entry.expiresAt) return entry.data
  if (entry) memoryCache.delete(key)
  return null
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient()

  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds })
      return
    } catch {
      // Fall through to memory cache
    }
  }

  if (memoryCache.size > 200) {
    const now = Date.now()
    for (const [k, v] of memoryCache) {
      if (now > v.expiresAt) memoryCache.delete(k)
    }
    if (memoryCache.size > 200) {
      const entries = Array.from(memoryCache.entries())
      entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt)
      for (let i = 0; i < entries.length - 100; i++) {
        memoryCache.delete(entries[i]![0])
      }
    }
  }

  memoryCache.set(key, { data: value, expiresAt: Date.now() + ttlSeconds * 1000 })
}
