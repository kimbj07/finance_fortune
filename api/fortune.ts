/**
 * POST /api/fortune
 *
 * 금전운세 API 엔드포인트
 * - period: 'monthly' | 'weekly'
 * - Upstash Redis 캐시 (월별/주별 TTL)
 * - 일일 예산 관리
 * - 주간 운세는 월간 context 참조 (일관성)
 */

import type { VercelRequest, VercelResponse, ValidationError } from '../lib/types.js'
import {
  checkRateLimitAsync,
  setCorsHeaders,
  setSecurityHeaders,
  handleCorsPrelight,
  getClientIP,
} from '../lib/api-utils.js'
import {
  createApiLogger,
  logRequest,
  logResponse,
  logError,
  logRateLimit,
  logOpenAI,
} from '../lib/logger.js'
import {
  generateFortuneKey,
  getMonthlyPeriodKey,
  getWeeklyPeriodKey,
  getLoanPeriodKey,
  getMonthlyTTL,
  getWeeklyTTL,
  getCached,
  setCached,
} from '../lib/cache.js'
import { checkAndIncrementBudget } from '../lib/budget.js'
import { buildMonthlyPrompt, buildWeeklyPrompt, buildLoanPrompt } from '../lib/prompts.js'
import { BIRTH_HOUR_VALUES } from '../lib/constants.js'

// ── Types ──

interface FortuneRequestBody {
  name: string
  birthDate: string
  birthHour: string
  gender: 'male' | 'female'
  creditScore?: string
  period: 'monthly' | 'weekly' | 'loan'
  sessionId?: string
  monthlyContext?: {
    score: number
    summary: string
  }
}

// ── Validation ──

function validate(body: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  const b = body as Record<string, unknown>

  if (!b || typeof b !== 'object') {
    return [{ field: 'body', message: 'Request body is required' }]
  }

  if (typeof b.name !== 'string' || b.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' })
  }
  if (typeof b.birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.birthDate)) {
    errors.push({ field: 'birthDate', message: 'Birth date must be YYYY-MM-DD format' })
  }
  if (typeof b.birthHour !== 'string' || !BIRTH_HOUR_VALUES.includes(b.birthHour as typeof BIRTH_HOUR_VALUES[number])) {
    errors.push({ field: 'birthHour', message: 'Invalid birth hour' })
  }
  if (b.gender !== 'male' && b.gender !== 'female') {
    errors.push({ field: 'gender', message: 'Gender must be male or female' })
  }
  if (b.period !== 'monthly' && b.period !== 'weekly' && b.period !== 'loan') {
    errors.push({ field: 'period', message: 'Period must be monthly, weekly, or loan' })
  }

  return errors
}

// ── OpenAI Call ──

interface OpenAIMessage {
  role: string
  content: string
}

async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ success: true; data: unknown } | { success: false; error: string }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt } as OpenAIMessage,
          { role: 'user', content: userPrompt } as OpenAIMessage,
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return { success: false, error: `OpenAI API error: ${response.status}` }
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return { success: false, error: 'No content in OpenAI response' }
    }

    const parsed: unknown = JSON.parse(content)
    return { success: true, data: parsed }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Request timeout' }
    }
    return { success: false, error: String(error) }
  }
}

// ── Handler ──

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS + Security headers
  if (handleCorsPrelight(req, res)) return
  setCorsHeaders(req, res)
  setSecurityHeaders(res)

  // Method check
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    return await handlePost(req, res)
  } catch {
    res.status(500).json({ error: '별들이 아직 준비 중이에요... 잠시 후 다시 시도해주세요!' })
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now()
  const log = createApiLogger('fortune')

  const ip = getClientIP(req)
  logRequest(log, 'POST', ip, req.body)

  // Rate limiting
  const rateLimit = await checkRateLimitAsync(req)
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString())
  logRateLimit(log, rateLimit.allowed, rateLimit.remaining, rateLimit.isRedis)

  if (!rateLimit.allowed) {
    logResponse(log, 429, Date.now() - startTime)
    res.status(429).json({ error: '오늘 너무 많은 분들이 운세를 보고 있어요. 잠시 후 다시 시도해주세요!' })
    return
  }

  // Validation
  const errors = validate(req.body)
  if (errors.length > 0) {
    logResponse(log, 400, Date.now() - startTime)
    res.status(400).json({ error: 'Validation failed', details: errors })
    return
  }

  const body = req.body as FortuneRequestBody

  // OpenAI API key check
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    log.error({ event: 'config_error' }, 'OPENAI_API_KEY is not configured')
    logResponse(log, 500, Date.now() - startTime)
    res.status(500).json({ error: '별들이 아직 준비 중이에요... 잠시 후 다시 시도해주세요!' })
    return
  }

  // Cache check
  const periodKey = body.period === 'weekly'
    ? getWeeklyPeriodKey()
    : body.period === 'loan'
    ? getLoanPeriodKey()
    : getMonthlyPeriodKey()
  const cacheKey = generateFortuneKey(body.name, body.birthDate, body.birthHour, body.gender, periodKey)

  const cached = await getCached<unknown>(cacheKey)
  if (cached) {
    logOpenAI(log, 'gpt-4o-mini', 0, true)
    logResponse(log, 200, Date.now() - startTime)
    res.status(200).json({ result: cached, cached: true })
    return
  }

  // Daily budget check
  const budgetOk = await checkAndIncrementBudget()
  if (!budgetOk) {
    logResponse(log, 503, Date.now() - startTime)
    res.status(503).json({ error: '오늘은 별자리의 기운이 너무 강해서 잠시 쉬고 있어요. 내일 다시 찾아와주세요!' })
    return
  }

  // Build prompt
  const { systemPrompt, userPrompt } = body.period === 'monthly'
    ? buildMonthlyPrompt(body.name, body.birthDate, body.birthHour, body.gender, body.creditScore)
    : body.period === 'loan'
    ? buildLoanPrompt(body.name, body.birthDate, body.birthHour, body.gender, body.creditScore)
    : buildWeeklyPrompt(body.name, body.birthDate, body.birthHour, body.gender, body.creditScore, body.monthlyContext)

  // Call OpenAI (with 1 auto retry)
  async function callWithRetry(): Promise<unknown> {
    const first = await callOpenAI(apiKey!, systemPrompt, userPrompt)
    if (first.success) return first.data

    log.warn({ event: 'openai_retry', error: 'success' in first && !first.success ? (first as { error: string }).error : 'unknown' })
    const second = await callOpenAI(apiKey!, systemPrompt, userPrompt)
    if (second.success) return second.data

    return null
  }

  const fortuneData = await callWithRetry()
  if (fortuneData === null) {
    logError(log, 'OpenAI failed after retry', { phase: 'openai' })
    logResponse(log, 502, Date.now() - startTime)
    res.status(502).json({ error: '오늘은 별들이 자리를 잡는 중이에요... 잠시 후 다시 시도해주세요!' })
    return
  }

  // Cache the result
  const ttl = body.period === 'weekly' ? getWeeklyTTL() : getMonthlyTTL()
  await setCached(cacheKey, fortuneData, ttl)

  logOpenAI(log, 'gpt-4o-mini', Date.now() - startTime, false)
  logResponse(log, 200, Date.now() - startTime)

  res.status(200).json({ result: fortuneData, cached: false })
}
