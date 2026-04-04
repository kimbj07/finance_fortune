/**
 * 일일 OpenAI 예산 관리
 *
 * Upstash Redis에 일별 카운터 저장.
 * 상한 초과 시 요청 차단.
 */

import { Redis } from '@upstash/redis'

const DAILY_BUDGET_MAX = 20000 // 일일 최대 요청 수 (~$20)
const BUDGET_PREFIX = 'fortune:budget:'

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

function getTodayKey(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000) // KST
  const dateStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  return `${BUDGET_PREFIX}${dateStr}`
}

/** 예산 체크 및 카운터 증가. true면 요청 가능, false면 예산 초과 */
export async function checkAndIncrementBudget(): Promise<boolean> {
  const redis = getRedisClient()
  if (!redis) return true // Redis 없으면 제한 없음 (개발 환경)

  const key = getTodayKey()
  try {
    const count = await redis.incr(key)
    // 첫 요청 시 TTL 설정 (24시간)
    if (count === 1) {
      await redis.expire(key, 86400)
    }
    return count <= DAILY_BUDGET_MAX
  } catch {
    // Fail closed: Redis 에러 시 요청 차단 (프로덕션 보호)
    return false
  }
}
